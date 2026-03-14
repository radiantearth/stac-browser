/**
 * Catalog browsing & navigation tests.
 *
 * Verifies loading a static STAC catalog, rendering metadata and child
 * collections, navigating into collections/items, source view, and validation.
 *
 * Fixtures: tests/fixtures/catalogs/test-catalog/
 */
import { test, expect } from '../fixtures.js';
import { waitForBrowserReady } from '../helpers.js';
import StaticCatalog from '../../fixtures/instances/static.js';

test.describe('Static catalog Metadata', () => {

  test('should load and display catalog metadata', async ({ page, worker }) => {
    const title = "Example Catalog";
    const description = "An example STAC Catalog with some";
    const catalog = (new StaticCatalog({url: 'https://example.com/catalog.json'}))
      .setMetadata({ title, description });

    await catalog.createServer(worker);
    
    await page.goto(catalog.root.getBrowserPath());
    await waitForBrowserReady(page);

    // Catalog metadata should be displayed
    await expect(page.getByRole('heading', { name: new RegExp(title) })).toBeVisible();
    await expect(page.getByText(new RegExp(description))).toBeVisible();
  });
});

test.describe('Static Catalog - toolBar', () => {
  test('should have a working source view button', async ({ page, worker }) => {
    const catalog = (new StaticCatalog({url: 'https://example.com/catalog.json'}));

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

  test('source view closes on outside click', async ({ page, worker }) => {
    const catalog = (new StaticCatalog({url: 'https://example.com/catalog.json'}));

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

  test('share button is visible', async ({ page, worker }) => {
    const catalog = (new StaticCatalog({url: 'https://example.com/catalog.json'}));

    await catalog.createServer(worker);
    
    await page.goto(catalog.root.getBrowserPath());
    await waitForBrowserReady(page);

    const shareButton = page.getByRole('button', { name: /share/i });
    await expect(shareButton).toBeVisible();
  });

  test('share button copies URL to clipboard', async ({ page, worker, context }) => {
    const catalog = (new StaticCatalog({url: 'https://example.com/catalog.json'}));

    await catalog.createServer(worker);
    await context.grantPermissions(['clipboard-write', 'clipboard-read']);
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
});

  test.describe('Static Catalog - Children', () => {
    test('renders child collection as link', async ({ page, worker }) => {
      const catalog = (new StaticCatalog({url: 'https://example.com/catalog.json'}));

      const collection = catalog.addCollection({url: 'https://example.com/collection.json'});

      collection.setMetadata({ title: 'Test Collection' });

      await catalog.createServer(worker);
      
      await page.goto(catalog.root.getBrowserPath());
      await waitForBrowserReady(page);

      await expect(page.locator('.catalogs .card-grid > *')).toHaveCount(1);
      await expect(page.getByRole('link', { name: new RegExp(collection.getMetadata().title) })).toBeVisible();
    });

    test('renders multiple child collections', async ({ page, worker }) => {
      const catalog = (new StaticCatalog({url: 'https://example.com/catalog.json'}));

      const collection1 = catalog.addCollection({url: 'https://example.com/collection-1.json'}).setMetadata({ title: 'Test Collection 1' });
      const collection2 = catalog.addCollection({url: 'https://example.com/collection-2.json'}).setMetadata({ title: 'Test Collection 2' });

      await catalog.createServer(worker);

      await page.goto(catalog.root.getBrowserPath());
      await waitForBrowserReady(page);

      await expect(page.locator('.catalogs .card-grid > *')).toHaveCount(2);
      await expect(page.getByRole('link', { name: new RegExp(collection1.getMetadata().title) })).toBeVisible();
      await expect(page.getByRole('link', { name: new RegExp(collection2.getMetadata().title) })).toBeVisible();
    });

    test('renders no children message when catalog has no child links', async ({ page, worker }) => {
      const catalog = (new StaticCatalog({url: 'https://example.com/catalog.json'}))
        .setMetadata({ title: "Empty Catalog" });

      await catalog.createServer(worker);
      
      await page.goto(catalog.root.getBrowserPath());
      await waitForBrowserReady(page);

      await expect(page.locator('.catalogs .card-grid > *')).toHaveCount(0);
    });

    test('navigates into a child collection on click', async ({ page, worker }) => {
      const catalog = (new StaticCatalog({url: 'https://example.com/catalog.json'}));

      const collection = catalog.addCollection({url: 'https://example.com/collection.json'});

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
  });
