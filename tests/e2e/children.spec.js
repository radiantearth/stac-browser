/**
 * Tests for the STAC API - Children extension (#218).
 *
 * The `/children` endpoint (detected through the `children` link relation)
 * lists the immediate child Catalogs and Collections of an entity, at any
 * level of the hierarchy. It supersedes the static `child` links, but is
 * requested in addition to the `/collections` endpoint.
 */
import { test, expect } from './fixtures.js';
import { configureBrowser, waitForBrowserReady } from './helpers.js';
import API from '../fixtures/instances/api.js';

const SECTION = '.catalogs';
const CARD = '.catalogs .card-grid > *';

/**
 * Record all GET requests whose URL matches `pattern`.
 * Uses the CDP-level request event, which sees requests even when MSW's
 * service worker intercepts them before the network.
 */
function trackRequests(page, pattern) {
  const requests = [];
  page.on('request', request => {
    if (request.method() === 'GET' && pattern.test(request.url())) {
      requests.push(request.url());
    }
  });
  return requests;
}

test.describe('Children endpoint on the landing page', () => {
  test('mixed catalog and collection children are rendered', async ({ page, worker }) => {
    const api = API.minimalApi();
    api.addChild('child-catalog').setMetadata({ title: 'Child Catalog' });
    api.addChild('child-collection', { type: 'collection' }).setMetadata({ title: 'Child Collection' });
    await api.createServer(worker);

    const requests = trackRequests(page, /\/api\/children(\?|$)/);

    await page.goto(api.root.getBrowserPath());
    await waitForBrowserReady(page);

    await expect(page.locator(CARD)).toHaveCount(2);
    await expect(page.getByRole('link', { name: /Child Catalog/ })).toBeVisible();
    await expect(page.getByRole('link', { name: /Child Collection/ })).toBeVisible();
    expect(requests.length).toBe(1);
  });

  test('children supersede static child links but not the collections endpoint', async ({ page, worker }) => {
    const api = API.defaultApi();
    // A collection from the collections endpoint that is also a child
    const shared = api.addCollection('shared-collection').setMetadata({ title: 'Shared Collection' });
    api.addExistingChild(shared);
    api.addCollection('api-collection').setMetadata({ title: 'API Collection' });
    api.addChild('child-catalog').setMetadata({ title: 'Child Catalog' });
    // A static child link that must NOT be merged in, the children endpoint is authoritative
    api.addStaticCatalog({ url: 'static-catalog' }).setMetadata({ title: 'Static Catalog' });
    await api.createServer(worker);

    const childrenRequests = trackRequests(page, /\/api\/children(\?|$)/);
    const collectionRequests = trackRequests(page, /\/api\/collections(\?|$)/);

    await page.goto(api.root.getBrowserPath());
    await waitForBrowserReady(page);

    // Both endpoints are requested
    await expect(page.locator(CARD)).toHaveCount(3);
    expect(childrenRequests.length).toBe(1);
    expect(collectionRequests.length).toBe(1);

    // The children section only lists the children that are not
    // also in the collections list
    const childrenSection = page.locator(SECTION).first();
    await expect(childrenSection.locator('.card-grid > *')).toHaveCount(1);
    await expect(childrenSection.getByRole('link', { name: /Child Catalog/ })).toBeVisible();

    // The collections section lists all collections, including the shared one
    const collectionsSection = page.locator(SECTION).last();
    await expect(collectionsSection.locator('.card-grid > *')).toHaveCount(2);
    await expect(collectionsSection.getByRole('link', { name: /Shared Collection/ })).toBeVisible();
    await expect(collectionsSection.getByRole('link', { name: /API Collection/ })).toBeVisible();

    // The static child link is not shown anywhere
    await expect(page.getByRole('link', { name: /Static Catalog/ })).not.toBeVisible();
  });

  test('navigates into a child through its self link', async ({ page, worker }) => {
    const api = API.minimalApi();
    const child = api.addChild('child-catalog').setMetadata({ title: 'Child Catalog' });
    await api.createServer(worker);

    await page.goto(api.root.getBrowserPath());
    await waitForBrowserReady(page);

    await page.getByRole('link', { name: /Child Catalog/ }).click();
    await waitForBrowserReady(page);

    await expect(page).toHaveURL(new RegExp(child.getBrowserPath()));
  });

  test('children without self links are skipped gracefully', async ({ page, worker }) => {
    const api = API.minimalApi();
    api.addChild('child-catalog').setMetadata({ title: 'Child Catalog' });
    api.addChild('flawed-catalog').setMetadata({ title: 'Flawed Catalog' }).removeSelfLink();
    await api.createServer(worker);

    await page.goto(api.root.getBrowserPath());
    await waitForBrowserReady(page);

    await expect(page.locator(CARD)).toHaveCount(1);
    await expect(page.getByRole('link', { name: /Child Catalog/ })).toBeVisible();
    await expect(page.getByRole('link', { name: /Flawed Catalog/ })).not.toBeVisible();
  });
});

