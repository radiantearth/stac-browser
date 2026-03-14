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
  test('should load and display collection metadata', async ({ page, worker }) => {
    const title = "Example EO Collection";
    const description = "An example STAC Collection with EO extension.";
    const catalog = (new StaticCatalog({url: 'https://example.com/catalog.json'}));
    const collection = catalog.addCollection({ url: 'https://example.com/collection.json' })
      .setMetadata({ title, description });

     await catalog.createServer(worker);
    
    await page.goto(catalog.root.getBrowserPath());
    await waitForBrowserReady(page);

    await page.getByRole('link', { name: new RegExp(title, 'i') }).click();
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
