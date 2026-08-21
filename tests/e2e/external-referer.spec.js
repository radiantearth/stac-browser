/**
 * External content tests for instances with a configured catalogUrl:
 * - The `.referer` query parameter and the "Back" button, which return the user
 *   to the page in the catalog from which the external content was reached
 * - The source panel indicator for external data
 * - Conformance classes of the catalog are not applied to external content
 */
import { test, expect } from './fixtures.js';
import { configureBrowser, openSourcePanel, waitForBrowserReady } from './helpers.js';
import StaticCatalog from '../fixtures/instances/static.js';
import API from '../fixtures/instances/api.js';

const MAIN_URL = 'https://main.example/catalog.json';
const PRODUCT_PATH = '/products/my-product/collection.json';
const EXTERNAL_A_PATH = '/external/external-a.example/api/collections/collection-a';
const EXTERNAL_B_PATH = '/external/external-b.example/api/collections/collection-b';

// The main catalog links to a collection in external API A,
// which in turn links to a collection in external API B.
function createInstances() {
  const catalog = new StaticCatalog({ url: MAIN_URL });
  catalog.setMetadata({ title: 'Main Catalog' });
  const product = catalog.addCollection({ url: 'products/my-product/collection.json' });
  product.setMetadata({ id: 'my-product', title: 'My Product' });

  const apiA = API.defaultApi({ url: 'https://external-a.example/api/' });
  const collectionA = apiA.addCollection('collection-a').setMetadata({ title: 'External Collection A' });
  apiA.addItem(collectionA, 'item-a-1');

  const apiB = API.defaultApi({ url: 'https://external-b.example/api/' });
  const collectionB = apiB.addCollection('collection-b').setMetadata({ title: 'External Collection B' });
  apiB.addItem(collectionB, 'item-b-1');

  product.addLink({ rel: 'child', href: collectionA.getAbsoluteUrl(), type: 'application/json', title: 'External Collection A' });
  collectionA.addLink({ rel: 'child', href: collectionB.getAbsoluteUrl(), type: 'application/json', title: 'External Collection B' });

  return { catalog, product, apiA, collectionA, apiB, collectionB };
}

async function createServers(worker, instances) {
  await instances.catalog.createServer(worker);
  await instances.apiA.createServer(worker, { reset: false });
  await instances.apiB.createServer(worker, { reset: false });
}

const backButton = page => page.getByRole('button', { name: /^back$/i });

