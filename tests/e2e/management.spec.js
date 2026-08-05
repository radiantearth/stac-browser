/**
* Management (CRUD) tests for the STAC Transaction and Collection Transaction
* extensions.
*
* Verifies that the "Manage" dropdown appears only when a server advertises the
* relevant transaction conformance class, that create/edit/delete issue the
* correct HTTP requests (POST/PUT/DELETE), that the OPTIONS preflight `Allow`
* header gates the controls, and that permission errors are surfaced.
*
* The management UI defaults to requiring login + an OPTIONS preflight; tests
* relax these via `enableTransactions()` (which injects config before boot)
* unless they specifically exercise the preflight.
*/
import { readFileSync } from 'node:fs';
import { test, expect } from './fixtures.js';
import { http, HttpResponse } from 'msw';
import {
  enableTransactions,
  configureBrowser,
  mockOptions,
  mockTransaction,
  openManageMenu,
  waitForBrowserReady
} from './helpers.js';
import API from '../fixtures/instances/api.js';

const itemSchema = JSON.parse(readFileSync(new URL('../fixtures/schemas/item-minimal.json', import.meta.url), 'utf-8'));

function createItemApi() {
  const api = API.minimalApi().addItemTransactionsExtension();
  const collection = api.addCollection('collection')
    .setMetadata({ title: 'Test Collection' });
  const [item] = api.addManyItems(collection, 1);
  return { api, collection, item };
}

function createCollectionApi() {
  const api = API.minimalApi().addCollectionTransactionsExtension();
  const collection = api.addCollection('collection')
    .setMetadata({ title: 'Test Collection' });
  return { api, collection };
}

function enablePreflight(page) {
  return configureBrowser(page, {
    transactions: 'auto',
    transactionsRequireLogin: false,
    transactionsRequirePreflight: true
  });
}

