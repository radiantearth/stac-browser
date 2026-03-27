/**
* API-backed catalog tests.
*
* Verifies STAC Browser behaviour when browsing a STAC API catalog (as opposed
* to a static catalog).  Covers: collection listing from GET /collections,
* item loading from GET /collections/{id}/items, pagination, and the item
* filter toggle.
*
* Two modes are tested:
* 1. External mode (no catalogUrl) – paths are /external/stac.example/api/...
* 2. Configured mode (catalogUrl set) – paths are relative: /, /collections/...
*
* Fixtures: tests/fixtures/api/ (root.json, collections.json, collection-1.json,
*           collection-1-items.json, collection-1-items-page2.json)
*/
import { test, expect } from '../fixtures.js';
import API from '../../fixtures/instances/api.js';
import { waitForBrowserReady } from '../helpers.js';

test.describe('API catalog browsing', () => {
  
  test('root page renders API', async ({ page, worker }) => {
    const api = API.defaultApi({});
    const collection = api.addCollection('my-collection', {});
    api.addItem(collection, 'my-item', {});
    
    await api.createServer(worker);
    
    await page.goto(api.root.getBrowserPath());
    await waitForBrowserReady(page);
    
    await expect(page.getByRole('heading', { name: /Example API/i })).toBeVisible();
    await expect(page.getByText(/An example STAC API with some/i)).toBeVisible();
    await expect(page.getByRole('link', { name: /STAC Specification/i })).toBeVisible();
  });
});


test.describe('API Catalog - toolBar', () => {
  let api;
  
  test.beforeEach(async ({ worker }) => {
    api = API.defaultApi({});
    await api.createServer(worker);
  });
  
  test('should have a working source view button', async ({ page }) => {
    await page.goto(api.root.getBrowserPath());
    await waitForBrowserReady(page);
    
    const sourceButton = page.getByRole('button', { name: /source/i });
    await expect(sourceButton).toBeVisible();
    await sourceButton.click();
    
    // Confirm the source popover shows the STAC version label and value
    await expect(page.getByText(/STAC Version/i)).toBeVisible();
    await expect(page.getByText(/1\.1\.0/)).toBeVisible();
  });
  
  test('share button is visible', async ({ page }) => {
    await page.goto(api.root.getBrowserPath());
    await waitForBrowserReady(page);
    
    const shareButton = page.getByRole('button', { name: /share/i });
    await expect(shareButton).toBeVisible();
  });
  
  test('share button copies URL to clipboard', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-write', 'clipboard-read']);
    await page.goto(api.root.getBrowserPath());
    await waitForBrowserReady(page);
    
    const shareButton = page.getByRole('button', { name: /share/i });
    await expect(shareButton).toBeVisible();
    await shareButton.click();
    
    // The share popover contains a copy button; click it to copy the current page URL
    const copyButton = page.getByRole('button', { name: /copy/i });
    await expect(copyButton).toBeVisible();
    await copyButton.click();
    
    // Verify the URL was copied to the clipboard
    const clipboardText = await page.evaluate(() => navigator.clipboard.readText());
    await expect(clipboardText).toContain(api.root.getBrowserPath());
  });
});


test.describe('API Catalog - Children', () => {
  let api;
  let collection;
  
  test.beforeEach(async () => {
    api = API.defaultApi({});
    collection = api.addCollection('my-collection', {});
    collection.setMetadata({ title: 'Test Collection' });
    api.addItem(collection, 'my-item', {});
  });

  test('renders child collection as link', async ({ page, worker }) => {
    await api.createServer(worker);
    
    await page.goto(api.root.getBrowserPath());
    await waitForBrowserReady(page);
    
    await expect(page.getByRole('link', { name: new RegExp(collection.getMetadata().title) })).toBeVisible();
  });
  
  test('renders multiple child collections', async ({ page, worker }) => {
    api = API.defaultApi({});
    const collection1 = api.addCollection('collection-1', {url: 'collections/collection-1'}).setMetadata({ title: 'Test Collection 1' });
    const collection2 = api.addCollection('collection-2', {url: 'collections/collection-2'}).setMetadata({ title: 'Test Collection 2' });
    
    await api.createServer(worker);
    
    await page.goto(api.root.getBrowserPath());
    await waitForBrowserReady(page);
    
    await expect(page.locator('.catalogs .card-grid > *')).toHaveCount(2);
    await expect(page.getByRole('link', { name: new RegExp(collection1.getMetadata().title) })).toBeVisible();
    await expect(page.getByRole('link', { name: new RegExp(collection2.getMetadata().title) })).toBeVisible();
  });
  
  test('renders no children message when catalog has no child links', async ({ page, worker }) => {
    api = API.defaultApi({});
    
    await api.createServer(worker);
    
    await page.goto(api.root.getBrowserPath());
    await waitForBrowserReady(page);
    
    await expect(page.locator('.catalogs .card-grid > *')).toHaveCount(0);
  });
  
  test('navigates into a child collection on click', async ({ page, worker }) => {
    collection.setMetadata({ title: 'Test Collection' });
    
    await api.createServer(worker);
    
    await page.goto(api.root.getBrowserPath());
    await waitForBrowserReady(page);
    
    await expect(page.locator('.catalogs .card-grid > *')).toHaveCount(1);
    
    await page.getByRole('link', { name: new RegExp(collection.getMetadata().title) }).click();
    await waitForBrowserReady(page);
    
    // URL should update to the collection URL
    await expect(page).toHaveURL(new RegExp(collection.getBrowserPath()));
  });
});
