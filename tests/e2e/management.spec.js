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
import { test, expect } from './fixtures.js';
import {
  enableTransactions,
  configureBrowser,
  mockOptions,
  mockTransaction,
  openManageMenu,
  waitForBrowserReady
} from './helpers.js';
import API from '../fixtures/instances/api.js';

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
    transactions: true,
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
      await new Promise(resolve => setTimeout(resolve, 400));
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

    // Let the async loads settle to ensure the page doesn't fall back into a broken state
    await page.waitForTimeout(2500);
    await expect(page.getByRole('heading', { name: /add item/i })).toBeVisible();
    await expect(page.locator('.cm-content')).toContainText('"type": "Feature"');
    await expect(page.getByRole('button', { name: /manage/i })).toBeVisible();
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