test.describe('Management - capability gating', () => {
  test('no "Manage" control without transaction conformance', async ({ page, worker }) => {
    const api = API.minimalApi();
    const collection = api.addCollection('collection').setMetadata({ title: 'Test Collection' });
    const [item] = api.addManyItems(collection, 1);
    await api.createServer(worker);
    await enableTransactions(page);

    await page.goto(item.getBrowserPath());
    await waitForBrowserReady(page);
    await expect(page.getByRole('heading', { name: new RegExp(item.data.id, 'i') })).toBeVisible();

    await expect(page.getByRole('button', { name: /manage/i })).toHaveCount(0);
  });

  test('item with transaction conformance shows Edit and Delete', async ({ page, worker }) => {
    const { api, item } = createItemApi();
    await api.createServer(worker);
    await enableTransactions(page);

    await page.goto(item.getBrowserPath());
    await waitForBrowserReady(page);

    await openManageMenu(page);
    await expect(page.getByRole('menuitem', { name: 'Edit' })).toBeVisible();
    await expect(page.getByRole('menuitem', { name: 'Delete' })).toBeVisible();
  });

  test('Manage stays available when navigating to a management page and back', async ({ page, worker }) => {
    const { api, collection } = createCollectionApi();
    await api.createServer(worker);
    await enableTransactions(page);

    await page.goto(api.root.getBrowserPath());
    await waitForBrowserReady(page);

    // Navigate to the "Add Collection" page and back (in-app navigation)
    let menu = await openManageMenu(page);
    await menu.getByRole('menuitem', { name: 'Add Collection' }).click();
    await expect(page.getByRole('heading', { name: /add collection/i })).toBeVisible();
    await page.goBack();
    await waitForBrowserReady(page);

    // The Manage button must still be available on the root page ...
    menu = await openManageMenu(page);
    await expect(menu.getByRole('menuitem', { name: 'Add Collection' })).toBeVisible();
    await page.keyboard.press('Escape');

    // ... and on a collection page that is visited afterwards
    await page.getByRole('link', { name: new RegExp(collection.getMetadata().title) }).first().click();
    await waitForBrowserReady(page);
    menu = await openManageMenu(page);
    await expect(menu.getByRole('menuitem', { name: 'Edit' })).toBeVisible();
    await expect(menu.getByRole('menuitem', { name: 'Delete' })).toBeVisible();
  });

  test('switching between management pages of the same entity loads the page', async ({ page, worker }) => {
    const api = API.minimalApi().addItemTransactionsExtension().addCollectionTransactionsExtension();
    const collection = api.addCollection('collection').setMetadata({ title: 'Test Collection' });
    api.addManyItems(collection, 1);
    await api.createServer(worker);
    await enableTransactions(page);

    await page.goto('/management/edit' + collection.getBrowserPath());
    await waitForBrowserReady(page);
    await expect(page.getByRole('heading', { name: /^edit/i })).toBeVisible();

    // Switch from Edit to Add Item: same view and path, only the mode changes
    const menu = await openManageMenu(page);
    await menu.getByRole('menuitem', { name: 'Add Item' }).click();
    await expect(page.getByRole('heading', { name: /add item/i })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Save' })).toBeVisible();
  });

  test('switching from Edit to Add Item works on a slow network with preflight', async ({ page, worker }) => {
    const api = API.minimalApi().addItemTransactionsExtension().addCollectionTransactionsExtension();
    const collection = api.addCollection('collection').setMetadata({ title: 'Test Collection' });
    api.addManyItems(collection, 1);
    await api.createServer(worker);
    await mockOptions(worker, collection.getAbsoluteUrl(), ['GET', 'PUT', 'DELETE', 'POST']);
    await mockOptions(worker, collection.getAbsoluteUrl() + '/items', ['GET', 'POST']);
    await enableTransactions(page, { transactionsRequirePreflight: true });

    // Simulate a slow network for all API responses
    await page.route('**/stac.example/**', async route => {
      await new Promise(resolve => {
        setTimeout(resolve, 400);
      });
      await route.fallback();
    });

    await page.goto(collection.getBrowserPath());
    await waitForBrowserReady(page);

    let menu = await openManageMenu(page);
    await menu.getByRole('menuitem', { name: 'Edit' }).click();
    await expect(page.getByRole('heading', { name: /^edit/i })).toBeVisible();
    await expect(page.locator('.cm-content')).toContainText('"type": "Collection"');

    menu = await openManageMenu(page);
    await menu.getByRole('menuitem', { name: 'Add Item' }).click();

    // Let the async loads (delayed by the slow-network route) settle so a late
    // response can't leave the page in a broken state after we assert.
    await page.waitForLoadState('networkidle');
    await expect(page.getByRole('heading', { name: /add item/i })).toBeVisible();
    await expect(page.locator('.cm-content')).toContainText('"type": "Feature"');
    await expect(page.getByRole('button', { name: /manage/i })).toBeVisible();
  });
});

test.describe('Management - external forms', () => {
  const EDIT_FORM_URL = 'https://editor.example/edit';
  const CREATE_FORM_URL = 'https://editor.example/create';

  test('an edit-form link replaces the internal Edit action in auto mode', async ({ page, worker }) => {
    const { api, item } = createItemApi();
    item.addLink({ href: EDIT_FORM_URL, rel: 'edit-form', title: 'Edit externally' });
    await api.createServer(worker);
    await enableTransactions(page);

    await page.goto(item.getBrowserPath());
    await waitForBrowserReady(page);

    await openManageMenu(page);
    const external = page.getByRole('menuitem', { name: 'Edit externally' });
    await expect(external).toBeVisible();
    await expect(external).toHaveAttribute('href', EDIT_FORM_URL);
    await expect(external).toHaveAttribute('target', '_blank');
    await expect(page.getByRole('menuitem', { name: 'Edit', exact: true })).toHaveCount(0);
    // Delete has no external counterpart and stays available
    await expect(page.getByRole('menuitem', { name: 'Delete' })).toBeVisible();
  });

  test('a create-form link replaces the internal Add actions in auto mode', async ({ page, worker }) => {
    const api = API.minimalApi().addItemTransactionsExtension().addCollectionTransactionsExtension();
    api.addCollection('collection').setMetadata({ title: 'Test Collection' });
    api.root.addLink({ href: CREATE_FORM_URL, rel: 'create-form', title: 'Create externally' });
    await api.createServer(worker);
    await enableTransactions(page);

    await page.goto(api.root.getBrowserPath());
    await waitForBrowserReady(page);

    await openManageMenu(page);
    await expect(page.getByRole('menuitem', { name: 'Create externally' })).toBeVisible();
    await expect(page.getByRole('menuitem', { name: 'Add Collection' })).toHaveCount(0);
    await expect(page.getByRole('menuitem', { name: 'Add Item' })).toHaveCount(0);
  });

  test('external mode shows links without login and hides the internal actions', async ({ page, worker }) => {
    const { api, item } = createItemApi();
    item.addLink({ href: EDIT_FORM_URL, rel: 'edit-form', title: 'Edit externally' });
    await api.createServer(worker);
    // Login and preflight requirements stay at their defaults (true),
    // they must not affect external links
    await configureBrowser(page, { transactions: 'external' });

    await page.goto(item.getBrowserPath());
    await waitForBrowserReady(page);

    await openManageMenu(page);
    await expect(page.getByRole('menuitem', { name: 'Edit externally' })).toBeVisible();
    await expect(page.getByRole('menuitem', { name: 'Edit', exact: true })).toHaveCount(0);
    await expect(page.getByRole('menuitem', { name: 'Delete' })).toHaveCount(0);
  });

  test('external mode without form links shows no Manage control', async ({ page, worker }) => {
    const { api, item } = createItemApi();
    await api.createServer(worker);
    await configureBrowser(page, { transactions: 'external' });

    await page.goto(item.getBrowserPath());
    await waitForBrowserReady(page);
    await expect(page.getByRole('heading', { name: new RegExp(item.data.id, 'i') })).toBeVisible();

    await expect(page.getByRole('button', { name: /manage/i })).toHaveCount(0);
  });

  test('internal mode ignores form links', async ({ page, worker }) => {
    const { api, item } = createItemApi();
    item.addLink({ href: EDIT_FORM_URL, rel: 'edit-form', title: 'Edit externally' });
    await api.createServer(worker);
    await enableTransactions(page, { transactions: 'internal' });

    await page.goto(item.getBrowserPath());
    await waitForBrowserReady(page);

    await openManageMenu(page);
    await expect(page.getByRole('menuitem', { name: 'Edit', exact: true })).toBeVisible();
    await expect(page.getByRole('menuitem', { name: 'Edit externally' })).toHaveCount(0);
  });

  test('off disables all management capabilities', async ({ page, worker }) => {
    const { api, item } = createItemApi();
    item.addLink({ href: EDIT_FORM_URL, rel: 'edit-form', title: 'Edit externally' });
    await api.createServer(worker);
    await enableTransactions(page, { transactions: 'off' });

    await page.goto(item.getBrowserPath());
    await waitForBrowserReady(page);
    await expect(page.getByRole('heading', { name: new RegExp(item.data.id, 'i') })).toBeVisible();

    await expect(page.getByRole('button', { name: /manage/i })).toHaveCount(0);
  });

  test('only the first form link with a suitable media type is used', async ({ page, worker }) => {
    const { api, item } = createItemApi();
    item.addLink({ href: EDIT_FORM_URL + '.json', rel: 'edit-form', title: 'Machine-readable', type: 'application/json' });
    item.addLink({ href: EDIT_FORM_URL, rel: 'edit-form', title: 'Edit externally', type: 'text/html' });
    item.addLink({ href: EDIT_FORM_URL + '/2', rel: 'edit-form', title: 'Second editor' });
    await api.createServer(worker);
    await enableTransactions(page);

    await page.goto(item.getBrowserPath());
    await waitForBrowserReady(page);

    await openManageMenu(page);
    const external = page.getByRole('menuitem', { name: 'Edit externally' });
    await expect(external).toBeVisible();
    await expect(external).toHaveAttribute('href', EDIT_FORM_URL);
    await expect(page.getByRole('menuitem', { name: 'Machine-readable' })).toHaveCount(0);
    await expect(page.getByRole('menuitem', { name: 'Second editor' })).toHaveCount(0);
  });
});

test.describe('Management - CRUD flows', () => {
  test('editing an item issues a PUT request', async ({ page, worker }) => {
    const { api, item } = createItemApi();
    await api.createServer(worker);
    await mockTransaction(worker, 'put', item.getAbsoluteUrl(), { status: 200, body: item.build() });
    await enableTransactions(page);

    await page.goto('/management/edit' + item.getBrowserPath());
    await waitForBrowserReady(page);

    const saveButton = page.getByRole('button', { name: 'Save' });
    await expect(saveButton).toBeEnabled();

    const putRequest = page.waitForRequest(
      req => req.method() === 'PUT' && req.url().includes('/items/' + item.data.id)
    );
    await saveButton.click();
    const request = await putRequest;

    const body = JSON.parse(request.postData() || '{}');
    expect(body.id).toBe(item.data.id);
    expect(body.type).toBe('Feature');
  });

  test('creating an item issues a POST and redirects', async ({ page, worker }) => {
    const { api, collection, item } = createItemApi();
    const itemsUrl = collection.getMetadata().links.find(l => l.rel === 'items').href;
    await api.createServer(worker);
    await mockTransaction(worker, 'post', itemsUrl, {
      status: 201,
      location: item.getAbsoluteUrl(),
      body: item.build()
    });
    await enableTransactions(page);

    await page.goto('/management/create-item' + collection.getBrowserPath());
    await waitForBrowserReady(page);

    const saveButton = page.getByRole('button', { name: 'Save' });
    await expect(saveButton).toBeEnabled();

    const postRequest = page.waitForRequest(
      req => req.method() === 'POST' && req.url().includes('/items')
    );
    await saveButton.click();
    await postRequest;

    // After creation the app redirects to the created resource (via Location).
    await expect(page).not.toHaveURL(/\/management\//);
  });

  test('deleting an item issues a DELETE request and redirects away', async ({ page, worker }) => {
    const { api, item } = createItemApi();
    await api.createServer(worker);
    await mockTransaction(worker, 'delete', item.getAbsoluteUrl(), { status: 204 });
    await enableTransactions(page);

    await page.goto(item.getBrowserPath());
    await waitForBrowserReady(page);

    await openManageMenu(page);
    await page.getByRole('menuitem', { name: 'Delete' }).click();

    // Confirmation modal
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();

    const deleteRequest = page.waitForRequest(
      req => req.method() === 'DELETE' && req.url().includes('/items/' + item.data.id)
    );
    await dialog.getByRole('button', { name: 'Delete' }).click();
    await deleteRequest;

    await expect(page).not.toHaveURL(new RegExp('/items/' + item.data.id));
  });

  test('a 403 on save shows the missing-permissions error', async ({ page, worker }) => {
    const { api, item } = createItemApi();
    await api.createServer(worker);
    await mockTransaction(worker, 'put', item.getAbsoluteUrl(), {
      status: 403,
      body: { code: 403, description: 'Forbidden' }
    });
    await enableTransactions(page);

    await page.goto('/management/edit' + item.getBrowserPath());
    await waitForBrowserReady(page);

    const saveButton = page.getByRole('button', { name: 'Save' });
    await expect(saveButton).toBeEnabled();
    await saveButton.click();

    await expect(page.locator('.alert-danger')).toContainText(/do not have the required permissions/i);
  });
});

// Replace the editor content; relies on CodeMirror's bracket/quote typeover
// so that typing the plain JSON string produces exactly that string.
async function replaceEditorContent(page, text) {
  const editor = page.locator('.cm-content');
  await editor.click();
  await page.keyboard.press('ControlOrMeta+a');
  await page.keyboard.type(text);
  // Wait for the debounced draft write (1s) to reach localStorage, stored under
  // a `draft:<mode>:<path>` key with the typed content JSON-encoded in it.
  await expect
    .poll(() => page.evaluate(() => {
      const key = Object.keys(window.localStorage).find(k => k.startsWith('draft:'));
      return key ? window.localStorage.getItem(key) : null;
    }))
    .toContain(JSON.stringify(text));
}

test.describe('Management - drafts and leave guards', () => {
  const DRAFT_JSON = '{"type": "Feature", "id": "draft-test"}';

  test('restores a draft after a reload and discards it on request', async ({ page, worker }) => {
    const { api, item } = createItemApi();
    await api.createServer(worker);
    await enableTransactions(page);

    await page.goto('/management/edit' + item.getBrowserPath());
    await waitForBrowserReady(page);
    await expect(page.locator('.cm-content')).toContainText(item.data.id);

    await replaceEditorContent(page, DRAFT_JSON);

    // The reload may trigger the browser's beforeunload prompt
    page.once('dialog', dialog => dialog.accept());
    await page.reload();
    await waitForBrowserReady(page);

    // The unsaved changes are restored and announced
    await expect(page.locator('.cm-content')).toContainText('draft-test');
    const notice = page.locator('.alert-info');
    await expect(notice).toContainText(/restored/i);

    // Discarding reverts to the server content and drops the draft
    await notice.getByRole('button', { name: /discard/i }).click();
    await expect(page.locator('.cm-content')).toContainText(item.data.id);
    await expect(page.locator('.alert-info')).toHaveCount(0);

    await page.reload();
    await waitForBrowserReady(page);
    await expect(page.locator('.cm-content')).toContainText(item.data.id);
    await expect(page.locator('.alert-info')).toHaveCount(0);
  });

  test('a successful save clears the draft', async ({ page, worker }) => {
    const { api, item } = createItemApi();
    await api.createServer(worker);
    await mockTransaction(worker, 'put', item.getAbsoluteUrl(), { status: 200, body: item.build() });
    await enableTransactions(page);

    await page.goto('/management/edit' + item.getBrowserPath());
    await waitForBrowserReady(page);
    await expect(page.locator('.cm-content')).toContainText(item.data.id);

    await replaceEditorContent(page, DRAFT_JSON);

    const putRequest = page.waitForRequest(req => req.method() === 'PUT');
    await page.getByRole('button', { name: 'Save' }).click();
    await putRequest;

    // The draft is cleared by the save-success handler, which runs after the
    // request is sent. Wait for that side effect before reloading, otherwise the
    // reload can race it and restore the stale draft.
    await expect
      .poll(() => page.evaluate(() => Object.keys(window.localStorage).some(k => k.startsWith('draft:'))))
      .toBe(false);

    page.once('dialog', dialog => dialog.accept());
    await page.reload();
    await waitForBrowserReady(page);

    // No draft to restore: the editor shows the server content
    await expect(page.locator('.cm-content')).toContainText(item.data.id);
    await expect(page.locator('.alert-info')).toHaveCount(0);
  });

  test('leaving the page with unsaved changes asks for confirmation', async ({ page, worker }) => {
    const { api, item } = createItemApi();
    await api.createServer(worker);
    await enableTransactions(page);

    // Navigate to the item first so that there is browser history to go back to
    await page.goto(item.getBrowserPath());
    await waitForBrowserReady(page);
    const menu = await openManageMenu(page);
    await menu.getByRole('menuitem', { name: 'Edit' }).click();
    await expect(page.getByRole('heading', { name: /^edit/i })).toBeVisible();
    await expect(page.locator('.cm-content')).toContainText(item.data.id);

    await replaceEditorContent(page, DRAFT_JSON);

    // Declining the confirmation keeps the page and the changes
    await page.goBack();
    let modal = page.getByRole('dialog');
    await expect(modal).toContainText(/unsaved changes/i);
    await modal.getByRole('button', { name: 'Cancel' }).click();
    await expect(modal).toBeHidden();
    await expect(page).toHaveURL(/\/management\/edit/);
    await expect(page.locator('.cm-content')).toContainText('draft-test');

    // Accepting the confirmation leaves the page
    await page.goBack();
    modal = page.getByRole('dialog');
    await modal.getByRole('button', { name: 'Leave page' }).click();
    await expect(page).not.toHaveURL(/\/management\//);
  });
});

test.describe('Management - editor validation', () => {
  const VALID_ITEM =
    '{"type": "Feature", "stac_version": "1.1.0", "id": "test", "properties": {"datetime": "2020-01-01T00:00:00Z"}}';
  const INVALID_ID_ITEM = VALID_ITEM.replace('"test"', '123');
  const MISSING_ID_ITEM = VALID_ITEM.replace('"id": "test", ', '');

  // Serve self-contained schemas so validation works offline and deterministically
  async function mockSchemas(worker) {
    await worker.use(
      http.get('https://schemas.stacspec.org/*', () => HttpResponse.json(itemSchema)),
      http.get('https://stac-extensions.github.io/*', () => HttpResponse.json({}))
    );
  }

  async function openEditor(page, worker) {
    const { api, item } = createItemApi();
    await api.createServer(worker);
    await mockSchemas(worker);
    await enableTransactions(page);
    await page.goto('/management/edit' + item.getBrowserPath());
    await waitForBrowserReady(page);
    await expect(page.locator('.cm-content')).toContainText(item.data.id);
  }

  test('highlights the offending value and clears after fixing it', async ({ page, worker }) => {
    await openEditor(page, worker);
    await replaceEditorContent(page, INVALID_ID_ITEM);

    // The debounced validation marks exactly the wrong value
    const markers = page.locator('.cm-lintRange-error');
    await expect(markers.first()).toBeVisible({ timeout: 20000 });
    expect((await markers.allTextContents()).join('')).toContain('123');
    await expect(page.locator('.cm-lint-marker-error')).toBeVisible();

    // The lint tooltip shows the (localized) ajv message
    await markers.first().hover();
    await expect(page.locator('.cm-tooltip-lint')).toContainText(/must be string/i);

    // Fixing the value clears the diagnostics
    await replaceEditorContent(page, VALID_ITEM);
    await expect(page.locator('.cm-lintRange-error')).toHaveCount(0, { timeout: 20000 });
  });

  test('reports a missing required property', async ({ page, worker }) => {
    await openEditor(page, worker);
    await replaceEditorContent(page, MISSING_ID_ITEM);

    const markers = page.locator('.cm-lintRange-error');
    await expect(markers.first()).toBeVisible({ timeout: 20000 });
    await markers.first().hover();
    await expect(page.locator('.cm-tooltip-lint')).toContainText(/required property.*id/i);
  });

  test('broken JSON reports a syntax error without breaking the editor', async ({ page, worker }) => {
    await openEditor(page, worker);
    await replaceEditorContent(page, '{"id": }');

    await expect(page.locator('.cm-lintRange-error').first()).toBeVisible({ timeout: 20000 });
    await expect(page.locator('.cm-content')).toContainText('{"id": }');
  });
});

test.describe('Management - OPTIONS preflight', () => {
  test('item Edit/Delete appear only when the Allow header permits them', async ({ page, worker }) => {
    const { api, item } = createItemApi();
    await api.createServer(worker);
    // Real servers send Allow as a comma-separated string.
    await mockOptions(worker, item.getAbsoluteUrl(), ['GET', 'PUT', 'DELETE']);
    await enablePreflight(page);

    await page.goto(item.getBrowserPath());
    await waitForBrowserReady(page);

    await openManageMenu(page);
    await expect(page.getByRole('menuitem', { name: 'Edit' })).toBeVisible();
    await expect(page.getByRole('menuitem', { name: 'Delete' })).toBeVisible();
  });

  test('item management is hidden when the Allow header omits write methods', async ({ page, worker }) => {
    const { api, item } = createItemApi();
    await api.createServer(worker);
    await mockOptions(worker, item.getAbsoluteUrl(), ['GET']);
    await enablePreflight(page);

    await page.goto(item.getBrowserPath());
    await waitForBrowserReady(page);
    await expect(page.getByRole('heading', { name: new RegExp(item.data.id, 'i') })).toBeVisible();

    await expect(page.getByRole('button', { name: /manage/i })).toHaveCount(0);
  });

  test('the OPTIONS request carries configured query parameters', async ({ page, worker }) => {
    const { api, item } = createItemApi();
    await api.createServer(worker);
    await mockOptions(worker, item.getAbsoluteUrl(), ['GET', 'PUT', 'DELETE']);
    await enablePreflight(page);
    // Simulates authentication via query parameters, which the permission
    // check must send although they are stripped from the permission key
    await configureBrowser(page, { requestQueryParameters: { token: 'test-token' } });

    const optionsRequest = page.waitForRequest(
      req => req.method() === 'OPTIONS' && req.url().startsWith(item.getAbsoluteUrl())
    );
    await page.goto(item.getBrowserPath());
    await waitForBrowserReady(page);

    const request = await optionsRequest;
    expect(request.url()).toContain('token=test-token');

    // The permissions are found although they are keyed without the query parameters
    await openManageMenu(page);
    await expect(page.getByRole('menuitem', { name: 'Edit' })).toBeVisible();
  });

  test('Add Collection appears only when the Allow header permits POST', async ({ page, worker }) => {
    const { api } = createCollectionApi();
    await api.createServer(worker);
    // The collections listing is preflighted; permissions apply to the clean URL.
    await mockOptions(worker, api.collections.getAbsoluteUrl(), ['GET', 'POST']);
    await enablePreflight(page);

    await page.goto(api.root.getBrowserPath());
    await waitForBrowserReady(page);

    await openManageMenu(page);
    await expect(page.getByRole('menuitem', { name: 'Add Collection' })).toBeVisible();
  });
});
