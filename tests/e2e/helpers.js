/**
 * E2E test helpers for STAC Browser.
 *
 * All HTTP mocking is driven by **MSW (Mock Service Worker)** handlers.
 * Handler-building functions return arrays of MSW `http.*` request handlers.
 * Mocking helpers accept a `worker` fixture (from playwright-msw) and call
 * `worker.use()` to install handlers for the current test.
 *
 * Navigation / assertion helpers still accept a Playwright `page` object.
 */

import { expect } from '@playwright/test';
import { http, HttpResponse } from 'msw';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

// ─── Fixture loading ─────────────────────────────────────────────────────────

const FIXTURES_ROOT = path.resolve(
  fileURLToPath(new URL('../fixtures/catalogs/', import.meta.url)),
);

/**
 * Load and parse a JSON fixture file from tests/fixtures/catalogs/<folder>/...
 *
 * @param {string} folderName  – subfolder under fixtures/catalogs/
 * @param {...string} fileParts – path segments within the folder (e.g. 'eo-collection', 'item-2025-001.json')
 * @returns {object} parsed JSON
 */
export function loadFixture(folderName, ...fileParts) {
  return JSON.parse(
    fs.readFileSync(path.join(FIXTURES_ROOT, folderName, ...fileParts), 'utf8'),
  );
}

// ─── Constants ───────────────────────────────────────────────────────────────

export const HOME_PATH = '/';

const DEFAULT_API_URL = 'https://example.com/api';

// Search page path when running without a configured catalogUrl (external mode).
export const SEARCH_PATH = `/search/external/${new URL(DEFAULT_API_URL).host}${new URL(DEFAULT_API_URL).pathname}`;

// ─── Convenience: single-resource helpers ───────────────────────────────────

/**
 * Register a single mock resource via MSW.
 *
 * @param {import('playwright-msw').MockServiceWorker} worker
 * @param {string} url – exact URL to intercept
 * @param {object} mockData – JSON response body
 * @param {object} [options]
 */
export async function mockStacResource(worker, url, mockData, options = {}) {
  const status = options.status ?? 200;
  const delay = options.delay ?? 0;
  await worker.use(
    http.all(url, async () => {
      if (delay > 0) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }
      return HttpResponse.json(mockData, { status });
    }),
  );
}

/**
 * Register an error response for a URL via MSW.
 *
 * @param {import('playwright-msw').MockServiceWorker} worker
 * @param {string} url – exact URL to intercept
 * @param {number} [status=404]
 * @param {string} [message='Not Found']
 */
export async function mockStacError(worker, url, status = 404, message = 'Not Found') {
  await worker.use(
    http.all(url, () => {
      return HttpResponse.json(
        { code: status, description: message },
        { status },
      );
    }),
  );
}

// ─── Static catalog handlers ────────────────────────────────────────────────

/**
 * Build MSW request handlers for every JSON file in a fixture folder.
 *
 * The folder is located under tests/fixtures/catalogs/<name>.
 * Each JSON file's `self` link is used as the URL to intercept.
 *
 * @param {string} folderName  – subfolder under fixtures/catalogs/
 * @param {string} catalogUrl  – the external URL the root catalog is served at
 * @returns {Array<import('msw').RequestHandler>}
 */
export function staticCatalogHandlers(folderName, catalogUrl) {
  const fixturesRoot = path.resolve(
    fileURLToPath(new URL('../fixtures/catalogs/', import.meta.url)),
  );
  const base = path.join(fixturesRoot, folderName);

  function findJsonFiles(dir) {
    const results = [];
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        results.push(...findJsonFiles(full));
      } else if (entry.name.endsWith('.json')) {
        results.push(full);
      }
    }
    return results;
  }

  const handlers = [];

  // Root catalog handler (matched by catalogUrl)
  const catalog = JSON.parse(fs.readFileSync(path.join(base, 'catalog.json'), 'utf8'));
  handlers.push(http.get(catalogUrl, () => HttpResponse.json(catalog)));

  // Every other fixture file matched by its self link
  for (const file of findJsonFiles(base)) {
    const data = JSON.parse(fs.readFileSync(file, 'utf8'));
    const selfLink = (data.links || []).find(l => l.rel === 'self');
    if (selfLink && selfLink.href !== catalogUrl) {
      const href = selfLink.href;
      const body = data;
      handlers.push(http.get(href, () => HttpResponse.json(body)));
    }
  }

  return handlers;
}

