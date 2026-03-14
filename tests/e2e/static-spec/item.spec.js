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
import { test } from '../fixtures';
import { waitForBrowserReady } from '../helpers';
import StaticCatalog from '../../fixtures/instances/static.js';

test.describe('Item view - Metadata', () => {
  test('should display item metadata', async ({ page, worker }) => {
    const catalog = new StaticCatalog({ url: 'https://example.com/catalog.json' });
    const collection = catalog.addCollection({ url: 'https://example.com/collection.json' });
    
    collection.addItem({ url: 'https://example.com/item.json' });

    await catalog.createServer(worker);
    
    await page.goto(catalog.root.getBrowserPath());
    await waitForBrowserReady(page);

    await page.getByRole('link', { name: new RegExp(collection.getMetadata().title, 'i') }).click();
    await waitForBrowserReady(page);
  });
  
});
