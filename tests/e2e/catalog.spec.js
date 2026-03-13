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
  const sc = (new StaticCatalog({url: 'https://example.com/catalog.json'}))
    .setMetadata({ title: "Custom Example Catalog", description: "An example STAC Catalog with some"});
    
  // const collection = sc.addCollection({url: 'https://example.com/collection.json'});
  // const item = collection.addItem({url: 'https://example.com/item.json'});

  await sc.createServer(worker);
  
  await page.goto(sc.root.getBrowserPath());
  await waitForBrowserReady(page);

  await expect(page.getByRole('heading', { name: /Custom Example Catalog/i })).toBeVisible();
  await expect(page.getByText(/An example STAC Catalog with some/i)).toBeVisible();
  await expect(page.getByRole('link', { name: /STAC Specification/i })).toBeVisible();
});
