/**
 * Catalog browsing & navigation tests.
 *
 * Verifies loading a static STAC catalog, rendering metadata and child
 * collections, navigating into collections/items, source view, and validation.
 *
 * Fixtures: tests/fixtures/catalogs/test-catalog/
 */
import { test, expect } from './fixtures';
import { waitForBrowserReady } from './helpers';
import StaticCatalog from '../fixtures/instances/static.js';

test.only('root page renders default catalog metadata', async ({ page, worker }) => {
  const sc = new StaticCatalog();
  // load the template without modifications
  sc.addCatalog({ url: 'https://example.com/catalog.json' });

  await sc.createServer(worker);
  
  await page.goto('external/example.com/catalog.json');
  await waitForBrowserReady(page);

  await expect(page.getByRole('heading', { name: /Example Catalog/i })).toBeVisible();
  await expect(page.getByText(/An example STAC Catalog with some/i)).toBeVisible();
  await expect(page.getByRole('link', { name: /STAC Specification/i })).toBeVisible();
});
