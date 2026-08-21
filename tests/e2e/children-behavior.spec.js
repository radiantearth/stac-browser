/**
 * Regression tests for how children of a catalog-like entity are loaded and
 * displayed, covering the interplay of static `rel="child"` links and the
 * `/collections` endpoint (rel="data") in many variants.
 *
 * These tests pin down the current behavior before the children/collections
 * handling is refactored for the STAC API - Children extension (#218):
 * merge and de-duplication semantics (#103), `apiCatalogPriority`,
 * pagination, URL guessing (#486), list resets across entities (#617),
 * endpoint precedence in the load action, and collection free-text search.
 */
import { test, expect } from './fixtures.js';
import { configureBrowser, waitForBrowserReady } from './helpers.js';
import API from '../fixtures/instances/api.js';

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

test.describe('Merging static child links and API collections (#103)', () => {
  function createApi() {
    const api = API.defaultApi();
    const collection = api.addCollection('api-collection').setMetadata({ title: 'API Collection' });
    const shared = api.addCollection('shared-collection').setMetadata({ title: 'Shared Collection' });
    // The shared collection is available from /collections AND via a static child link
    api.root.addChildLink(shared);
    const staticCatalog = api.addStaticCatalog({ url: 'static-catalog' }).setMetadata({ title: 'Static Catalog' });
    return { api, collection, shared, staticCatalog };
  }

  test('static child links and API collections are merged and deduplicated', async ({ page, worker }) => {
    const { api } = createApi();
    await api.createServer(worker);

    await page.goto(api.root.getBrowserPath());
    await waitForBrowserReady(page);

    // 2 API collections + 2 static child links, one of which points to an
    // API collection and is deduplicated by its absolute URL
    await expect(page.locator(CARD)).toHaveCount(3);
    await expect(page.getByRole('link', { name: /API Collection/ })).toBeVisible();
    await expect(page.getByRole('link', { name: /Shared Collection/ })).toBeVisible();
    await expect(page.getByRole('link', { name: /Static Catalog/ })).toBeVisible();
  });

  test('static children are listed before API collections', async ({ page, worker }) => {
    const { api } = createApi();
    await api.createServer(worker);
    // Disable the client-side sorting so that the list order is observable
    await configureBrowser(page, { defaultCollectionSort: null });

    await page.goto(api.root.getBrowserPath());
    await waitForBrowserReady(page);

    // Static children come first so they stay reachable despite the
    // infinite scrolling through the paginated collections (#103)
    await expect(page.locator(CARD)).toHaveCount(3);
    await expect(page.locator(CARD).first()).toContainText('Static Catalog');
  });
});