test.describe('Referer handling and Back button', () => {
  test('attaches the referer when navigating to external content and returns via the Back button', async ({ page, worker }) => {
    const instances = createInstances();
    await createServers(worker, instances);
    await configureBrowser(page, { catalogUrl: MAIN_URL });

    // The query state of the originating page must be part of the referer
    await page.goto(`${PRODUCT_PATH}?example=1`);
    await waitForBrowserReady(page);
    await expect(page.getByRole('heading', { name: /My Product/ })).toBeVisible();

    await page.getByRole('link', { name: /External Collection A/ }).click();
    await expect(page).toHaveURL(url => url.pathname === EXTERNAL_A_PATH && url.searchParams.get('.referer') === `${PRODUCT_PATH}?example=1`);
    await expect(page.getByRole('heading', { name: /External Collection A/ })).toBeVisible();

    await backButton(page).click();
    // Returning into the catalog restores the query state and drops the referer again
    await expect(page).toHaveURL(url => url.pathname === PRODUCT_PATH && url.searchParams.get('example') === '1' && url.searchParams.get('.referer') === null);
    await expect(page.getByRole('heading', { name: /My Product/ })).toBeVisible();
  });

  test('keeps the original referer when navigating between two external catalogs', async ({ page, worker }) => {
    const instances = createInstances();
    await createServers(worker, instances);
    await configureBrowser(page, { catalogUrl: MAIN_URL });

    await page.goto(PRODUCT_PATH);
    await waitForBrowserReady(page);
    await page.getByRole('link', { name: /External Collection A/ }).click();
    await expect(page).toHaveURL(url => url.pathname === EXTERNAL_A_PATH);

    await page.getByRole('link', { name: /External Collection B/ }).click();
    await expect(page).toHaveURL(url => url.pathname === EXTERNAL_B_PATH && url.searchParams.get('.referer') === PRODUCT_PATH);

    await backButton(page).click();
    await expect(page).toHaveURL(url => url.pathname === PRODUCT_PATH);
    await expect(page.getByRole('heading', { name: /My Product/ })).toBeVisible();
  });

  test('shows the Back button for shared links and after a page refresh', async ({ page, worker }) => {
    const instances = createInstances();
    await createServers(worker, instances);
    await configureBrowser(page, { catalogUrl: MAIN_URL });

    await page.goto(`${EXTERNAL_A_PATH}?.referer=${encodeURIComponent(PRODUCT_PATH)}`);
    await waitForBrowserReady(page);
    await expect(backButton(page)).toBeVisible();

    await page.reload();
    await waitForBrowserReady(page);
    await expect(backButton(page)).toBeVisible();

    await backButton(page).click();
    await expect(page.getByRole('heading', { name: /My Product/ })).toBeVisible();
  });

  test('ignores referers that are not in-app paths', async ({ page, worker }) => {
    const instances = createInstances();
    await createServers(worker, instances);
    await configureBrowser(page, { catalogUrl: MAIN_URL });

    await page.goto(`${EXTERNAL_A_PATH}?.referer=${encodeURIComponent('https://evil.example/')}`);
    await waitForBrowserReady(page);
    await expect(page.getByRole('heading', { name: /External Collection A/ })).toBeVisible();
    await expect(backButton(page)).toBeHidden();

    await page.goto(`${EXTERNAL_A_PATH}?.referer=${encodeURIComponent('//evil.example/')}`);
    await waitForBrowserReady(page);
    await expect(page.getByRole('heading', { name: /External Collection A/ })).toBeVisible();
    await expect(backButton(page)).toBeHidden();
  });

  test('does not attach a referer when no catalog is configured', async ({ page, worker }) => {
    const instances = createInstances();
    await createServers(worker, instances);
    await configureBrowser(page, { catalogUrl: null });

    await page.goto(instances.apiA.root.getBrowserPath());
    await waitForBrowserReady(page);
    await page.getByRole('link', { name: /External Collection A/ }).click();
    await expect(page).toHaveURL(url => url.pathname === EXTERNAL_A_PATH && url.searchParams.get('.referer') === null);
    await expect(backButton(page)).toBeHidden();
  });
});

// Helper: add a free-text tag to the collection search filter multiselect
const addFreeTextTerm = async (page, term) => {
  const freeTextGroup = page.locator('.filter-freetext');
  const multiselect = freeTextGroup.locator('.multiselect');
  await multiselect.locator('.multiselect__tags').click();
  const input = multiselect.locator('input.multiselect__input');
  await expect(input).toBeVisible();
  await input.fill(term);
  await input.press('Enter');
  await expect(freeTextGroup.locator('.multiselect__tag').filter({ hasText: term })).toBeVisible();
};

// Helper: open the item filter panel on a collection page
const openItemFilterPanel = async (page) => {
  const toggle = page.locator('[aria-controls="itemFilter"]');
  await expect(toggle).toBeVisible();
  if ((await toggle.getAttribute('aria-expanded')) !== 'true') {
    await toggle.click();
  }
  await expect(toggle).toHaveAttribute('aria-expanded', 'true');
  await expect(page.locator('.limit').first()).toBeVisible();
};

