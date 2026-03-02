/**
 * E2E test helpers for STAC Browser.
 *
 * All HTTP mocking is driven by **handler objects** — plain descriptors that
 * declare *which* URL to intercept and *what* to respond with.  This keeps
 * test setup declarative, easy to read, and easy to extend.
 *
 * Handler shape:
 *   { url: string | RegExp, method?: string, status?: number, body: object }
 *
 * Use `registerHandlers(page, handlers)` to install an array of handlers on a
 * Playwright page.  Convenience functions (`staticCatalogHandlers`,
 * `apiRootHandlers`, `stacIndexHandlers`) build handler arrays from fixtures or
 * inline data so individual specs stay concise.
 */

import { expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';

// ─── Fixture loading ─────────────────────────────────────────────────────────

const FIXTURES_ROOT = path.resolve(
  new URL('../fixtures/catalogs/', import.meta.url).pathname,
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
// Must include the API host+path so the router can derive the parent URL.
export const SEARCH_PATH = `/search/external/${new URL(DEFAULT_API_URL).host}${new URL(DEFAULT_API_URL).pathname}`;

// ─── Core handler registration ──────────────────────────────────────────────

/**
 * Register an array of handler descriptors on a Playwright page.
 *
 * Each handler is a plain object:
 *   url    – string (exact match) or RegExp
 *   method – optional HTTP method filter (default: match all)
 *   status – HTTP status code (default 200)
 *   body   – response payload (will be JSON-stringified)
 *   delay  – optional ms delay before responding
 *
 * @param {import('@playwright/test').Page} page
 * @param {Array<{url: string|RegExp, method?: string, status?: number, body: object, delay?: number}>} handlers
 */
export async function registerHandlers(page, handlers) {
  for (const h of handlers) {
    const {
      url,
      method,
      status = 200,
      body,
      delay = 0,
      contentType = 'application/json',
    } = h;

    await page.route(url, async (route, request) => {
      // If a method filter is set, only intercept matching methods
      if (method && request.method().toUpperCase() !== method.toUpperCase()) {
        return route.fallback();
      }
      if (delay > 0) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }
      await route.fulfill({
        status,
        contentType,
        body: JSON.stringify(body),
      });
    });
  }
}

// ─── Convenience: single-resource helpers (kept for backward compat) ────────

/**
 * Register a single mock resource.
 * Thin wrapper around registerHandlers for one-off mocks.
 */
export async function mockStacResource(page, urlPattern, mockData, options = {}) {
  await registerHandlers(page, [{
    url: urlPattern,
    status: options.status ?? 200,
    body: mockData,
    delay: options.delay ?? 0,
    contentType: options.contentType ?? 'application/json',
  }]);
}

/**
 * Register an error response for a URL.
 */
export async function mockStacError(page, urlPattern, status = 404, message = 'Not Found') {
  await registerHandlers(page, [{
    url: urlPattern,
    status,
    body: { code: status, description: message },
  }]);
}

// ─── Static catalog handlers ────────────────────────────────────────────────

/**
 * Build handler descriptors for every JSON file in a fixture folder.
 *
 * The folder is located under tests/fixtures/catalogs/<name>.
 * Each JSON file's `self` link is used as the URL to intercept.
 *
 * @param {string} folderName  – subfolder under fixtures/catalogs/
 * @param {string} catalogUrl  – the external URL the root catalog is served at
 * @returns {Array<{url: string, body: object}>}
 */
export function staticCatalogHandlers(folderName, catalogUrl) {
  const fixturesRoot = path.resolve(
    new URL('../fixtures/catalogs/', import.meta.url).pathname,
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
  handlers.push({ url: catalogUrl, body: catalog });

  // Every other fixture file matched by its self link
  for (const file of findJsonFiles(base)) {
    const data = JSON.parse(fs.readFileSync(file, 'utf8'));
    const selfLink = (data.links || []).find(l => l.rel === 'self');
    if (selfLink && selfLink.href !== catalogUrl) {
      handlers.push({ url: selfLink.href, body: data });
    }
  }

  return handlers;
}

/**
 * Convenience: register all static catalog handlers at once.
 * Equivalent to the old `mockCatalogByFolder`.
 */
export async function mockCatalogByFolder(page, catalogUrl) {
  const folderName = catalogUrl.replace(/.*\/([^/]+)$/, '$1');
  const handlers = staticCatalogHandlers(folderName, catalogUrl);
  await registerHandlers(page, handlers);
}

// ─── STAC Index handlers ────────────────────────────────────────────────────

/**
 * Build a handler for the STAC Index API used on the homepage.
 * Reads tests/fixtures/catalogs.json.
 */
export function stacIndexHandlers() {
  const file = path.resolve(
    new URL('../fixtures/catalogs.json', import.meta.url).pathname,
  );
  const catalogs = JSON.parse(fs.readFileSync(file, 'utf8'));
  return [{ url: 'https://stacindex.org/api/catalogs', body: catalogs }];
}

// ─── STAC API root + collections handlers (for search page) ─────────────────

/**
 * Build handlers for a STAC API root, collections, and search endpoints.
 *
 * Loads fixture data from tests/fixtures/api/ and wires each file to the
 * correct URL.  The fixtures use DEFAULT_API_URL; if a different baseUrl is
 * provided, all URLs in the fixtures are rewritten accordingly.
 *
 * @param {object} [options]
 * @param {string} [options.baseUrl] – origin URL for the mock API
 * @param {string} [options.searchFixture] – filename in fixtures/api/ to use for POST /search (default: 'search-empty.json')
 * @returns handler array
 */
export function apiRootHandlers({ baseUrl = DEFAULT_API_URL, searchFixture = 'search-empty.json' } = {}) {
  const fixtureDir = path.resolve(
    new URL('../fixtures/api/', import.meta.url).pathname,
  );
  const root = JSON.parse(fs.readFileSync(path.join(fixtureDir, 'root.json'), 'utf8'));
  const collections = JSON.parse(fs.readFileSync(path.join(fixtureDir, 'collections.json'), 'utf8'));
  const searchResult = JSON.parse(fs.readFileSync(path.join(fixtureDir, searchFixture), 'utf8'));

  // If a custom baseUrl is provided, rewrite all URLs in the fixtures
  if (baseUrl !== DEFAULT_API_URL) {
    const rewrite = (obj) => JSON.parse(
      JSON.stringify(obj).replaceAll(DEFAULT_API_URL, baseUrl),
    );
    return [
      { url: baseUrl, body: rewrite(root) },
      { url: `${baseUrl}/collections`, body: rewrite(collections) },
      { url: `${baseUrl}/search`, method: 'POST', body: searchResult },
    ];
  }

  return [
    { url: baseUrl, body: root },
    { url: `${baseUrl}/collections`, body: collections },
    { url: `${baseUrl}/search`, method: 'POST', body: searchResult },
  ];
}

/**
 * Convenience: register API root + collections + search handlers.
 * This is what `searchpage.spec.js` calls in beforeEach.
 */
export async function mockApiRootAndCollections(page, { baseUrl = DEFAULT_API_URL, searchFixture = 'search-empty.json' } = {}) {
  const handlers = apiRootHandlers({ baseUrl, searchFixture });
  await registerHandlers(page, handlers);
}

/**
 * Load an API fixture file from tests/fixtures/api/.
 *
 * @param {string} filename – JSON file name inside fixtures/api/
 * @returns {object} parsed JSON
 */
export function loadApiFixture(filename) {
  const fixtureDir = path.resolve(
    new URL('../fixtures/api/', import.meta.url).pathname,
  );
  return JSON.parse(fs.readFileSync(path.join(fixtureDir, filename), 'utf8'));
}

/**
 * Register handlers for browsing an API-backed collection.
 *
 * Mocks the full API: root, /collections, /search, plus the individual
 * collection endpoint and its /items endpoint.
 *
 * @param {import('@playwright/test').Page} page
 * @param {object} [options]
 * @param {string} [options.baseUrl] – API base URL
 * @param {string} [options.collectionId] – collection ID to mock
 * @param {string} [options.collectionFixture] – fixture filename for the collection
 * @param {string} [options.itemsFixture] – fixture filename for the items response
 * @param {string} [options.itemsPage2Fixture] – optional fixture for page 2
 */
export async function mockApiCollection(page, {
  baseUrl = DEFAULT_API_URL,
  collectionId = 'test-collection-1',
  collectionFixture = 'collection-1.json',
  itemsFixture = 'collection-1-items.json',
  itemsPage2Fixture = null,
} = {}) {
  // Register root + collections + search
  await mockApiRootAndCollections(page, { baseUrl });

  const collection = loadApiFixture(collectionFixture);
  const items = loadApiFixture(itemsFixture);

  const handlers = [
    { url: `${baseUrl}/collections/${collectionId}`, body: collection },
    { url: `${baseUrl}/collections/${collectionId}/items`, body: items },
  ];

  // If a page 2 fixture is provided, register it at the cursor URL
  if (itemsPage2Fixture) {
    const page2 = loadApiFixture(itemsPage2Fixture);
    handlers.push({
      url: `${baseUrl}/collections/${collectionId}/items?cursor=page2`,
      body: page2,
    });
  }

  await registerHandlers(page, handlers);
}

// ─── Navigation helpers ─────────────────────────────────────────────────────

/**
 * Navigate to a catalog and wait for it to load.
 */
export async function loadMockCatalog(page, catalogData, catalogUrl = 'https://example.com/catalog.json') {
  // Ensure the catalog URL is mocked
  await mockStacResource(page, catalogUrl, catalogData);

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
  // The map is rendered by OpenLayers inside a <div class="map"> within <div class="map-container">
  const mapContainer = page.locator('.map-container .map');
  await mapContainer.waitFor({ state: 'visible', timeout: 10000 });
  // Wait for OpenLayers to create its viewport element
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
 * Uses `page.waitForRequest` which automatically cleans up after resolving,
 * avoiding leaked listeners.
 */
export async function waitForSearchPost(page) {
  const request = await page.waitForRequest(
    req => req.method() === 'POST' && req.url().includes('/search'),
  );
  return { body: JSON.parse(request.postData() || '{}'), url: request.url() };
}
