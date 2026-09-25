/**
 * Regression tests for the `apiCatalogPriority` config option, which chooses
 * between the two sources of catalogs and collections — static `rel="child"`
 * links and the `/collections` endpoint (rel="data") — on the main pages and
 * in the browse tree. Items are never affected by the option (#990).
 */
import { test, expect } from './fixtures.js';
import { configureBrowser, waitForBrowserReady } from './helpers.js';
import API from '../fixtures/instances/api.js';

const CARD = '.catalogs .card-grid > *';

test.describe('apiCatalogPriority', () => {
  function createApi() {
    const api = API.defaultApi();
    api.addCollection('api-collection').setMetadata({ title: 'API Collection' });
    api.addStaticCatalog({ url: 'static-catalog' }).setMetadata({ title: 'Static Catalog' });
    return { api };
  }

  test('null shows both sources', async ({ page, worker }) => {
    const { api } = createApi();
    await api.createServer(worker);

    await page.goto(api.root.getBrowserPath());
    await waitForBrowserReady(page);

    await expect(page.locator(CARD)).toHaveCount(2);
    await expect(page.getByRole('link', { name: /API Collection/ })).toBeVisible();
    await expect(page.getByRole('link', { name: /Static Catalog/ })).toBeVisible();
  });

  test('collections shows only API collections', async ({ page, worker }) => {
    const { api } = createApi();
    await api.createServer(worker);
    await configureBrowser(page, { apiCatalogPriority: 'collections' });

    await page.goto(api.root.getBrowserPath());
    await waitForBrowserReady(page);

    await expect(page.locator(CARD)).toHaveCount(1);
    await expect(page.getByRole('link', { name: /API Collection/ })).toBeVisible();
  });

  test('childs shows only static child links', async ({ page, worker }) => {
    const { api } = createApi();
    await api.createServer(worker);
    await configureBrowser(page, { apiCatalogPriority: 'childs' });

    await page.goto(api.root.getBrowserPath());
    await waitForBrowserReady(page);

    await expect(page.locator(CARD)).toHaveCount(1);
    await expect(page.getByRole('link', { name: /Static Catalog/ })).toBeVisible();
  });

  test('null shows both sources in the tree', async ({ page, worker }) => {
    const { api } = createApi();
    await api.createServer(worker);

    await page.goto(api.root.getBrowserPath());
    await waitForBrowserReady(page);

    await page.getByRole('button', { name: /browse/i }).click();
    const sidebar = page.locator('#sidebar');
    await expect(sidebar).toBeVisible();
    await expect(sidebar.getByText('Static Catalog')).toBeVisible();
    await expect(sidebar.getByText('API Collection')).toBeVisible();
  });

  test('collections hides static child links in the tree', async ({ page, worker }) => {
    const { api } = createApi();
    await api.createServer(worker);
    await configureBrowser(page, { apiCatalogPriority: 'collections' });

    await page.goto(api.root.getBrowserPath());
    await waitForBrowserReady(page);

    await page.getByRole('button', { name: /browse/i }).click();
    const sidebar = page.locator('#sidebar');
    await expect(sidebar).toBeVisible();
    await expect(sidebar.getByText('API Collection')).toBeVisible();
    await expect(sidebar.getByText('Static Catalog')).not.toBeVisible();
  });

  test('childs hides API collections in the tree', async ({ page, worker }) => {
    const { api } = createApi();
    await api.createServer(worker);
    await configureBrowser(page, { apiCatalogPriority: 'childs' });

    await page.goto(api.root.getBrowserPath());
    await waitForBrowserReady(page);

    await page.getByRole('button', { name: /browse/i }).click();
    const sidebar = page.locator('#sidebar');
    await expect(sidebar).toBeVisible();
    await expect(sidebar.getByText('Static Catalog')).toBeVisible();
    await expect(sidebar.getByText('API Collection')).not.toBeVisible();
  });

  test('childs does not hide collection items in the tree (#990)', async ({ page, worker }) => {
    const { api } = createApi();
    const collection = api.addCollection('items-collection').setMetadata({ title: 'Items Collection' });
    // The child link makes the collection appear in the tree despite the childs priority
    api.root.addChildLink(collection);
    api.addItem(collection, 'item-1');
    await api.createServer(worker);
    await configureBrowser(page, { apiCatalogPriority: 'childs' });

    await page.goto(collection.getBrowserPath());
    await waitForBrowserReady(page);

    await page.getByRole('button', { name: /browse/i }).click();
    const sidebar = page.locator('#sidebar');
    await expect(sidebar).toBeVisible();

    // Clicking the active node toggles it open
    await sidebar.getByRole('button', { name: 'Items Collection' }).click();
    await expect(sidebar.getByText('item-1')).toBeVisible();
    await expect(sidebar.getByText('No children available.')).not.toBeVisible();
  });

  test('collections does not hide item links in the tree (#990)', async ({ page, worker }) => {
    const { api } = createApi();
    const collection = api.addCollection('linked-items').setMetadata({ title: 'Linked Items' });
    const item = collection.addItem({ url: 'collections/linked-items/items/static-item' });
    item.setMetadata({ id: 'static-item' });
    await api.createServer(worker);
    await configureBrowser(page, { apiCatalogPriority: 'collections' });

    await page.goto(collection.getBrowserPath());
    await waitForBrowserReady(page);

    await page.getByRole('button', { name: /browse/i }).click();
    const sidebar = page.locator('#sidebar');
    await expect(sidebar).toBeVisible();

    // Clicking the active node toggles it open
    await sidebar.getByRole('button', { name: 'Linked Items' }).click();
    await expect(sidebar.getByText('static-item')).toBeVisible();
    await expect(sidebar.getByText('No children available.')).not.toBeVisible();
  });

  for (const priority of ['collections', 'childs']) {
    test(`${priority} does not hide items on the collection page`, async ({ page, worker }) => {
      const { api } = createApi();
      const collection = api.addCollection('items-collection').setMetadata({ title: 'Items Collection' });
      api.addItem(collection, 'item-1');
      await api.createServer(worker);
      await configureBrowser(page, { apiCatalogPriority: priority });

      await page.goto(collection.getBrowserPath());
      await waitForBrowserReady(page);

      await expect(page.getByRole('link', { name: /item-1/ })).toBeVisible();
    });
  }

  test('items linked and loaded from the API are deduplicated in the tree', async ({ page, worker }) => {
    const { api } = createApi();
    const collection = api.addCollection('dedup-collection').setMetadata({ title: 'Dedup Collection' });
    const item = api.addItem(collection, 'item-1');
    // The same item is also linked statically
    collection.addItemLink(item);
    await api.createServer(worker);

    await page.goto(collection.getBrowserPath());
    await waitForBrowserReady(page);

    await page.getByRole('button', { name: /browse/i }).click();
    const sidebar = page.locator('#sidebar');
    await expect(sidebar).toBeVisible();

    // Clicking the active node toggles it open
    await sidebar.getByRole('button', { name: 'Dedup Collection' }).click();
    await expect(sidebar.getByText('item-1')).toHaveCount(1);
  });
});
