/**
 * Breadcrumb navigation tests.
 *
 * Tests breadcrumb rendering and navigation at each hierarchy level.
 */
import { test, expect } from './fixtures.js';
import { waitForBrowserReady } from './helpers.js';
import StaticCatalog from '../fixtures/instances/static.js';

test.describe('Breadcrumb navigation', () => {
  function createNestedCatalog() {
    const catalog = new StaticCatalog({ url: 'https://stac.example/catalog.json' });
    catalog.root.setMetadata({ title: 'Root Catalog' });

    const collection = catalog.addCollection({ url: 'https://stac.example/collection.json' });
    collection.setMetadata({ title: 'Test Collection' });

    const item = collection.addItem({ url: 'https://stac.example/item.json' });
    item.setMetadata({ title: 'Test Item', datetime: '2025-01-01T00:00:00Z' });

    return { catalog, collection, item };
  }

  test('should show breadcrumb at catalog level', async ({ page, worker }) => {
    const { catalog } = createNestedCatalog();
    await catalog.createServer(worker);

    await page.goto(catalog.root.getBrowserPath());
    await waitForBrowserReady(page);

    // At root level, breadcrumb should show the catalog title
    const breadcrumb = page.locator('.breadcrumb, nav[aria-label="breadcrumb"]');
    await expect(breadcrumb).toBeVisible();
  });

  test('should show breadcrumb at collection level', async ({ page, worker }) => {
    const { catalog, collection } = createNestedCatalog();
    await catalog.createServer(worker);

    await page.goto(collection.getBrowserPath());
    await waitForBrowserReady(page);

    // Breadcrumb should show path to collection
    const breadcrumb = page.locator('.breadcrumb, nav[aria-label="breadcrumb"]');
    await expect(breadcrumb).toBeVisible();

    // Should contain link back to root
    await expect(page.getByRole('link', { name: /root catalog/i })).toBeVisible();
  });

  test('should show breadcrumb at item level', async ({ page, worker }) => {
    const { catalog, item } = createNestedCatalog();
    await catalog.createServer(worker);

    await page.goto(item.getBrowserPath());
    await waitForBrowserReady(page);

    // Breadcrumb should show full path
    const breadcrumb = page.locator('.breadcrumb, nav[aria-label="breadcrumb"]');
    await expect(breadcrumb).toBeVisible();

    // Should show hierarchy
    await expect(page.getByRole('link', { name: /root catalog/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /test collection/i })).toBeVisible();
  });

  test('should navigate via breadcrumb links', async ({ page, worker }) => {
    const { catalog, item, collection } = createNestedCatalog();
    await catalog.createServer(worker);

    // Start at item
    await page.goto(item.getBrowserPath());
    await waitForBrowserReady(page);

    // Click collection breadcrumb link
    await page.getByRole('link', { name: /test collection/i }).click();
    await waitForBrowserReady(page);

    // Should be at collection page
    const heading = page.getByRole('heading', { name: /test collection/i });
    await expect(heading).toBeVisible();
  });

  test('should navigate to root via breadcrumb', async ({ page, worker }) => {
    const { catalog, collection } = createNestedCatalog();
    await catalog.createServer(worker);

    // Start at collection
    await page.goto(collection.getBrowserPath());
    await waitForBrowserReady(page);

    // Click root breadcrumb link
    await page.getByRole('link', { name: /root catalog/i }).click();
    await waitForBrowserReady(page);

    // Should be at root page
    const heading = page.getByRole('heading', { name: /root catalog/i });
    await expect(heading).toBeVisible();
  });
});
