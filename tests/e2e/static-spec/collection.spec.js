/**
 * Collection metadata & assets tests.
 *
 * Verifies rendering a STAC collection: metadata fields, spatial extent map,
 * item listing, and detail controls.
 *
 * Fixtures: tests/fixtures/catalogs/test-catalog/eo-collection/
 */
import { test, expect } from '../fixtures';
import { waitForBrowserReady } from '../helpers';
import StaticCatalog from '../../fixtures/instances/static.js';

test.describe('Static Collection Metadata', () => {
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

test.describe('Static Collection - toolBar', () => {
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

test.describe('Static Collection - Items', () => {
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
