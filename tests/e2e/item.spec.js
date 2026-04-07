/**
 * Item properties, geometry & assets tests.
 *
 * Exercises viewing an item in a STAC catalog.
 * Verifies metadata rendering, geometry display, asset listing, and breadcrumb navigation.
 */
import { test, expect } from './fixtures.js';
import { waitForBrowserReady } from './helpers.js';
import StaticCatalog from '../fixtures/instances/static.js';
import API from '../fixtures/instances/api.js';

test.describe('Item view - Metadata', () => {
  function createCatalog() {
    const catalog = new StaticCatalog({ url: 'https://stac.example/catalog.json' });
    const collection = catalog.addCollection({ url: 'https://stac.example/collection.json' });
    
    const item = collection.addItem({ url: 'https://stac.example/item.json' })
      .setMetadata({ title: 'Test Item 2025-001', datetime: '2025-01-01T00:00:00Z' });
    return { catalog, collection, item };
  }

  function createAPI() {
    const api = API.minimalApi();
    const collection = api.addCollection('collection')
      .setMetadata({ title: "Example EO Collection", description: "An example STAC Collection with EO extension." });
    const items = api.addManyItems(collection, 3);
    return { api, collection, items };
  }

  test('Catalog - should display item metadata', async ({ page, worker }) => {
    const { catalog, collection, item } = createCatalog(); 
    await catalog.createServer(worker);
    
    await page.goto(catalog.root.getBrowserPath());
    await waitForBrowserReady(page);
    
    await page.getByRole('link', { name: new RegExp(collection.getMetadata().title, 'i') }).click();
    await waitForBrowserReady(page);
    
    const collectionTitle = await page.getByRole('heading', { name: new RegExp(collection.getMetadata().title, 'i') });
    await expect(collectionTitle).toBeVisible();
    
    await page.getByRole('link', { name: new RegExp(item.getMetadata().title, 'i') }).click();
    await waitForBrowserReady(page);
    
    const itemTitle = await page.getByRole('heading', { name: new RegExp(item.getMetadata().title, 'i') });
    await expect(itemTitle).toBeVisible();
  });

  test('should display rich item properties from EO collection', async ({ page, worker }) => {
    const { api, items } = createAPI();
    await api.createServer(worker);
    
    const item = items[0];
    await page.goto(item.getBrowserPath());
    await waitForBrowserReady(page);
    
    // check heading shows item id
    await expect(page.getByRole('heading', { name: new RegExp(item.data.id, 'i') })).toBeVisible();
    
    await expect(page.getByText(/cloud cover/i)).toBeVisible();
    await expect(page.getByText(/constellation/i)).toBeVisible();
    await expect(page.getByText(/time of data begins/i)).toBeVisible();
    
    //expand and view metadata
    await page.getByRole('button', { name: /metadata/i }).click();
    await expect(page.getByRole('button', { name: /download/i })).toBeVisible();
    
    //expand and view measurements
    await page.getByRole('button', { name: /measurements/i }).click();
    // bands are listed
    await expect(page.locator('.row:has-text("Bands")').getByText(/B1/i)).toBeVisible();
    await expect(page.locator('.row:has-text("Bands")').getByText(/B2/i)).toBeVisible();
    await expect(page.locator('.row:has-text("Bands")').getByText(/B3/i)).toBeVisible();
  });

  test('API - should display item metadata', async ({ page, worker }) => {
    const { api, items } = createAPI();
    await api.createServer(worker);
    
    const item = items[0];
    await page.goto(item.getBrowserPath());
    await waitForBrowserReady(page);
    
    // check heading shows item id
    await expect(page.getByRole('heading', { name: new RegExp(item.data.id, 'i') })).toBeVisible();
    
    await expect(page.getByText(/cloud cover/i)).toBeVisible();
    await expect(page.getByText(/constellation/i)).toBeVisible();
    await expect(page.getByText(/time of data begins/i)).toBeVisible();
    
    //expand and view metadata
    await page.getByRole('button', { name: /metadata/i }).click();
    await expect(page.getByRole('button', { name: /download/i })).toBeVisible();
    
    //expand and view measurements
    await page.getByRole('button', { name: /measurements/i }).click();
    // bands are listed
    await expect(page.locator('.row:has-text("Bands")').getByText(/B1/i)).toBeVisible();
    await expect(page.locator('.row:has-text("Bands")').getByText(/B2/i)).toBeVisible();
    await expect(page.locator('.row:has-text("Bands")').getByText(/B3/i)).toBeVisible();
  });

  test('map & thumbnails behave correctly', async ({ page, worker }) => {
    const { api, items } = createAPI();
    await api.createServer(worker);
    const item = items[0];
    await page.goto(item.getBrowserPath());
    await waitForBrowserReady(page);
    
    await expect(page.locator('.maps-preview')).toBeVisible();
    const thumbTab = page.getByRole('tab', { name: /thumbnails/i });
    await thumbTab.click();
    await expect(page.getByRole('tabpanel', { name: /thumbnails/i })).toBeVisible();
    const mapTab = page.getByRole('tab', { name: /map/i });
    await mapTab.click();
    const zoomIn = page.locator('.maps-preview button', { hasText: '+' }).first();
    const zoomOut = page.locator('.maps-preview button').filter({ hasText: /[-\u2013\u2212]/ }).first();
    const fullscreen = page.locator('.maps-preview button', { hasText: /\u26F6|fullscreen/i }).first();
    await expect(zoomIn).toBeEnabled();
    await expect(zoomOut).toHaveCount(1);
    await expect(fullscreen).toBeEnabled();
  });

  test('additional resources links are shown', async ({ page, worker }) => {
    const { api, items } = createAPI();
    await api.createServer(worker);
    const item = items[0];
    await page.goto(item.getBrowserPath());
    await waitForBrowserReady(page);
    
    // The item has "via" and "describedby" links which appear under
    // "Additional Resources" (or similar heading) on the item view.
    await expect(page.getByRole('heading', { name: /additional resources/i })).toBeVisible();
  });
});

