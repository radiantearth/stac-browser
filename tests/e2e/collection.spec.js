/**
 * Collection metadata & assets tests.
 *
 * Verifies rendering a STAC collection: metadata fields, spatial extent map,
 * item listing, and detail controls.
 */
import { test, expect } from './fixtures.js';
import { waitForBrowserReady } from './helpers.js';
import StaticCatalog from '../fixtures/instances/static.js';
import API from '../fixtures/instances/api.js';

test.describe('Collection Metadata', () => {
  let catalog, collection;
  
  test.beforeEach('should load collection page', async () => {
    catalog = (new StaticCatalog({url: 'https://stac.example/catalog.json'}));
    collection = catalog.addCollection({ url: 'https://stac.example/collection.json' });
  });
  test('should load and display collection metadata', async ({ page, worker }) => {
    const title = "Example EO Collection";
    const description = "An example STAC Collection with EO extension.";
    
    collection.setMetadata({ title, description });
    await catalog.createServer(worker);
    
    await page.goto(collection.getBrowserPath());
    await waitForBrowserReady(page);
    
    // Collection metadata should be displayed
    await expect(page.getByRole('heading', { name: new RegExp(title, 'i') })).toBeVisible();
    await expect(page.getByText(new RegExp(description, 'i'))).toBeVisible();
    
    // Keywords from the collection should be visible
    for (const kw of collection.getMetadata().keywords) {
      const badge = page.locator('.keywords .keyword', { hasText: new RegExp(kw, 'i') });
      await expect(badge.first()).toBeVisible();
    }
    
    // License should be visible
    await expect(page.getByRole('link', { name: new RegExp(collection.getMetadata().license, 'i') })).toBeVisible();
    
    // Temporal extent should be visible with start date
    const start = collection.getMetadata().extent.temporal.interval[0][0].split('T')[0];
    await expect(page.getByText(new RegExp(start))).toBeVisible();
  });
});

test.describe('Collection - toolBar', () => {
  let catalog, collection;
  
  test.beforeEach('should load collection page', async () => {
    catalog = (new StaticCatalog({url: 'https://stac.example/catalog.json'}));
    collection = catalog.addCollection({ url: 'https://stac.example/collection.json' });
  });
  
  test('should have a working source view button, show STAC Version', async ({ page, worker }) => {
    await catalog.createServer(worker);
    
    await page.goto(collection.getBrowserPath());
    await waitForBrowserReady(page);
    
    const sourceButton = page.getByRole('button', { name: /source/i });
    await expect(sourceButton).toBeVisible();
    await sourceButton.click();
    
    // Confirm the source popover shows the STAC version label and value
    await expect(page.getByText(/STAC Version/i)).toBeVisible();
    await expect(page.getByText(/1\.1\.0/)).toBeVisible();
  });
  
  test('source view closes on outside click', async ({ page, worker }) => {
    await catalog.createServer(worker);
    
    await page.goto(collection.getBrowserPath());
    await waitForBrowserReady(page);
    
    const sourceButton = page.getByRole('button', { name: /source/i });
    await expect(sourceButton).toBeVisible();
    await sourceButton.click();
    
    await expect(page.getByText(/STAC Version/i)).toBeVisible();
    // Click outside the popover to close it
    await page.locator('body').click({ position: { x: 0, y: 0 } });
    await expect(page.getByText(/STAC Version/i)).not.toBeVisible();
  });
  
  test('share button is visible', async ({ page, worker }) => {
    await catalog.createServer(worker);
    
    await page.goto(collection.getBrowserPath());
    await waitForBrowserReady(page);
    
    const shareButton = page.getByRole('button', { name: /share/i });
    await expect(shareButton).toBeVisible();
  });
  
  test('share button copies collection\'s getBrowserPath() to clipboard', async ({ page, worker }) => {
    await catalog.createServer(worker);
    
    await page.goto(collection.getBrowserPath());
    await waitForBrowserReady(page);
    
    const shareButton = page.getByRole('button', { name: /share/i });
    await expect(shareButton).toBeVisible();
    await shareButton.click();
    
    // The share popover contains a copy button; click it to copy the current page URL
    const copyButton = page.getByRole('button', { name: /copy/i });
    await expect(copyButton).toBeVisible();
    await copyButton.click();
    
    // The URL copied to clipboard should match the collection's getBrowserPath()
    const clipboardText = await page.evaluate(() => navigator.clipboard.readText());
    expect(clipboardText).toBe(page.url());
  });
  
  test('should have a working back to catalog button', async ({ page, worker }) => {
    await catalog.createServer(worker);
    
    await page.goto(collection.getBrowserPath());
    await waitForBrowserReady(page);
    
    const upButton = page.getByRole('button', { name: /up/i });
    await expect(upButton).toBeVisible();
    await upButton.click();
    
    // Should navigate back to the catalog page
    await expect(page.getByRole('heading', { name: /example catalog/i })).toBeVisible();
  });
});