test.describe('External content indicators and conformance scoping', () => {
  test('the source panel indicates whether the data comes from an external source', async ({ page, worker }) => {
    const instances = createInstances();
    await createServers(worker, instances);
    await configureBrowser(page, { catalogUrl: MAIN_URL });

    await page.goto(PRODUCT_PATH);
    await waitForBrowserReady(page);
    let panel = await openSourcePanel(page);
    await expect(panel.locator('.stac-external')).toContainText('no');

    await page.goto(EXTERNAL_A_PATH);
    await waitForBrowserReady(page);
    panel = await openSourcePanel(page);
    await expect(panel.locator('.stac-external')).toContainText('yes');
  });

  test('drops carried search filters for external collections opened from the search results', async ({ page, worker }) => {
    // The API supports free-text search on item lists, so free-text terms are
    // carried over from the collection search into the item filters of a
    // collection — but not for a search result hosted on an external API.
    const main = API.minimalApi({ url: 'https://main.example/api/' }, { defaultLimit: 10 });
    const internalCollection = main.addCollection('internal-collection').setMetadata({ title: 'Internal Collection' });
    const externalCollection = main.addCollection('external-collection', { url: 'https://external-a.example/api/collections/external-collection' })
      .setMetadata({ title: 'External Collection' });
    main.addItemsExtension().addSearchExtension();
    main.addManyItems(internalCollection, 2);
    main.addManyItems(externalCollection, 2);
    main.root.addConformsTo('https://api.stacspec.org/v1.0.0/collection-search');
    main.root.addConformsTo('https://api.stacspec.org/v1.0.0/collection-search#free-text');
    main.root.addConformsTo('https://api.stacspec.org/v1.0.0/ogcapi-features#free-text');

    await main.createServer(worker);
    await configureBrowser(page, { catalogUrl: 'https://main.example/api/' });

    await test.step('Search for collections with a free-text term', async () => {
      await page.goto('/');
      await waitForBrowserReady(page);
      await page.getByRole('button', { name: /^search$/i }).click();
      await page.getByRole('tab', { name: /search for collections/i }).click();
      await addFreeTextTerm(page, 'Collection');
      await page.getByRole('button', { name: /submit/i }).click();
      await waitForBrowserReady(page);
    });

    await test.step('Within the catalog, the free-text term is carried over without warnings', async () => {
      await page.getByText('Internal Collection', { exact: false }).first().click();
      await waitForBrowserReady(page);
      await openItemFilterPanel(page);
      await expect(page.locator('.alert-warning')).toHaveCount(0);
    });

    await test.step('Return to the search results', async () => {
      await page.getByRole('button', { name: /^search$/i }).click();
      await page.getByRole('tab', { name: /search for collections/i }).click();
      await waitForBrowserReady(page);
    });

    await test.step('For the external collection, the filter is dropped and the referer points to the search page', async () => {
      await page.getByText('External Collection', { exact: false }).first().click();
      await expect(page).toHaveURL(url =>
        url.pathname === '/external/external-a.example/api/collections/external-collection'
        && (url.searchParams.get('.referer') || '').startsWith('/search')
      );
      await waitForBrowserReady(page);
      await openItemFilterPanel(page);
      const banner = page.locator('.alert-warning').first();
      await expect(banner).toBeVisible();
      await expect(banner).toContainText(/Search Terms/i);
    });
  });

  test('does not apply the conformance classes of the catalog to external content', async ({ page, worker }) => {
    // The configured catalog is an API that advertises sorting for item lists
    const main = API.defaultApi({ url: 'https://main.example/api/' });
    main.root.addConformsTo('https://api.stacspec.org/v1.0.0/ogcapi-features#sort');
    const mainCollection = main.addCollection('main-collection').setMetadata({ title: 'Main Collection' });
    main.addItem(mainCollection, 'item-1');

    const apiA = API.defaultApi({ url: 'https://external-a.example/api/' });
    const collectionA = apiA.addCollection('collection-a').setMetadata({ title: 'External Collection A' });
    apiA.addItem(collectionA, 'item-a-1');
    mainCollection.addLink({ rel: 'child', href: collectionA.getAbsoluteUrl(), type: 'application/json', title: 'External Collection A' });

    await main.createServer(worker);
    await apiA.createServer(worker, { reset: false });
    await configureBrowser(page, { catalogUrl: 'https://main.example/api/' });

    // Within the catalog, the item filters offer sorting
    await page.goto('/collections/main-collection');
    await waitForBrowserReady(page);
    await page.locator('[aria-controls="itemFilter"]').click();
    await expect(page.locator('#itemFilter .sort')).toBeVisible();

    // For external content the conformance classes of the catalog must not apply,
    // the external API may not support the corresponding query parameters
    await page.goto(EXTERNAL_A_PATH);
    await waitForBrowserReady(page);
    await page.locator('[aria-controls="itemFilter"]').click();
    await expect(page.locator('#itemFilter')).toBeVisible();
    await expect(page.locator('#itemFilter .sort')).toBeHidden();
    await expect(page.locator('#itemFilter .filter-datetime')).toBeHidden();
  });
});