test.describe('Item view - Assets', () => {
  function createCatalog() {
    const catalog = new StaticCatalog({url: 'https://stac.example/catalog.json'});
    const collection = catalog.addCollection({ url: 'https://stac.example/collection.json' });
    const item = collection.addItem({ url: 'https://stac.example/item.json' });
    return { catalog, collection, item };
  }

  function createAPI() {
    const api = API.minimalApi();
    const collection = api.addCollection('collection', {})
      .setMetadata({ title: "Example EO Collection", description: "An example STAC Collection with EO extension." });
    const items = api.addManyItems(collection, 3);
    const item = items[0];
    return { api, collection, item };
  }

  // Catalog tests
  test('Catalog - should list item assets', async ({ page, worker }) => {
    const { catalog, item } = createCatalog();
    await catalog.createServer(worker);
    
    await page.goto(item.getBrowserPath());
    await waitForBrowserReady(page);
    
    await expect(page.locator('.assets')).toBeVisible();
  });
  
  test('Catalog - renders asset with title and href', async ({ page, worker }) => {    
    const { catalog, item } = createCatalog();
    await catalog.createServer(worker);
    
    await page.goto(item.getBrowserPath());
    await waitForBrowserReady(page);
    // target the data-asset for this test
    const asset = item.data.assets.data;
    
    const assetBtn = page.getByRole('button', { name: new RegExp(asset.title, 'i') }).first();
    
    await expect(assetBtn).toBeVisible();
    await assetBtn.click();
    await waitForBrowserReady(page);
    
    // the expanded asset panel shows Download / Copy URL / Show on map buttons
    await expect(page.getByRole('button', { name: /download/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /show on map/i })).toBeVisible();
  });

  // API tests
  test('API - should list item assets', async ({ page, worker }) => {
    const { api, item } = createAPI();
    await api.createServer(worker);
    
    await page.goto(item.getBrowserPath());
    await waitForBrowserReady(page);
    
    await expect(page.locator('.assets')).toBeVisible();
  });
  
  test('API - renders asset with title and href', async ({ page, worker }) => {    
    const { api, item } = createAPI();
    await api.createServer(worker);
    
    await page.goto(item.getBrowserPath());
    await waitForBrowserReady(page);
    // ignore the first asset which is a thumbnail.
    const assetKey = Object.keys(item.data.assets)[1];
    const asset = item.data.assets[assetKey];
    
    const assetBtn = page.getByRole('button', { name: new RegExp(asset.title, 'i') }).first();
    
    await expect(assetBtn).toBeVisible();
    await assetBtn.click();
    await waitForBrowserReady(page);
    
    // the expanded asset panel shows Download / Copy URL / Show on map buttons
    await expect(page.getByRole('button', { name: /download/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /show on map/i })).toBeVisible();
  });
});