test.describe('Collection - Items', () => {
  let catalog, collection;
  
  test.beforeEach('should load collection page', async () => {
    catalog = (new StaticCatalog({url: 'https://stac.example/catalog.json'}));
    collection = catalog.addCollection({ url: 'https://stac.example/collection.json' });
  });
  
  test('renders a single child item as a link', async ({ page, worker }) => {
    const item = collection.addItem({ url: 'https://stac.example/item.json' }).setMetadata({ title: 'Example Item' });
    
    await catalog.createServer(worker);
    
    await page.goto(collection.getBrowserPath());
    await waitForBrowserReady(page);
    
    // The child item should be rendered as a link with the item ID
    const itemLink = page.getByRole('link', { name: new RegExp(item.getMetadata().title, 'i')  });
    await expect(itemLink).toBeVisible();
  });
  
  test('renders multiple child items', async ({ page, worker }) => {
    const item1 = collection.addItem({ url: 'https://stac.example/item1.json' }).setMetadata({ title: 'Example Item 1' });
    const item2 = collection.addItem({ url: 'https://stac.example/item2.json' }).setMetadata({ title: 'Example Item 2' });
    
    await catalog.createServer(worker);
    
    await page.goto(collection.getBrowserPath());
    await waitForBrowserReady(page);
    
    await expect(page.locator('.items .card-grid > *')).toHaveCount(2);
    
    await expect(page.getByRole('link', { name: new RegExp(item1.getMetadata().title, 'i') })).toBeVisible();
    await expect(page.getByRole('link', { name: new RegExp(item2.getMetadata().title, 'i') })).toBeVisible();
  });
  
  test('renders no items message when collection has no item links', async ({ page, worker }) => {
    await catalog.createServer(worker);
    
    await page.goto(collection.getBrowserPath());
    await waitForBrowserReady(page);
    
    await expect(page.locator('.items .card-grid > *')).toHaveCount(0);
    
    // A message indicating no items should be visible
    await expect(page.getByText(/No items available for this collection./i)).toBeVisible();
  });
  
  test('navigates into an item on click → URL matches item.getBrowserPath()', async ({ page, worker }) => {
    const item = collection.addItem({ url: 'https://stac.example/item.json' }).setMetadata({ title: 'Example Item' });
    
    await catalog.createServer(worker);
    
    await page.goto(collection.getBrowserPath());
    await waitForBrowserReady(page);
    
    const itemLink = page.getByRole('link', { name: new RegExp(item.getMetadata().title, 'i') });
    await expect(itemLink).toBeVisible();
    await itemLink.click();
    
    // Should navigate to the item's getBrowserPath()
    await expect(page.getByRole('heading', { name: new RegExp(item.getMetadata().title, 'i') })).toBeVisible();
  });
});

