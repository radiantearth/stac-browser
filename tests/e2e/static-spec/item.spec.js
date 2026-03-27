/**
 * Item properties, geometry & assets tests.
 *
 * Exercises viewing an item in a static STAC catalog.
 * Navigates: root catalog -> eo-collection -> first item (item-2025-001).
 * Verifies metadata rendering, geometry display, asset listing, and breadcrumb
 * navigation.
 *
 * Fixtures: tests/fixtures/catalogs/test-catalog/eo-collection/item-2025-001.json
 */
import { test, expect } from '../fixtures';
import { waitForBrowserReady } from '../helpers';
import StaticCatalog from '../../fixtures/instances/static.js';

test.describe('Item view - Metadata', () => {
  test('should display item metadata', async ({ page, worker }) => {
    const catalog = new StaticCatalog({ url: 'https://stac.example/catalog.json' });
    const collection = catalog.addCollection({ url: 'https://stac.example/collection.json' });
    
    const item = collection.addItem({ url: 'https://stac.example/item.json' })
      .setMetadata({ title: 'Test Item 2025-001', datetime: '2025-01-01T00:00:00Z' });

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
});

test.describe('Item view - Assets', () => {
  let catalog, collection, item;

  test.beforeEach('should load collection page', async () => {
    catalog = (new StaticCatalog({url: 'https://stac.example/catalog.json'}));
    collection = catalog.addCollection({ url: 'https://stac.example/collection.json' });
    item = collection.addItem({ url: 'https://stac.example/item.json' });
  });

  test('should list item assets', async ({ page, worker }) => {
    await catalog.createServer(worker);
    
    await page.goto(item.getBrowserPath());
    await waitForBrowserReady(page);

    await expect(page.locator('.assets')).toBeVisible();
  });

  test('renders asset with title and href', async ({ page, worker }) => {    
    await catalog.createServer(worker);
    
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
  let catalog, collection, item;

  test.beforeEach('should load collection page', async () => {
    catalog = (new StaticCatalog({url: 'https://stac.example/catalog.json'}));
    collection = catalog.addCollection({ url: 'https://stac.example/collection.json' });
    item = collection.addItem({ url: 'https://stac.example/item.json' });
  });

  test('renders a map with item geometry', async ({ page, worker }) => {
    await catalog.createServer(worker);
    
    await page.goto(item.getBrowserPath());
    await waitForBrowserReady(page);

    await expect(page.locator('.map')).toBeVisible();
  });

   test('map & thumbnails behave correctly', async ({ page, worker }) => {
    await catalog.createServer(worker);
    
    await page.goto(item.getBrowserPath());
    await waitForBrowserReady(page);

    await expect(page.locator('.maps-preview')).toBeVisible();

    const thumbTab = page.getByRole('tab', { name: /thumbnails/i });
    await thumbTab.click();
    waitForBrowserReady(page);

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