test.describe('Item view - Geometry', () => {
  function createCatalog() {
    const catalog = new StaticCatalog({url: 'https://stac.example/catalog.json'});
    const collection = catalog.addCollection({ url: 'https://stac.example/collection.json' });
    const item = collection.addItem({ url: 'https://stac.example/item.json' });
    return { catalog, collection, item };
  }

  function createAPI() {
    const api = API.minimalApi();
    const collection = api.addCollection('collection', {});
    const items = api.addManyItems(collection, 3);
    const item = items[0];
    return { api, collection, item };
  }

  // Catalog tests
  test('Catalog - renders a map with item geometry', async ({ page, worker }) => {
    const { catalog, item } = createCatalog();
    await catalog.createServer(worker);
    
    await page.goto(item.getBrowserPath());
    await waitForBrowserReady(page);
    
    await expect(page.locator('.map')).toBeVisible();
  });
  
  test('Catalog - map & thumbnails behave correctly', async ({ page, worker }) => {
    const { catalog, item } = createCatalog();
    await catalog.createServer(worker);
    
    await page.goto(item.getBrowserPath());
    await waitForBrowserReady(page);
    
    await expect(page.locator('.maps-preview')).toBeVisible();
    
    const thumbTab = page.getByRole('tab', { name: /thumbnails/i });
    await thumbTab.click();
    await waitForBrowserReady(page);
    
    await expect(page.getByRole('tabpanel', { name: /thumbnails/i })).toBeVisible();
    
    const mapTab = page.getByRole('tab', { name: /map/i });
    await mapTab.click();
    await waitForBrowserReady(page);
    
    const zoomIn = page.locator('.maps-preview button', { hasText: '+' }).first();
    const zoomOut = page.locator('.maps-preview button').filter({ hasText: /[-\u2013\u2212]/ }).first();
    const fullscreen = page.locator('.maps-preview button', { hasText: /\u26F6|fullscreen/i }).first();
    await expect(zoomIn).toBeEnabled();
    await expect(zoomOut).toHaveCount(1);
    await expect(fullscreen).toBeEnabled();
  });

  // API tests
  test('API - renders a map with item geometry', async ({ page, worker }) => {
    const { api, item } = createAPI();
    await api.createServer(worker);
    
    await page.goto(item.getBrowserPath());
    await waitForBrowserReady(page);
    
    await expect(page.locator('.map')).toBeVisible();
  });
  
  test('API - map & thumbnails behave correctly', async ({ page, worker }) => {
    const { api, item } = createAPI();
    await api.createServer(worker);
    
    await page.goto(item.getBrowserPath());
    await waitForBrowserReady(page);
    
    await expect(page.locator('.maps-preview')).toBeVisible();
    
    const thumbTab = page.getByRole('tab', { name: /thumbnails/i });
    await thumbTab.click();
    await waitForBrowserReady(page);
    
    await expect(page.getByRole('tabpanel', { name: /thumbnails/i })).toBeVisible();
    
    const mapTab = page.getByRole('tab', { name: /map/i });
    await mapTab.click();
    await waitForBrowserReady(page);
    
    const zoomIn = page.locator('.maps-preview button', { hasText: '+' }).first();
    const zoomOut = page.locator('.maps-preview button').filter({ hasText: /[-\u2013\u2212]/ }).first();
    const fullscreen = page.locator('.maps-preview button', { hasText: /\u26F6|fullscreen/i }).first();
    await expect(zoomIn).toBeEnabled();
    await expect(zoomOut).toHaveCount(1);
    await expect(fullscreen).toBeEnabled();
  });
});