test.describe('Children pagination', () => {
  function createApi() {
    // Two children per page => two pages
    const api = API.minimalApi({}, { defaultLimit: 2 });
    api.addChild('child-1').setMetadata({ title: 'Test Child 1' });
    api.addChild('child-2').setMetadata({ title: 'Test Child 2' });
    api.addChild('child-3', { type: 'collection' }).setMetadata({ title: 'Test Child 3' });
    return { api };
  }

  test('further pages are loaded through the load-more mechanism', async ({ page, worker }) => {
    const { api } = createApi();
    await api.createServer(worker);

    const requests = trackRequests(page, /\/api\/children(\?|$)/);

    await page.goto(api.root.getBrowserPath());
    await waitForBrowserReady(page);

    await expect(page.getByRole('link', { name: /Test Child 1/ })).toBeVisible();

    // Load the remaining page through the load-more button. Duplicate clicks
    // are harmless: in-flight pages are deduplicated by the store.
    const loadMoreButton = page.locator(SECTION).getByRole('button', { name: /load more/i });
    await expect.poll(async () => {
      if (await loadMoreButton.isVisible()) {
        await loadMoreButton.click().catch(() => {});
      }
      return page.locator(CARD).count();
    }, { timeout: 15000 }).toBe(3);

    await expect(page.getByRole('link', { name: /Test Child 2/ })).toBeVisible();
    await expect(page.getByRole('link', { name: /Test Child 3/ })).toBeVisible();

    // All pages loaded => the load-more button disappears
    await expect(loadMoreButton).not.toBeVisible();
    expect(requests.length).toBe(2);
  });

  test('the tree shows the loaded children pages in sync', async ({ page, worker }) => {
    const { api } = createApi();
    await api.createServer(worker);

    await page.goto(api.root.getBrowserPath());
    await waitForBrowserReady(page);
    await expect(page.getByRole('link', { name: /Test Child 1/ })).toBeVisible();

    await page.getByRole('button', { name: /browse/i }).click();
    const sidebar = page.locator('#sidebar');
    await expect(sidebar).toBeVisible({ timeout: 10000 });
    await expect(sidebar.getByText('Test Child 1')).toBeVisible();
    // The next page of children loads automatically once the tree is shown
    await expect(sidebar.getByText('Test Child 3')).toBeVisible();
  });
});

test.describe('Children at any hierarchy level', () => {
  test('a nested catalog exposes its own children endpoint', async ({ page, worker }) => {
    const api = API.minimalApi();
    const nested = api.addChild('nested-catalog').setMetadata({ title: 'Nested Catalog' });
    api.addChildrenExtension(nested, 'catalogs/nested-catalog/children');
    api.addChild('deep-child', { parent: nested, url: 'catalogs/deep-child' }).setMetadata({ title: 'Deep Child' });
    await api.createServer(worker);

    const requests = trackRequests(page, /\/api\/catalogs\/nested-catalog\/children(\?|$)/);

    await page.goto(nested.getBrowserPath());
    await waitForBrowserReady(page);

    await expect(page.getByRole('link', { name: /Deep Child/ })).toBeVisible();
    expect(requests.length).toBe(1);
  });

  test('a collection with children and items endpoints loads both', async ({ page, worker }) => {
    const api = API.defaultApi();
    const collection = api.addCollection('my-collection').setMetadata({ title: 'Test Collection' });
    api.addItem(collection, 'item-1').setMetadata({ id: 'item-1' });
    api.addChildrenExtension(collection, 'collections/my-collection/children');
    api.addChild('sub-collection', {
      parent: collection,
      type: 'collection',
      url: 'collections/sub-collection'
    }).setMetadata({ title: 'Sub Collection' });
    await api.createServer(worker);

    const childrenRequests = trackRequests(page, /\/api\/collections\/my-collection\/children(\?|$)/);
    const itemRequests = trackRequests(page, /\/api\/collections\/my-collection\/items(\?|$)/);

    await page.goto(collection.getBrowserPath());
    await waitForBrowserReady(page);

    await expect(page.getByRole('link', { name: /Sub Collection/ })).toBeVisible();
    await expect(page.getByRole('link', { name: /item-1/ })).toBeVisible();
    expect(childrenRequests.length).toBe(1);
    expect(itemRequests.length).toBe(1);
  });
});

