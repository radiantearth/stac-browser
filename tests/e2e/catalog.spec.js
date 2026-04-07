/**
 * Catalog browsing & navigation tests.
 *
 * Verifies loading a STAC catalog, rendering metadata and child collections,
 * navigating into collections/items, source view, and share functionality.
 */
import { test, expect } from './fixtures.js';
import { waitForBrowserReady } from './helpers.js';
import StaticCatalog from '../fixtures/instances/static.js';
import API from '../fixtures/instances/api.js';

test.describe('Catalog Metadata', () => {
  function createStaticCatalog() {
    const catalog = new StaticCatalog({ url: 'https://stac.example/catalog.json' });
    return { catalog };
  }

  function createAPI() {
    const api = API.defaultApi();
    const collection = api.addCollection('my-collection');
    api.addItem(collection, 'my-item');
    return { api };
  }

  test('Catalog - should load and display catalog metadata', async ({ page, worker }) => {
    const { catalog } = createStaticCatalog();
    const title = "Example Catalog";
    const description = "An example STAC Catalog with some";
    catalog.setMetadata({ title, description });
    
    await catalog.createServer(worker);
    
    await page.goto(catalog.root.getBrowserPath());
    await waitForBrowserReady(page);
    
    // Catalog metadata should be displayed
    await expect(page.getByRole('heading', { name: new RegExp(title) })).toBeVisible();
    await expect(page.getByText(new RegExp(description))).toBeVisible();
  });

  test('API - root page renders API', async ({ page, worker }) => {
    const { api } = createAPI();
    
    await api.createServer(worker);
    
    await page.goto(api.root.getBrowserPath());
    await waitForBrowserReady(page);
    
    await expect(page.getByRole('heading', { name: /Example API/i })).toBeVisible();
    await expect(page.getByText(/An example STAC API with some/i)).toBeVisible();
    await expect(page.getByRole('link', { name: /STAC Specification/i })).toBeVisible();
  });
});