/**
 * Register all static catalog handlers via MSW.
 *
 * @param {import('playwright-msw').MockServiceWorker} worker
 * @param {string} folderName – subfolder under fixtures/catalogs/
 * @param {string} catalogUrl – the external URL the root catalog is served at
 */
export async function mockCatalogByFolder(worker, folderName, catalogUrl) {
  const handlers = staticCatalogHandlers(folderName, catalogUrl);
  await worker.use(...handlers);
}

// ─── STAC Index handlers ────────────────────────────────────────────────────

/**
 * Build an MSW handler for the STAC Index API used on the homepage.
 * Reads tests/fixtures/catalogs.json.
 *
 * @returns {Array<import('msw').RequestHandler>}
 */
export function stacIndexHandlers() {
  const file = path.resolve(
    fileURLToPath(new URL('../fixtures/catalogs.json', import.meta.url)),
  );
  const catalogs = JSON.parse(fs.readFileSync(file, 'utf8'));
  return [http.get('https://stacindex.org/api/catalogs', () => HttpResponse.json(catalogs))];
}

// ─── STAC API root + collections handlers (for search page) ─────────────────

/**
 * Build MSW handlers for a STAC API root, collections, and search endpoints.
 *
 * Loads fixture data from tests/fixtures/api/ and wires each file to the
 * correct URL.  The fixtures use DEFAULT_API_URL; if a different baseUrl is
 * provided, all URLs in the fixtures are rewritten accordingly.
 *
 * @param {object} [options]
 * @param {string} [options.baseUrl] – origin URL for the mock API
 * @param {string} [options.searchFixture] – filename in fixtures/api/ for POST /search
 * @returns {Array<import('msw').RequestHandler>}
 */
export function apiRootHandlers({
  baseUrl = DEFAULT_API_URL, 
  searchFixture = 'search-empty.json',
  rootFixture = 'root.json',
  collectionsFixture = 'collections.json',
  collectionsPage2Fixture = null,
} = {}) {
  const fixtureDir = path.resolve(
    fileURLToPath(new URL('../fixtures/api/', import.meta.url)),
  );
  const root = JSON.parse(fs.readFileSync(path.join(fixtureDir, rootFixture), 'utf8'));
  const collections = JSON.parse(fs.readFileSync(path.join(fixtureDir, collectionsFixture), 'utf8'));
  const searchResult = JSON.parse(fs.readFileSync(path.join(fixtureDir, searchFixture), 'utf8'));

  // If a custom baseUrl is provided, rewrite all URLs in the fixtures
  const rewrite = (obj) =>
    baseUrl !== DEFAULT_API_URL
      ? JSON.parse(JSON.stringify(obj).replaceAll(DEFAULT_API_URL, baseUrl))
      : obj;

  const handlers = [
    http.get(baseUrl, () => HttpResponse.json(rewrite(root))),
    http.post(`${baseUrl}/search`, () => HttpResponse.json(rewrite(searchResult))),
  ];

  if (collectionsPage2Fixture) {
    const page2 = JSON.parse(fs.readFileSync(path.join(fixtureDir, collectionsPage2Fixture), 'utf8'));
    // Dynamically inject a "next" link into the first-page response
    const collectionsWithNext = JSON.parse(JSON.stringify(collections));
    collectionsWithNext.links.push({
      rel: 'next',
      href: `${DEFAULT_API_URL}/collections?cursor=page2`,
      type: 'application/json',
    });
    handlers.push(
      http.get(`${baseUrl}/collections`, ({ request }) => {
        const url = new URL(request.url);
        if (url.searchParams.get('cursor') === 'page2') {
          return HttpResponse.json(rewrite(page2));
        }
        return HttpResponse.json(rewrite(collectionsWithNext));
      }),
    );
  } else {
    handlers.push(
      http.get(`${baseUrl}/collections`, () => HttpResponse.json(rewrite(collections))),
    );
  }

  return handlers;
}