test.describe('Children display options', () => {
  function createApi() {
    const api = API.defaultApi();
    api.addCollection('api-collection').setMetadata({ title: 'API Collection' });
    api.addChild('child-catalog').setMetadata({ title: 'Child Catalog' });
    return { api };
  }

  test('apiCatalogPriority childs shows only the children section', async ({ page, worker }) => {
    const { api } = createApi();
    await api.createServer(worker);
    await configureBrowser(page, { apiCatalogPriority: 'childs' });

    await page.goto(api.root.getBrowserPath());
    await waitForBrowserReady(page);

    await expect(page.locator(CARD)).toHaveCount(1);
    await expect(page.getByRole('link', { name: /Child Catalog/ })).toBeVisible();
  });

  test('apiCatalogPriority collections shows only the collections section', async ({ page, worker }) => {
    const { api } = createApi();
    await api.createServer(worker);
    await configureBrowser(page, { apiCatalogPriority: 'collections' });

    await page.goto(api.root.getBrowserPath());
    await waitForBrowserReady(page);

    await expect(page.locator(CARD)).toHaveCount(1);
    await expect(page.getByRole('link', { name: /API Collection/ })).toBeVisible();
  });

  test('mergeCatalogsAndCollections merges children and collections into one list', async ({ page, worker }) => {
    const { api } = createApi();
    const shared = api.addCollection('shared-collection').setMetadata({ title: 'Shared Collection' });
    api.addExistingChild(shared);
    await api.createServer(worker);
    await configureBrowser(page, { mergeCatalogsAndCollections: true });

    await page.goto(api.root.getBrowserPath());
    await waitForBrowserReady(page);

    await expect(page.locator(SECTION)).toHaveCount(1);
    // 1 child catalog + 2 collections, the shared collection is deduplicated
    await expect(page.locator(CARD)).toHaveCount(3);
    await expect(page.getByRole('link', { name: /Child Catalog/ })).toBeVisible();
    await expect(page.getByRole('link', { name: /API Collection/ })).toBeVisible();
    await expect(page.getByRole('link', { name: /Shared Collection/ })).toBeVisible();
  });
});

test.describe('Interplay with other API features', () => {
  test('collection free-text search is unaffected by the children endpoint', async ({ page, worker }) => {
    const api = API.defaultApi({}, { freeTextSearchEnabled: true });
    api.addCollection('alpha').setMetadata({ title: 'Alpha Collection' });
    api.addCollection('beta').setMetadata({ title: 'Beta Collection' });
    api.addChild('child-catalog').setMetadata({ title: 'Child Catalog' });
    api.root.addConformsTo('https://api.stacspec.org/v1.0.0/collection-search');
    api.root.addConformsTo('https://api.stacspec.org/v1.0.0/collection-search#free-text');
    await api.createServer(worker);

    const requests = trackRequests(page, /\/api\/collections(\?|$)/);

    await page.goto(api.root.getBrowserPath());
    await waitForBrowserReady(page);
    await expect(page.locator(CARD)).toHaveCount(3);

    // Search for "Alpha" in the collections section:
    // a q request is sent and only the match is shown there
    const collectionsSection = page.locator(SECTION).last();
    const multiselect = collectionsSection.locator('.catalog-filter .multiselect');
    await multiselect.click();
    await multiselect.locator('input.multiselect__input').fill('Alpha');
    await multiselect.locator('input.multiselect__input').press('Enter');

    await expect(collectionsSection.locator('.card-grid > *')).toHaveCount(1);
    await expect(collectionsSection.getByRole('link', { name: /Alpha Collection/ })).toBeVisible();
    expect(requests.some(url => url.includes('q=Alpha'))).toBe(true);

    // The children section is unaffected by the search
    const childrenSection = page.locator(SECTION).first();
    await expect(childrenSection.getByRole('link', { name: /Child Catalog/ })).toBeVisible();

    // Remove the search term: the full list is restored from the cache
    await collectionsSection.locator('.catalog-filter .multiselect__tag-icon').click();
    await expect(page.locator(CARD)).toHaveCount(3);
  });

  test('no children request without the children extension', async ({ page, worker }) => {
    const api = API.defaultApi();
    api.addCollection('api-collection').setMetadata({ title: 'API Collection' });
    await api.createServer(worker);

    const requests = trackRequests(page, /\/children(\?|$)/);

    await page.goto(api.root.getBrowserPath());
    await waitForBrowserReady(page);

    await expect(page.getByRole('link', { name: /API Collection/ })).toBeVisible();
    expect(requests.length).toBe(0);
  });
});