test.describe('STAC Collection item search', () => {
  let api;
  let COLLECTION_PATH;
  let collection;
  
  test.beforeEach(async () => {
    api = API.minimalApi(
      {url: "https://stac.example/api/"},
      {
        defaultLimit: 5,
        prevLinkEnabled: true,
        firstLinkEnabled: true,
        lastLinkEnabled: true
      });
    collection = api.addCollection('collection1')
      .setMetadata({ title: 'Test Collection' });
    api.addManyItems(collection, 10);
    api.addCollectionsExtension()
      .addItemsExtension()
      .addSearchExtension();
      
    COLLECTION_PATH = collection.getBrowserPath();
  });
    
  test('Collection view should show item search options', async ({ page, worker }) => {
    await api.createServer(worker);
    await page.goto(COLLECTION_PATH);
    await expect(page.getByRole('heading', { name: collection.getMetadata().title })).toBeVisible();
      
    // show filter button should be visible and open the search form
    const showFilterButton = page.getByRole('button', { name: /show filters/i });
    await expect(showFilterButton).toBeVisible();
    await showFilterButton.click();
      
    await expect(await page.getByLabel(/items per page/i)).toBeVisible();
    await expect(await page.getByLabel(/spatial extent/i)).toBeVisible();
    await expect(await page.getByPlaceholder(/select date range/i)).toBeVisible();
  });
    
  test('changing limit should result in the according number of items rendered', async ({ page, worker }) => {
    await api.createServer(worker);
    await page.goto(COLLECTION_PATH);
      
    // open filters and set limit to 5
    const showFilterButton = page.getByRole('button', { name: /show filters/i });
    await showFilterButton.click();
    const limitInput = page.getByLabel(/items per page/i);
    await limitInput.fill('5');
      
    // submit search and verify 5 items are rendered
    const submitButton = page.getByRole('button', { name: /submit/i });
    await submitButton.click();
    const itemCards = page.locator('.item-card');
    await expect(itemCards).toHaveCount(5, { timeout: 10000 });
  });
    
  test('item search can be paginated with Next and Previous buttons', async ({ page, worker }) => {
    await api.createServer(worker);
    await page.goto(COLLECTION_PATH);
      
    // open filters and submit search with default limit of 5
    const showFilterButton = page.getByRole('button', { name: /show filters/i });
    await showFilterButton.click();
    const submitButton = page.getByRole('button', { name: /submit/i });
    await submitButton.click();
      
    const itemCards = page.locator('.item-card');
    const nextButton = page.getByRole('button', { name: /next/i }).first();
    const prevButton = page.getByRole('button', { name: /previous/i }).first();
      
    // verify first page shows 5 items, Next enabled, Previous disabled
    await expect(itemCards).toHaveCount(5, { timeout: 10000 });
    await expect(nextButton).toBeEnabled();
    await expect(prevButton).toBeDisabled();
      
    // click Next and verify second page shows 5 items, Next disabled, Previous enabled
    await nextButton.click();
    await expect(itemCards).toHaveCount(5, { timeout: 10000 });
    await expect(nextButton).toBeDisabled();
    await expect(prevButton).toBeEnabled();
      
    // click Previous and verify first page is shown again with 5 items, Next enabled, Previous disabled
    await prevButton.click();
    await expect(itemCards).toHaveCount(5, { timeout: 10000 });
    await expect(nextButton).toBeEnabled();
    await expect(prevButton).toBeDisabled(); 
  });
    
  test('item search can be paginated with First and Last buttons', async ({ page, worker }) => {
    await api.createServer(worker);
    await page.goto(COLLECTION_PATH);
      
    // open filters and submit search with default limit of 5
    const showFilterButton = page.getByRole('button', { name: /show filters/i });
    await showFilterButton.click();
    const submitButton = page.getByRole('button', { name: /submit/i });
    await submitButton.click();
      
    const itemCards = page.locator('.item-card');
    const firstButton = page.getByRole('button', { name: /first/i }).first();
    const lastButton = page.getByRole('button', { name: /last/i }).first();
    const nextButton = page.getByRole('button', { name: /next/i }).first();
    const prevButton = page.getByRole('button', { name: /previous/i }).first();
      
    // verify first page shows 5 items, First disabled, Last enabled
    await expect(itemCards).toHaveCount(5, { timeout: 10000 });
    await expect(firstButton).toBeDisabled();
    await expect(lastButton).toBeEnabled();
      
    // click Last to jump to the last page and verify it shows 5 items, Next disabled, First enabled
    await lastButton.click();
    await expect(itemCards).toHaveCount(5, { timeout: 10000 });
    await expect(nextButton).toBeDisabled();
    await expect(firstButton).toBeEnabled();
      
    // click First and verify first page is shown again
    await firstButton.click();
    await expect(itemCards).toHaveCount(5, { timeout: 10000 });
    await expect(prevButton).toBeDisabled();
  });
});