/**
 * Register API root + collections + search handlers via MSW.
 *
 * @param {import('playwright-msw').MockServiceWorker} worker
 * @param {object} [options]
 */
export async function mockApiRootAndCollections(worker, options = {}) {
  const handlers = apiRootHandlers(options);
  await worker.use(...handlers);
}

/**
 * Register API root + collections with a paginated search endpoint (3 pages).
 *
 * POST /search returns the first page (search-page1.json) which includes
 * `next` and `last` links.  GET /search?cursor=page2 returns the middle page
 * (search-page2.json) with `first`, `prev`, `next`, and `last` links.
 * GET /search?cursor=page3 returns the last page (search-page3.json) with
 * `first` and `prev` links.
 *
 * @param {import('playwright-msw').MockServiceWorker} worker
 * @param {object} [options]
 * @param {string} [options.baseUrl] – API base URL
 */
export async function mockApiRootAndPaginatedSearch(worker, { baseUrl = DEFAULT_API_URL } = {}) {
  const page1 = loadApiFixture('search-page1.json');
  const page2 = loadApiFixture('search-page2.json');
  const page3 = loadApiFixture('search-page3.json');

  const rewrite = (obj) =>
    baseUrl !== DEFAULT_API_URL
      ? JSON.parse(JSON.stringify(obj).replaceAll(DEFAULT_API_URL, baseUrl))
      : obj;

  // Build root + collections handlers WITHOUT the search handler.
  // apiRootHandlers includes a POST /search that returns empty results;
  // we need to replace it with our own paginated version.
  const baseHandlers = apiRootHandlers({ baseUrl });
  const nonSearchHandlers = baseHandlers.filter(
    h => h.info.path !== `${baseUrl}/search`,
  );

  await worker.use(
    ...nonSearchHandlers,
    http.post(`${baseUrl}/search`, () => HttpResponse.json(rewrite(page1))),
    http.get(`${baseUrl}/search`, ({ request }) => {
      const url = new URL(request.url);
      const cursor = url.searchParams.get('cursor');
      if (cursor === 'page3') {
        return HttpResponse.json(rewrite(page3));
      }
      if (cursor === 'page2') {
        return HttpResponse.json(rewrite(page2));
      }
      return HttpResponse.json(rewrite(page1));
    }),
  );
}

/**
 * Load an API fixture file from tests/fixtures/api/.
 *
 * @param {string} filename – JSON file name inside fixtures/api/
 * @returns {object} parsed JSON
 */
export function loadApiFixture(filename) {
  const fixtureDir = path.resolve(
    fileURLToPath(new URL('../fixtures/api/', import.meta.url)),
  );
  return JSON.parse(fs.readFileSync(path.join(fixtureDir, filename), 'utf8'));
}

/**
 * Register handlers for browsing an API-backed collection.
 *
 * Mocks the full API: root, /collections, /search, plus the individual
 * collection endpoint and its /items endpoint (with optional pagination).
 *
 * @param {import('playwright-msw').MockServiceWorker} worker
 * @param {object} [options]
 * @param {string} [options.baseUrl] – API base URL
 * @param {string} [options.collectionId] – collection ID to mock
 * @param {string} [options.collectionFixture] – fixture filename for the collection
 * @param {string} [options.itemsFixture] – fixture filename for the items response
 * @param {string} [options.itemsPage2Fixture] – optional fixture for page 2
 */
export async function mockApiCollection(worker, {
  baseUrl = DEFAULT_API_URL,
  collectionId = 'test-collection-1',
  collectionFixture = 'collection-1.json',
  itemsFixture = 'collection-1-items.json',
  itemsPage2Fixture = null,
} = {}) {
  // Register root + collections + search
  await mockApiRootAndCollections(worker, { baseUrl });

  const collection = loadApiFixture(collectionFixture);
  const items = loadApiFixture(itemsFixture);

  const handlers = [
    http.get(`${baseUrl}/collections/${collectionId}`, () => HttpResponse.json(collection)),
  ];

  // Items handler — checks query params for pagination
  if (itemsPage2Fixture) {
    const page2 = loadApiFixture(itemsPage2Fixture);
    handlers.push(
      http.get(`${baseUrl}/collections/${collectionId}/items`, ({ request }) => {
        const url = new URL(request.url);
        if (url.searchParams.get('cursor') === 'page2') {
          return HttpResponse.json(page2);
        }
        return HttpResponse.json(items);
      }),
    );
  } else {
    handlers.push(
      http.get(`${baseUrl}/collections/${collectionId}/items`, () => HttpResponse.json(items)),
    );
  }

  await worker.use(...handlers);
}