test.describe('apiCatalogPriority', () => {
  function createApi() {
    const api = API.defaultApi();
    api.addCollection('api-collection').setMetadata({ title: 'API Collection' });
    api.addStaticCatalog({ url: 'static-catalog' }).setMetadata({ title: 'Static Catalog' });
    return { api };
  }

  test('null shows both sources', async ({ page, worker }) => {
    const { api } = createApi();
    await api.createServer(worker);

    await page.goto(api.root.getBrowserPath());
    await waitForBrowserReady(page);

    await expect(page.locator(CARD)).toHaveCount(2);
    await expect(page.getByRole('link', { name: /API Collection/ })).toBeVisible();
    await expect(page.getByRole('link', { name: /Static Catalog/ })).toBeVisible();
  });

  test('collections shows only API collections', async ({ page, worker }) => {
    const { api } = createApi();
    await api.createServer(worker);
    await configureBrowser(page, { apiCatalogPriority: 'collections' });

    await page.goto(api.root.getBrowserPath());
    await waitForBrowserReady(page);

    await expect(page.locator(CARD)).toHaveCount(1);
    await expect(page.getByRole('link', { name: /API Collection/ })).toBeVisible();
  });

  test('childs shows only static child links', async ({ page, worker }) => {
    const { api } = createApi();
    await api.createServer(worker);
    await configureBrowser(page, { apiCatalogPriority: 'childs' });

    await page.goto(api.root.getBrowserPath());
    await waitForBrowserReady(page);

    await expect(page.locator(CARD)).toHaveCount(1);
    await expect(page.getByRole('link', { name: /Static Catalog/ })).toBeVisible();
  });

  test('childs hides API collections in the tree', async ({ page, worker }) => {
    const { api } = createApi();
    await api.createServer(worker);
    await configureBrowser(page, { apiCatalogPriority: 'childs' });

    await page.goto(api.root.getBrowserPath());
    await waitForBrowserReady(page);

    await page.getByRole('button', { name: /browse/i }).click();
    const sidebar = page.locator('#sidebar');
    await expect(sidebar).toBeVisible();
    await expect(sidebar.getByText('Static Catalog')).toBeVisible();
    await expect(sidebar.getByText('API Collection')).not.toBeVisible();
  });

  test('childs does not hide collection items in the tree (#990)', async ({ page, worker }) => {
    const { api } = createApi();
    const collection = api.addCollection('items-collection').setMetadata({ title: 'Items Collection' });
    // The child link makes the collection appear in the tree despite the childs priority
    api.root.addChildLink(collection);
    api.addItem(collection, 'item-1');
    await api.createServer(worker);
    await configureBrowser(page, { apiCatalogPriority: 'childs' });

    await page.goto(collection.getBrowserPath());
    await waitForBrowserReady(page);

    await page.getByRole('button', { name: /browse/i }).click();
    const sidebar = page.locator('#sidebar');
    await expect(sidebar).toBeVisible();

    // Clicking the active node toggles it open
    await sidebar.getByRole('button', { name: 'Items Collection' }).click();
    await expect(sidebar.getByText('item-1')).toBeVisible();
    await expect(sidebar.getByText('No children available.')).not.toBeVisible();
  });

  test('collections does not hide item links in the tree (#990)', async ({ page, worker }) => {
    const { api } = createApi();
    const collection = api.addCollection('linked-items').setMetadata({ title: 'Linked Items' });
    const item = collection.addItem({ url: 'collections/linked-items/items/static-item' });
    item.setMetadata({ id: 'static-item' });
    await api.createServer(worker);
    await configureBrowser(page, { apiCatalogPriority: 'collections' });

    await page.goto(collection.getBrowserPath());
    await waitForBrowserReady(page);

    await page.getByRole('button', { name: /browse/i }).click();
    const sidebar = page.locator('#sidebar');
    await expect(sidebar).toBeVisible();

    // Clicking the active node toggles it open
    await sidebar.getByRole('button', { name: 'Linked Items' }).click();
    await expect(sidebar.getByText('static-item')).toBeVisible();
    await expect(sidebar.getByText('No children available.')).not.toBeVisible();
  });

  test('items linked and loaded from the API are deduplicated in the tree', async ({ page, worker }) => {
    const { api } = createApi();
    const collection = api.addCollection('dedup-collection').setMetadata({ title: 'Dedup Collection' });
    const item = api.addItem(collection, 'item-1');
    // The same item is also linked statically
    collection.addItemLink(item);
    await api.createServer(worker);

    await page.goto(collection.getBrowserPath());
    await waitForBrowserReady(page);

    await page.getByRole('button', { name: /browse/i }).click();
    const sidebar = page.locator('#sidebar');
    await expect(sidebar).toBeVisible();

    // Clicking the active node toggles it open
    await sidebar.getByRole('button', { name: 'Dedup Collection' }).click();
    await expect(sidebar.getByText('item-1')).toHaveCount(1);
  });
});

test.describe('Collections pagination on the main page', () => {
  test('further pages are loaded through the load-more mechanism', async ({ page, worker }) => {
    // One collection per page => three pages
    const api = API.defaultApi({}, { defaultLimit: 1 });
    api.addCollection('collection-1').setMetadata({ title: 'Test Collection 1' });
    api.addCollection('collection-2').setMetadata({ title: 'Test Collection 2' });
    api.addCollection('collection-3').setMetadata({ title: 'Test Collection 3' });
    await api.createServer(worker);

    const requests = trackRequests(page, /\/api\/collections(\?|$)/);

    await page.goto(api.root.getBrowserPath());
    await waitForBrowserReady(page);

    await expect(page.getByRole('link', { name: /Test Collection 1/ })).toBeVisible();

    // Load the remaining pages through the load-more button. Duplicate clicks
    // are harmless: in-flight pages are deduplicated by the store.
    const loadMoreButton = page.locator('.catalogs').getByRole('button', { name: /load more/i });
    await expect.poll(async () => {
      if (await loadMoreButton.isVisible()) {
        await loadMoreButton.click().catch(() => {});
      }
      return page.locator(CARD).count();
    }, { timeout: 15000 }).toBe(3);

    await expect(page.getByRole('link', { name: /Test Collection 2/ })).toBeVisible();
    await expect(page.getByRole('link', { name: /Test Collection 3/ })).toBeVisible();

    // All pages loaded => the load-more button disappears
    await expect(loadMoreButton).not.toBeVisible();
    expect(requests.length).toBe(3);
  });
});

test.describe('Collection URLs (#486)', () => {
  test('collections without self links get their URL guessed from the collections endpoint', async ({ page, worker }) => {
    const api = API.defaultApi();
    const collection = api.addCollection('no-self').setMetadata({ title: 'No Self Link' });
    collection.removeSelfLink();
    await api.createServer(worker);

    await page.goto(api.root.getBrowserPath());
    await waitForBrowserReady(page);

    const link = page.getByRole('link', { name: /No Self Link/ });
    await expect(link).toBeVisible();
    await link.click();
    await waitForBrowserReady(page);

    // The URL is guessed as `collections/{id}` relative to the catalog
    await expect(page).toHaveURL(/\/external\/stac\.example\/api\/collections\/no-self/);
  });
});

