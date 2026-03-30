/**
 * Item properties, geometry & assets tests.
 *
 * Exercises viewing an item in a static STAC catalog.
 * Navigates: root catalog -> eo-collection -> first item (item-2025-001).
 * Verifies metadata rendering, geometry display, asset listing, and breadcrumb
 * navigation.
 */
import { test, expect } from '../fixtures.js';
import { waitForBrowserReady } from '../helpers.js';
import API from '../../fixtures/instances/api.js';

test.describe('Item view - Metadata', () => {
	let api;
	let collection;
	let items;
	const title = "Example EO Collection";
	const description = "An example STAC Collection with EO extension.";

	test.beforeEach(async () => {
		api = API.minimalApi();
		collection = api.addCollection('collection', {})
			.setMetadata({ title, description });
		items = api.addManyItems(collection, 3);
	});
	

  test('should display item metadata', async ({ page, worker }) => {
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
		await expect(page.getByText(/B1/i)).toBeVisible();
		await expect(page.getByText(/B2/i)).toBeVisible();
		await expect(page.getByText(/B3/i)).toBeVisible();

  });
	
  test('map & thumbnails behave correctly', async ({ page, worker }) => {
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
  let api;
	let collection;
	let items;
	let item;
  const title = "Example EO Collection";
	const description = "An example STAC Collection with EO extension.";

	test.beforeEach(async () => {
    // doesn't use Asset class because the item-template contains assets already
    // for more control of Asset properties, asset class is recommended
		api = API.minimalApi();
		collection = api.addCollection('collection', {})
			.setMetadata({ title, description });
		items = api.addManyItems(collection, 3);
    item = items[0];
	});

  test('should list item assets', async ({ page, worker }) => {
    await api.createServer(worker);
    
    await page.goto(item.getBrowserPath());
    await waitForBrowserReady(page);

    await expect(page.locator('.assets')).toBeVisible();
  });

  test('renders asset with title and href', async ({ page, worker }) => {    
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
  let api;
	let collection;
	let items;
	let item;

	test.beforeEach(async () => {
    // doesn't use Asset class because the item-template contains assets already
    // for more control of Asset properties, asset class is recommended
		api = API.minimalApi();
		collection = api.addCollection('collection', {});
		items = api.addManyItems(collection, 3);
    item = items[0];
	});

  test('renders a map with item geometry', async ({ page, worker }) => {
    await api.createServer(worker);
    
    await page.goto(item.getBrowserPath());
    await waitForBrowserReady(page);

    await expect(page.locator('.map')).toBeVisible();
  });

   test('map & thumbnails behave correctly', async ({ page, worker }) => {
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