// ─── Pagination handlers (for search page) ──────────────────────────────────

/**
 * Register API root + pagination supporting search handler via MSW.
 *
 * @param {import('playwright-msw').MockServiceWorker} worker
 * @param {object} [options]
 */
export async function mockApiRootAndSearch(worker, options = {}) {
  const handlers = paginationRootHandlers(options);
  await worker.use(...handlers);
}

/**
 * Build MSW handlers for a barebones STAC API root, containing a search endpoint.
 *
 * The search endpoint uses a search handler that procides a paginated list of STAC-
 * items as well as controls
 * The fixtures use DEFAULT_API_URL; if a different baseUrl is
 * provided, all URLs in the fixtures are rewritten accordingly.
 *
 * @param {object} [options]
 * @param {string} [options.baseUrl] – origin URL for the mock API
 * @param {object} [paginationOptions]
 * @returns TODO
 */
export function paginationRootHandlers(
  { baseUrl = DEFAULT_API_URL, limit = 10, page=1, prev = false, first = false, last = false} = {}
) {
  const fixtureDir = path.resolve(
    fileURLToPath(new URL('../fixtures/api/', import.meta.url)),
  );
  const root = JSON.parse(fs.readFileSync(path.join(fixtureDir, 'root.json'), 'utf8'));
  const collections = JSON.parse(fs.readFileSync(path.join(fixtureDir, 'collections.json'), 'utf8'));

  // If a custom baseUrl is provided, rewrite all URLs in the fixtures
  const rewrite = (obj) =>
    baseUrl !== DEFAULT_API_URL
      ? JSON.parse(JSON.stringify(obj).replaceAll(DEFAULT_API_URL, baseUrl))
      : obj;

  return [
    http.get(baseUrl, () => HttpResponse.json(rewrite(root))),
    http.get(`${baseUrl}/collections`, () => { 
      const result = rewrite(collections);
      return HttpResponse.json(result);
    }),
    http.get(`${baseUrl}/search`, ({ request }) => {
      const url = new URL(request.url);

      limit = parseInt(url.searchParams.get('limit')) || limit;
      page = parseInt(url.searchParams.get('page')) || page;
      const searchResult = paginatedSearchHandler(baseUrl, limit, page, prev, first, last);
      return HttpResponse.json(rewrite(searchResult));
    }),
    http.post(`${baseUrl}/search`, async ({ request }) => {
      const post = await request.json();
      limit = parseInt(post.limit) || limit;
      page = parseInt(post.page) || page;
      const searchResult = paginatedSearchHandler(baseUrl, limit, page, prev, first, last);
      return HttpResponse.json(rewrite(searchResult));   
    })
  ];
}

/**
 * Search endpoint that returns a paginated collection of items.
 *
 * The search endpoint returns a paginated collection of items in JSON format
 * to the 
 *
 * @param {object} [options]
 * @returns TODO
 */
