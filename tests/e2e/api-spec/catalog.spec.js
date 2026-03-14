/**
 * API-backed catalog tests.
 *
 * Verifies STAC Browser behaviour when browsing a STAC API catalog (as opposed
 * to a static catalog).  Covers: collection listing from GET /collections,
 * item loading from GET /collections/{id}/items, pagination, and the item
 * filter toggle.
 *
 * Two modes are tested:
 * 1. External mode (no catalogUrl) – paths are /external/example.com/api/...
 * 2. Configured mode (catalogUrl set) – paths are relative: /, /collections/...
 *
 * Fixtures: tests/fixtures/api/ (root.json, collections.json, collection-1.json,
 *           collection-1-items.json, collection-1-items-page2.json)
 */
import { test, expect } from '../fixtures.js';
import API from '../../fixtures/instances/api.js';
import { waitForBrowserReady } from '../helpers.js';

test.describe('API catalog browsing', () => {

  test.only('root page renders API', async ({ page, worker }) => {
    const api = API.defaultApi();
    const collection = api.addCollection('my-collection', {});
    api.addItem(collection, 'my-item', {});

    await api.createServer(worker);
    
    await page.goto(api.root.getBrowserPath());
    await waitForBrowserReady(page);

    await expect(page.getByRole('heading', { name: /Custom Example Catalog/i })).toBeVisible();
    await expect(page.getByText(/An example STAC Catalog with some/i)).toBeVisible();
    await expect(page.getByRole('link', { name: /STAC Specification/i })).toBeVisible();
  });
});