test.describe('Catalog - toolBar', () => {
  function createStaticCatalog() {
    const catalog = new StaticCatalog({ url: 'https://stac.example/catalog.json' });
    return { catalog };
  }

  function createAPI() {
    const api = API.defaultApi();
    return { api };
  }

  // StaticCatalog tests
  test('Catalog - should have a working source view button', async ({ page, worker }) => {
    const { catalog } = createStaticCatalog();
    
    await catalog.createServer(worker);
    
    await page.goto(catalog.root.getBrowserPath());
    await waitForBrowserReady(page);
    
    const sourceButton = page.getByRole('button', { name: /source/i });
    await expect(sourceButton).toBeVisible();
    await sourceButton.click();
    
    // Confirm the source popover shows the STAC version label and value
    await expect(page.getByText(/STAC Version/i)).toBeVisible();
    await expect(page.getByText(/1\.1\.0/)).toBeVisible();
  });
  
  test('Catalog - source view closes on outside click', async ({ page, worker }) => {
    const { catalog } = createStaticCatalog();
    
    await catalog.createServer(worker);
    
    await page.goto(catalog.root.getBrowserPath());
    await waitForBrowserReady(page);
    
    const sourceButton = page.getByRole('button', { name: /source/i });
    await expect(sourceButton).toBeVisible();
    await sourceButton.click();
    
    await expect(page.getByText(/STAC Version/i)).toBeVisible();
    // Click outside the popover to close it
    await page.locator('body').click({ position: { x: 0, y: 0 } });
    await expect(page.getByText(/STAC Version/i)).not.toBeVisible();
  });
  
  test('Catalog - share button is visible', async ({ page, worker }) => {
    const { catalog } = createStaticCatalog();
    
    await catalog.createServer(worker);
    
    await page.goto(catalog.root.getBrowserPath());
    await waitForBrowserReady(page);
    
    const shareButton = page.getByRole('button', { name: /share/i });
    await expect(shareButton).toBeVisible();
  });
  
  test('Catalog - share button copies URL to clipboard', async ({ page, worker }) => {
    const { catalog } = createStaticCatalog();
    
    await catalog.createServer(worker);
    
    await page.goto(catalog.root.getBrowserPath());
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
    await expect(clipboardText).toContain(catalog.root.getBrowserPath());
  });

  // API tests
  test('API - should have a working source view button', async ({ page, worker }) => {
    const { api } = createAPI();
    
    await api.createServer(worker);
    
    await page.goto(api.root.getBrowserPath());
    await waitForBrowserReady(page);
    
    const sourceButton = page.getByRole('button', { name: /source/i });
    await expect(sourceButton).toBeVisible();
    await sourceButton.click();
    
    // Confirm the source popover shows the STAC version label and value
    await expect(page.getByText(/STAC Version/i)).toBeVisible();
    await expect(page.getByText(/1\.1\.0/)).toBeVisible();
  });
  
  test('API - share button is visible', async ({ page, worker }) => {
    const { api } = createAPI();
    
    await api.createServer(worker);
    
    await page.goto(api.root.getBrowserPath());
    await waitForBrowserReady(page);
    
    const shareButton = page.getByRole('button', { name: /share/i });
    await expect(shareButton).toBeVisible();
  });
  
  test('API - share button copies URL to clipboard', async ({ page, worker, context }) => {
    const { api } = createAPI();
    
    await context.grantPermissions(['clipboard-write', 'clipboard-read']);
    await api.createServer(worker);
    
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

test.describe('Catalog - Children', () => {
  function createStaticCatalog() {
    const catalog = new StaticCatalog({ url: 'https://stac.example/catalog.json' });
    return { catalog };
  }

  function createAPI() {
    const api = API.defaultApi();
    return { api };
  }

  // StaticCatalog tests
  test('Catalog - renders child collection as link', async ({ page, worker }) => {
    const { catalog } = createStaticCatalog();
    
    const collection = catalog.addCollection({url: 'https://stac.example/collection.json'});
    collection.setMetadata({ title: 'Test Collection' });
    
    await catalog.createServer(worker);
    
    await page.goto(catalog.root.getBrowserPath());
    await waitForBrowserReady(page);
    
    await expect(page.getByRole('link', { name: new RegExp(collection.getMetadata().title) })).toBeVisible();
  });
  
  test('Catalog - renders multiple child collections', async ({ page, worker }) => {
    const { catalog } = createStaticCatalog();
    
    const collection1 = catalog.addCollection({url: 'https://stac.example/collection-1.json'}).setMetadata({ title: 'Test Collection 1' });
    const collection2 = catalog.addCollection({url: 'https://stac.example/collection-2.json'}).setMetadata({ title: 'Test Collection 2' });
    
    await catalog.createServer(worker);
    
    await page.goto(catalog.root.getBrowserPath());
    await waitForBrowserReady(page);
    
    await expect(page.locator('.catalogs .card-grid > *')).toHaveCount(2);
    await expect(page.getByRole('link', { name: new RegExp(collection1.getMetadata().title) })).toBeVisible();
    await expect(page.getByRole('link', { name: new RegExp(collection2.getMetadata().title) })).toBeVisible();
  });
  
  test('Catalog - renders no children message when catalog has no child links', async ({ page, worker }) => {
    const { catalog } = createStaticCatalog();
    catalog.setMetadata({ title: "Empty Catalog" });
    
    await catalog.createServer(worker);
    
    await page.goto(catalog.root.getBrowserPath());
    await waitForBrowserReady(page);
    
    await expect(page.locator('.catalogs .card-grid > *')).toHaveCount(0);
  });
  
  test('Catalog - navigates into a child collection on click', async ({ page, worker }) => {
    const { catalog } = createStaticCatalog();
    
    const collection = catalog.addCollection({url: 'https://stac.example/collection.json'});
    collection.setMetadata({ title: 'Test Collection' });
    
    await catalog.createServer(worker);
    
    await page.goto(catalog.root.getBrowserPath());
    await waitForBrowserReady(page);
    
    await expect(page.locator('.catalogs .card-grid > *')).toHaveCount(1);
    
    await page.getByRole('link', { name: new RegExp(collection.getMetadata().title) }).click();
    await waitForBrowserReady(page);
    
    // URL should update to the collection URL
    await expect(page).toHaveURL(new RegExp(collection.getBrowserPath()));
  });

  // API tests
  test('API - renders child collection as link', async ({ page, worker }) => {
    const { api } = createAPI();
    const collection = api.addCollection('my-collection');
    collection.setMetadata({ title: 'Test Collection' });
    api.addItem(collection, 'my-item');
    
    await api.createServer(worker);
    
    await page.goto(api.root.getBrowserPath());
    await waitForBrowserReady(page);
    
    await expect(page.getByRole('link', { name: new RegExp(collection.getMetadata().title) })).toBeVisible();
  });
  
  test('API - renders multiple child collections', async ({ page, worker }) => {
    const { api } = createAPI();
    const collection1 = api.addCollection('collection-1', {url: 'collections/collection-1'}).setMetadata({ title: 'Test Collection 1' });
    const collection2 = api.addCollection('collection-2', {url: 'collections/collection-2'}).setMetadata({ title: 'Test Collection 2' });
    
    await api.createServer(worker);
    
    await page.goto(api.root.getBrowserPath());
    await waitForBrowserReady(page);
    
    await expect(page.locator('.catalogs .card-grid > *')).toHaveCount(2);
    await expect(page.getByRole('link', { name: new RegExp(collection1.getMetadata().title) })).toBeVisible();
    await expect(page.getByRole('link', { name: new RegExp(collection2.getMetadata().title) })).toBeVisible();
  });
  
  test('API - renders no children message when catalog has no child links', async ({ page, worker }) => {
    const { api } = createAPI();
    
    await api.createServer(worker);
    
    await page.goto(api.root.getBrowserPath());
    await waitForBrowserReady(page);
    
    await expect(page.locator('.catalogs .card-grid > *')).toHaveCount(0);
  });
  
  test('API - navigates into a child collection on click', async ({ page, worker }) => {
    const { api } = createAPI();
    const collection = api.addCollection('my-collection');
    collection.setMetadata({ title: 'Test Collection' });
    api.addItem(collection, 'my-item');
    
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