export function paginatedSearchHandler(
  baseUrl = DEFAULT_API_URL,
  limit = 10, 
  pageNumber = 1, 
  prev = false, 
  first = false, 
  last = false
){
  const fixtureDir = path.resolve(
    fileURLToPath(new URL('../fixtures/api/', import.meta.url)),
  );
  // generate page
  let items = JSON.parse(fs.readFileSync(path.join(fixtureDir, '/search-paginated/items.json'), 'utf8'));
  const itemsLength = items.length;
  const currentIndex = (pageNumber-1) * limit;
  items = items.slice(currentIndex, currentIndex + limit);

  // prepare fixture
  let page = JSON.parse(fs.readFileSync(path.join(fixtureDir, '/search-paginated/page.json'), 'utf8'));
  page.features = items;
  const linkFixture = JSON.parse(fs.readFileSync(path.join(fixtureDir, '/search-paginated/link.json'), 'utf8'));
  
  //add links
  if((currentIndex + limit) < itemsLength){ //check if next pages exist
    let nextLink = structuredClone(linkFixture);
    nextLink.rel = 'next';
    nextLink.href = `${baseUrl}/search?page=${pageNumber + 1}&limit=${limit}`;
    page.links.push(nextLink);
  }
  if (prev && pageNumber > 1){
    let prevLink = structuredClone(linkFixture);
    prevLink.rel = 'prev';
    prevLink.href = `${baseUrl}/search?page=${pageNumber - 1}&limit=${limit}`;
    page.links.push(prevLink);
  }
  if (first){
    let firstLink = structuredClone(linkFixture);
    firstLink.rel = 'first';
    firstLink.href = `${baseUrl}/search?limit=${limit}`;
    page.links.push(firstLink);
  }
  if (last){
    let lastLink = structuredClone(linkFixture);
    lastLink.rel = 'last';
    const lastPage = Math.ceil(itemsLength / limit);
    lastLink.href = `${baseUrl}/search?page=${lastPage}limit=${limit}`;
    page.links.push(lastLink);
  }
  return page;
}

// ─── Navigation helpers ─────────────────────────────────────────────────────

/**
 * Navigate to a catalog and wait for it to load.
 *
 * @param {import('@playwright/test').Page} page
 * @param {import('playwright-msw').MockServiceWorker} worker
 * @param {object} catalogData
 * @param {string} [catalogUrl]
 */
export async function loadMockCatalog(page, worker, catalogData, catalogUrl = 'https://example.com/catalog.json') {
  // Ensure the catalog URL is mocked
  await mockStacResource(worker, catalogUrl, catalogData);

  // Convert URL to browser path
  const url = new URL(catalogUrl);
  const protocol = url.protocol !== 'https:' ? url.protocol : '';
  const protocolPart = protocol ? `/${protocol}` : '';
  const browserPath = `/external${protocolPart}/${url.host}${url.pathname}${url.search}`;

  await page.goto(browserPath);
  await waitForBrowserReady(page);
}

/**
 * Wait for STAC Browser to finish loading.
 */
export async function waitForBrowserReady(page) {
  await page.waitForSelector('.loading', { state: 'hidden', timeout: 10000 }).catch(() => {
    // Loading indicator might not appear for fast loads
  });
  await page.waitForSelector('main, .browse, .catalog, .item', { timeout: 10000 });
}

// ─── Search-page helpers ────────────────────────────────────────────────────

/**
 * Wait for the OpenLayers map to be interactive on the search page.
 * Returns the map container locator for clicking.
 */
export async function waitForMapReady(page) {
  const mapContainer = page.locator('.map-container .map');
  await mapContainer.waitFor({ state: 'visible', timeout: 10000 });
  await mapContainer.locator('.ol-viewport').waitFor({ state: 'attached', timeout: 10000 });
  return mapContainer;
}

/**
 * Wait until the bounding-box coordinate inputs have been auto-populated
 * (i.e. all four fields are non-empty).
 */
export async function waitForBboxInputsPopulated(page) {
  const labels = [/west longitude/i, /south latitude/i, /east longitude/i, /north latitude/i];
  for (const label of labels) {
    const input = page.getByLabel(label);
    await expect(input).not.toHaveValue('', { timeout: 10000 });
  }
}

/**
 * Wait for the next POST /search request and return its parsed body.
 * Call this *before* the action that triggers the search.
 *
 * Uses `page.waitForRequest` which fires at the CDP level — it sees the
 * request even when MSW's service worker intercepts it before the network.
 */
export async function waitForSearchPost(page) {
  const request = await page.waitForRequest(
    req => req.method() === 'POST' && req.url().includes('/search'),
  );
  return { body: JSON.parse(request.postData() || '{}'), url: request.url() };
}

/**
 * Wait for the Item list to be visible on the search page.
 * Returns the container of the item list.
 */
export async function waitForPageReady(page) {
  const linkContainer = page.locator('section.list');
  await linkContainer.first().waitFor({ state: 'visible', timeout: 10000 });
  await linkContainer.first().first().waitFor({ state: 'visible', timeout: 10000 });
  return linkContainer;
}