test.describe('Collections list across entities (#617)', () => {
  test('list is hidden on child entities and restored from the cache when returning', async ({ page, worker }) => {
    const api = API.defaultApi();
    const collection1 = api.addCollection('collection-1').setMetadata({ title: 'Test Collection 1' });
    api.addCollection('collection-2').setMetadata({ title: 'Test Collection 2' });
    api.addItem(collection1, 'item-1');
    await api.createServer(worker);

    const requests = trackRequests(page, /\/api\/collections(\?|$)/);

    await page.goto(api.root.getBrowserPath());
    await waitForBrowserReady(page);
    await expect(page.locator(CARD)).toHaveCount(2);
    expect(requests.length).toBe(1);

    // Navigate into a collection: it exposes no collections endpoint itself,
    // so the parent's collections must not leak into its page
    await page.getByRole('link', { name: /Test Collection 1/ }).click();
    await waitForBrowserReady(page);
    await expect(page).toHaveURL(new RegExp(collection1.getBrowserPath()));
    await expect(page.locator(CARD)).toHaveCount(0);

    // Return to the catalog: the list is restored from the cache without a new request
    await page.goBack();
    await waitForBrowserReady(page);
    await expect(page.locator(CARD)).toHaveCount(2);
    expect(requests.length).toBe(1);
  });
});

test.describe('Endpoint precedence in the load action', () => {
  test('an entity with both data and items links loads collections, not items', async ({ page, worker }) => {
    const api = API.defaultApi();
    api.addCollection('api-collection').setMetadata({ title: 'API Collection' });
    // Also expose an items endpoint on the root, next to the collections endpoint
    api.root.addLink({ href: 'items', rel: 'items', type: 'application/geo+json' });
    await api.createServer(worker);

    const collectionRequests = trackRequests(page, /\/api\/collections(\?|$)/);
    const itemRequests = trackRequests(page, /\/api\/items(\?|$)/);

    await page.goto(api.root.getBrowserPath());
    await waitForBrowserReady(page);

    await expect(page.getByRole('link', { name: /API Collection/ })).toBeVisible();
    expect(collectionRequests.length).toBe(1);
    expect(itemRequests.length).toBe(0);
  });

  test('an entity with only an items link loads items', async ({ page, worker }) => {
    const api = API.defaultApi();
    const collection = api.addCollection('collection-1').setMetadata({ title: 'Test Collection 1' });
    const item = api.addItem(collection, 'item-1');
    item.setMetadata({ id: 'item-1' });
    await api.createServer(worker);

    const itemRequests = trackRequests(page, /\/api\/collections\/collection-1\/items(\?|$)/);

    await page.goto(collection.getBrowserPath());
    await waitForBrowserReady(page);

    await expect(page.getByRole('link', { name: /item-1/ })).toBeVisible();
    expect(itemRequests.length).toBeGreaterThanOrEqual(1);
  });
});

test.describe('Collection free-text search on the catalog page', () => {
  function createApi() {
    const api = API.defaultApi({}, { freeTextSearchEnabled: true });
    api.addCollection('alpha').setMetadata({ title: 'Alpha Collection' });
    api.addCollection('beta').setMetadata({ title: 'Beta Collection' });
    api.root.addConformsTo('https://api.stacspec.org/v1.0.0/collection-search');
    api.root.addConformsTo('https://api.stacspec.org/v1.0.0/collection-search#free-text');
    return { api };
  }

  async function addSearchTerm(page, term) {
    const multiselect = page.locator('.catalogs .catalog-filter .multiselect');
    await multiselect.click();
    await multiselect.locator('input.multiselect__input').fill(term);
    await multiselect.locator('input.multiselect__input').press('Enter');
  }

  test('searching requests /collections with q and clearing restores the cached list', async ({ page, worker }) => {
    const { api } = createApi();
    await api.createServer(worker);

    const requests = trackRequests(page, /\/api\/collections(\?|$)/);

    await page.goto(api.root.getBrowserPath());
    await waitForBrowserReady(page);
    await expect(page.locator(CARD)).toHaveCount(2);

    // Search for "Alpha": a q request is sent and only the match is shown
    await addSearchTerm(page, 'Alpha');
    await expect(page.locator(CARD)).toHaveCount(1);
    await expect(page.getByRole('link', { name: /Alpha Collection/ })).toBeVisible();
    expect(requests.some(url => url.includes('q=Alpha'))).toBe(true);

    const requestsBeforeClearing = requests.length;

    // Remove the search term: the full list is restored from the cache without a request
    await page.locator('.catalogs .catalog-filter .multiselect__tag-icon').click();
    await expect(page.locator(CARD)).toHaveCount(2);
    expect(requests.length).toBe(requestsBeforeClearing);
  });
});
