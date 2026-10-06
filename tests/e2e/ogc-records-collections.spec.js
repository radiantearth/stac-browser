/**
 * OGC API - Records requires the /collections response of a "Local Resources
 * Catalog" to also be a catalog, i.e. it contains "type": "Collection" and an
 * id next to the collections array. Such responses must still be handled as
 * lists of collections and not as a single STAC Collection.
 */
import { test, expect } from './fixtures.js';
import { waitForBrowserReady } from './helpers.js';
import API from '../fixtures/instances/api.js';

const CARD = '.catalogs .card-grid > *';

function createApi() {
  const api = API.defaultApi({}, { freeTextSearchEnabled: true });
  api.addCollection('alpha').setMetadata({ title: 'Alpha Collection' });
  api.addCollection('beta').setMetadata({ title: 'Beta Collection' });
  api.root.addConformsTo('https://api.stacspec.org/v1.0.0/collection-search');
  api.root.addConformsTo('https://api.stacspec.org/v1.0.0/collection-search#free-text');
  // Members that OGC API - Records requires for the /collections catalog
  api.collections.data.type = 'Collection';
  api.collections.data.id = 'collections';
  api.collections.data.recordsArrayName = 'collections';
  return api;
}

test.describe('OGC API - Records /collections responses', () => {
  test('collection free-text search on the catalog page lists the matching collections', async ({ page, worker }) => {
    const api = createApi();
    await api.createServer(worker);

    await page.goto(api.root.getBrowserPath());
    await waitForBrowserReady(page);
    await expect(page.locator(CARD)).toHaveCount(2);

    const multiselect = page.locator('.catalogs .catalog-filter .multiselect');
    await multiselect.click();
    await multiselect.locator('input.multiselect__input').fill('Alpha');
    await multiselect.locator('input.multiselect__input').press('Enter');

    await expect(page.locator(CARD)).toHaveCount(1);
    await expect(page.getByRole('link', { name: /Alpha Collection/ })).toBeVisible();
  });

  test('collection search on the search page lists the collections', async ({ page, worker }) => {
    const api = createApi();
    await api.createServer(worker);

    await page.goto(api.root.getBrowserPath());
    await waitForBrowserReady(page);
    await page.getByRole('button', { name: /^search$/i }).click();
    await waitForBrowserReady(page);
    await page.getByRole('tab', { name: /search for collections/i }).click();
    await waitForBrowserReady(page);

    await page.getByRole('button', { name: /submit/i }).click();
    await waitForBrowserReady(page);

    await expect(page.getByRole('link', { name: /Alpha Collection/ }).first()).toBeVisible();
    await expect(page.getByRole('link', { name: /Beta Collection/ }).first()).toBeVisible();
  });

  test('loading the collections for the item search does not fail', async ({ page, worker }) => {
    // A paginated /collections response, so that the collections are loaded by the search filter
    const api = API.defaultApi({}, { defaultLimit: 1 });
    api.addCollection('alpha').setMetadata({ title: 'Alpha Collection' });
    api.addCollection('beta').setMetadata({ title: 'Beta Collection' });
    api.addCollectionsExtension()
      .addItemsExtension()
      .addSearchExtension();
    api.root.addConformsTo('https://api.stacspec.org/v1.0.0/collection-search');
    api.collections.data.type = 'Collection';
    api.collections.data.id = 'collections';
    await api.createServer(worker);

    const errors = [];
    page.on('console', message => {
      if (message.type() === 'error' && message.text().includes('TypeError')) {
        errors.push(message.text());
      }
    });

    await page.goto(api.root.getBrowserPath());
    await waitForBrowserReady(page);
    await page.getByRole('button', { name: /^search$/i }).click();
    await waitForBrowserReady(page);
    await page.getByRole('tab', { name: /search for items/i }).click();
    await waitForBrowserReady(page);
    await expect(page.locator('.filter-collection .multiselect')).toBeVisible();

    expect(errors).toEqual([]);
  });

  test('opening /collections directly shows an error instead of a collection', async ({ page, worker }) => {
    const api = createApi();
    await api.createServer(worker);

    await page.goto(api.collections.getBrowserPath());
    await waitForBrowserReady(page);

    await expect(page.getByText(/Direct requests to \/collections/)).toBeVisible();
  });
});
