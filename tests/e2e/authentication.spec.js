/**
 * Authentication tests.
 *
 * Baseline coverage for the global `authConfig` behavior: a request that fails
 * with 401 asks the user to log in and is retried with the credentials applied
 * as header or query parameter. Also covers the STAC Authentication extension
 * UI (unsupported schemes) and login cancellation.
 */
import { http, HttpResponse } from 'msw';
import { test, expect } from './fixtures.js';
import {
  configureBrowser,
  hasBasicAuth,
  hasHeader,
  hasQuery,
  mockImage,
  recordRequestHeaders,
  requireAuth,
  submitApiKey,
  submitBasicAuth,
  waitForBrowserReady,
} from './helpers.js';
import StaticCatalog from '../fixtures/instances/static.js';

const ROOT_URL = 'https://stac.example/catalog.json';

function createStaticCatalog() {
  return new StaticCatalog({ url: ROOT_URL });
}

// The login modal appears during the initial page load (before the app is
// "ready"), so it must absorb the full cold-load latency and needs a longer
// wait than the global assertion default under parallel load.
async function expectLoginModal(page) {
  await expect(page.locator('#stac-browser-auth-modal')).toBeVisible({ timeout: 15000 });
}

test.describe('Global authConfig (legacy single scheme)', () => {
  test('apiKey in header: 401 shows login, retry succeeds with header', async ({ page, worker }) => {
    await configureBrowser(page, {
      authConfig: { type: 'apiKey', in: 'header', name: 'X-API-Key' },
    });
    const catalog = createStaticCatalog();
    await catalog.createServer(worker);
    await requireAuth(worker, ROOT_URL, hasHeader('x-api-key', 'secret'));

    await page.goto(catalog.root.getBrowserPath());

    // The 401 must trigger the login form
    await expectLoginModal(page);

    // The retried request must carry the API key header
    const retried = page.waitForRequest(req => req.url().startsWith(ROOT_URL) && Boolean(req.headers()['x-api-key']));
    await submitApiKey(page, 'secret');
    expect((await retried).headers()['x-api-key']).toBe('secret');

    await waitForBrowserReady(page);
    await expect(page.getByRole('heading', { name: /Example Catalog/ })).toBeVisible();
    // Logged in: the header button offers logout
    await expect(page.getByRole('button', { name: /log out/i })).toBeVisible();
  });

  test('apiKey in query: retry succeeds with query parameter', async ({ page, worker }) => {
    await configureBrowser(page, {
      authConfig: { type: 'apiKey', in: 'query', name: 'API_KEY' },
    });
    const catalog = createStaticCatalog();
    await catalog.createServer(worker);
    await requireAuth(worker, ROOT_URL, hasQuery('API_KEY', 'secret'));

    await page.goto(catalog.root.getBrowserPath());
    await expectLoginModal(page);

    const retried = page.waitForRequest(req => req.url().startsWith(ROOT_URL) && req.url().includes('API_KEY='));
    await submitApiKey(page, 'secret');
    expect((await retried).url()).toContain('API_KEY=secret');

    await waitForBrowserReady(page);
    await expect(page.getByRole('heading', { name: /Example Catalog/ })).toBeVisible();
  });

  test('http basic: retry succeeds with Authorization header', async ({ page, worker }) => {
    await configureBrowser(page, {
      authConfig: { type: 'http', scheme: 'basic' },
    });
    const catalog = createStaticCatalog();
    await catalog.createServer(worker);
    await requireAuth(worker, ROOT_URL, hasBasicAuth('jane', 'doe'));

    await page.goto(catalog.root.getBrowserPath());
    await expectLoginModal(page);

    const retried = page.waitForRequest(req => req.url().startsWith(ROOT_URL) && Boolean(req.headers().authorization));
    await submitBasicAuth(page, 'jane', 'doe');
    expect((await retried).headers().authorization).toBe(`Basic ${btoa('jane:doe')}`);

    await waitForBrowserReady(page);
    await expect(page.getByRole('heading', { name: /Example Catalog/ })).toBeVisible();
  });

  test('credentials are not sent to external domains', async ({ page, worker }) => {
    await configureBrowser(page, {
      catalogUrl: ROOT_URL,
      authConfig: { type: 'apiKey', in: 'header', name: 'X-API-Key' },
    });
    const catalog = createStaticCatalog();
    const external = catalog.addCatalog({ url: 'https://other.example/catalog.json' });
    external.setMetadata({ title: 'External Catalog' });
    await catalog.createServer(worker);
    await requireAuth(worker, ROOT_URL, hasHeader('x-api-key', 'secret'));
    // The catalog card on the root page prefetches the external child in the
    // background, so its first request can fire at any time after login.
    // Record all requests on the handler side instead of racing a waiter.
    const externalRequests = await recordRequestHeaders(worker, 'https://other.example/catalog.json');

    await page.goto('/');
    await expectLoginModal(page);
    await submitApiKey(page, 'secret');
    await waitForBrowserReady(page);

    // Navigate to the external child
    await page.getByRole('link', { name: /External Catalog/ }).click();
    await waitForBrowserReady(page);
    await expect(page.getByRole('heading', { name: /External Catalog/ })).toBeVisible();

    // No request to the external domain may carry the credentials
    expect(externalRequests.length).toBeGreaterThan(0);
    for (const headers of externalRequests) {
      expect(headers['x-api-key']).toBeUndefined();
    }
  });

  test('logout clears the credentials', async ({ page, worker }) => {
    await configureBrowser(page, {
      authConfig: { type: 'apiKey', in: 'header', name: 'X-API-Key' },
    });
    const catalog = createStaticCatalog();
    await catalog.createServer(worker);
    await requireAuth(worker, ROOT_URL, hasHeader('x-api-key', 'secret'));

    await page.goto(catalog.root.getBrowserPath());
    await expectLoginModal(page);
    await submitApiKey(page, 'secret');
    await waitForBrowserReady(page);

    await page.getByRole('button', { name: /log out/i }).click();
    await expect(page.getByText(/logged out successfully/i)).toBeVisible();

    // Without the credentials the catalog asks for a login again
    await page.goto(catalog.root.getBrowserPath());
    await expectLoginModal(page);
  });

  test('cancelling the login dismisses the form', async ({ page, worker }) => {
    await configureBrowser(page, {
      authConfig: { type: 'apiKey', in: 'header', name: 'X-API-Key' },
    });
    const catalog = createStaticCatalog();
    await catalog.createServer(worker);
    await requireAuth(worker, ROOT_URL, hasHeader('x-api-key', 'secret'));

    await page.goto(catalog.root.getBrowserPath());
    await expectLoginModal(page);

    await page.getByRole('button', { name: /cancel/i }).click();
    await expect(page.locator('#stac-browser-auth-modal')).not.toBeVisible();
    // The catalog was not loaded
    await expect(page.getByRole('heading', { name: /Example Catalog/ })).not.toBeVisible();
  });
});

test.describe('Authenticated media', () => {
  const ITEM_URL = 'https://stac.example/item.json';
  const THUMB_URL = 'https://stac.example/thumb.png';

  function createCatalogWithItem() {
    const catalog = createStaticCatalog();
    const item = catalog.addItem({ url: ITEM_URL });
    item.data.assets.thumbnail.href = THUMB_URL;
    return { catalog, item };
  }

  async function loginOnItemPage(page, worker, catalog, item) {
    await requireAuth(worker, ROOT_URL, hasHeader('x-api-key', 'secret'));
    await page.goto(item.getBrowserPath());
    await expectLoginModal(page);
    await submitApiKey(page, 'secret');
    await waitForBrowserReady(page);
  }

  async function openThumbnailsTab(page) {
    const tab = page.getByRole('tab', { name: /thumbnails/i });
    await expect(tab).toBeVisible();
    await tab.click();
    return page.locator('.previews img.thumbnail').first();
  }

  test('thumbnails load with the auth header via object URLs', async ({ page, worker }) => {
    await configureBrowser(page, {
      authConfig: { type: 'apiKey', in: 'header', name: 'X-API-Key' },
    });
    const { catalog, item } = createCatalogWithItem();
    await catalog.createServer(worker);
    await mockImage(worker, THUMB_URL, hasHeader('x-api-key', 'secret'));
    await loginOnItemPage(page, worker, catalog, item);

    const img = await openThumbnailsTab(page);
    // The image can only decode if the fetch carried the header
    await expect.poll(() => img.evaluate(el => el.naturalWidth)).toBeGreaterThan(0);
    await expect(img).toHaveAttribute('src', /^blob:/);
  });

  test('thumbnails carry the private query parameter without object URLs', async ({ page, worker }) => {
    await configureBrowser(page, {
      authConfig: { type: 'apiKey', in: 'query', name: 'API_KEY' },
    });
    const { catalog, item } = createCatalogWithItem();
    await catalog.createServer(worker);
    await mockImage(worker, THUMB_URL, hasQuery('API_KEY', 'secret'));
    await requireAuth(worker, ROOT_URL, hasQuery('API_KEY', 'secret'));

    await page.goto(item.getBrowserPath());
    await expectLoginModal(page);
    await submitApiKey(page, 'secret');
    await waitForBrowserReady(page);

    const img = await openThumbnailsTab(page);
    await expect.poll(() => img.evaluate(el => el.naturalWidth)).toBeGreaterThan(0);
    await expect(img).toHaveAttribute('src', /API_KEY=secret/);
  });

  test('thumbnails on external domains are loaded without credentials', async ({ page, worker }) => {
    await configureBrowser(page, {
      catalogUrl: ROOT_URL,
      authConfig: { type: 'apiKey', in: 'header', name: 'X-API-Key' },
    });
    const externalThumb = 'https://other.example/thumb.png';
    const catalog = createStaticCatalog();
    const item = catalog.addItem({ url: ITEM_URL });
    item.data.assets.thumbnail.href = externalThumb;
    await catalog.createServer(worker);
    const requests = await mockImage(worker, externalThumb);
    await loginOnItemPage(page, worker, catalog, item);

    const img = await openThumbnailsTab(page);
    await expect.poll(() => img.evaluate(el => el.naturalWidth)).toBeGreaterThan(0);
    // Loaded natively (no object URL) and without the credentials
    await expect(img).not.toHaveAttribute('src', /^blob:/);
    expect(requests.length).toBeGreaterThan(0);
    expect(requests[0].headers['x-api-key']).toBeUndefined();
  });

  test('a 401 for a thumbnail does not open the login dialog', async ({ page, worker }) => {
    await configureBrowser(page, {
      authConfig: { type: 'apiKey', in: 'header', name: 'X-API-Key' },
    });
    const { catalog, item } = createCatalogWithItem();
    await catalog.createServer(worker);
    // The thumbnail always fails, even with credentials
    const requests = await mockImage(worker, THUMB_URL, () => false);
    await loginOnItemPage(page, worker, catalog, item);

    await openThumbnailsTab(page);
    await expect.poll(() => requests.length).toBeGreaterThan(0);
    await expect(page.locator('#stac-browser-auth-modal')).not.toBeVisible();
  });

  test('thumbnails load natively when no authentication is configured', async ({ page, worker }) => {
    const { catalog, item } = createCatalogWithItem();
    await catalog.createServer(worker);
    await mockImage(worker, THUMB_URL);

    await page.goto(item.getBrowserPath());
    await waitForBrowserReady(page);

    const img = await openThumbnailsTab(page);
    await expect.poll(() => img.evaluate(el => el.naturalWidth)).toBeGreaterThan(0);
    await expect(img).toHaveAttribute('src', THUMB_URL);
  });

  test('card thumbnails on the catalog page load with the auth header', async ({ page, worker }) => {
    await configureBrowser(page, {
      catalogUrl: ROOT_URL,
      authConfig: { type: 'apiKey', in: 'header', name: 'X-API-Key' },
    });
    const { catalog } = createCatalogWithItem();
    await catalog.createServer(worker);
    await mockImage(worker, THUMB_URL, hasHeader('x-api-key', 'secret'));
    await requireAuth(worker, ROOT_URL, hasHeader('x-api-key', 'secret'));

    await page.goto('/');
    await expectLoginModal(page);
    await submitApiKey(page, 'secret');
    await waitForBrowserReady(page);

    const img = page.locator('.card img.thumbnail').first();
    await img.scrollIntoViewIfNeeded();
    await expect.poll(() => img.evaluate(el => el.naturalWidth)).toBeGreaterThan(0);
    await expect(img).toHaveAttribute('src', /^blob:/);
  });
});

test.describe('Authenticated map layers', () => {
  const ITEM_URL = 'https://stac.example/item.json';
  const DATA_URL = 'https://stac.example/data.tif';
  const PMTILES_URL = 'https://stac.example/tiles.pmtiles';
  const ZARR_URL = 'https://stac.example/store.zarr';

  // Record the requests the map makes for a URL (the data is not valid,
  // rendering is expected to fail after the request was made)
  async function recordRequests(worker, url) {
    const requests = [];
    await worker.use(
      http.get(url, ({ request }) => {
        requests.push({
          url: request.url,
          apiKey: request.headers.get('x-api-key'),
        });
        return new HttpResponse(null, { status: 404 });
      }),
    );
    return requests;
  }

  async function loginOnItemPage(page, worker, item, check) {
    await requireAuth(worker, ROOT_URL, check);
    await page.goto(item.getBrowserPath());
    await expectLoginModal(page);
    await submitApiKey(page, 'secret');
    await waitForBrowserReady(page);
  }

  const HEADER_AUTH = { authConfig: { type: 'apiKey', in: 'header', name: 'X-API-Key' } };
  const QUERY_AUTH = { authConfig: { type: 'apiKey', in: 'query', name: 'API_KEY' } };

  test('GeoTIFF requests on the map carry the auth header', async ({ page, worker }) => {
    await configureBrowser(page, { ...HEADER_AUTH, displayGeoTiffByDefault: true });
    const catalog = createStaticCatalog();
    const item = catalog.addItem({ url: ITEM_URL });
    await catalog.createServer(worker);
    const requests = await recordRequests(worker, DATA_URL);
    await loginOnItemPage(page, worker, item, hasHeader('x-api-key', 'secret'));

    await expect.poll(() => requests.length, { timeout: 15000 }).toBeGreaterThan(0);
    expect(requests[0].apiKey).toBe('secret');
  });

  test('GeoTIFF requests on the map carry the private query parameter', async ({ page, worker }) => {
    await configureBrowser(page, { ...QUERY_AUTH, displayGeoTiffByDefault: true });
    const catalog = createStaticCatalog();
    const item = catalog.addItem({ url: ITEM_URL });
    await catalog.createServer(worker);
    const requests = await recordRequests(worker, DATA_URL);
    await loginOnItemPage(page, worker, item, hasQuery('API_KEY', 'secret'));

    await expect.poll(() => requests.length, { timeout: 15000 }).toBeGreaterThan(0);
    expect(requests[0].url).toContain('API_KEY=secret');
  });

  function addPmtilesLink(item) {
    item.data.links.push({
      rel: 'pmtiles',
      href: PMTILES_URL,
      type: 'application/vnd.pmtiles',
    });
  }

  test('PMTiles requests on the map carry the auth header', async ({ page, worker }) => {
    await configureBrowser(page, HEADER_AUTH);
    const catalog = createStaticCatalog();
    const item = catalog.addItem({ url: ITEM_URL });
    addPmtilesLink(item);
    await catalog.createServer(worker);
    const requests = await recordRequests(worker, PMTILES_URL);
    await loginOnItemPage(page, worker, item, hasHeader('x-api-key', 'secret'));

    await expect.poll(() => requests.length, { timeout: 15000 }).toBeGreaterThan(0);
    expect(requests[0].apiKey).toBe('secret');
  });

  test('PMTiles requests on the map carry the private query parameter', async ({ page, worker }) => {
    await configureBrowser(page, QUERY_AUTH);
    const catalog = createStaticCatalog();
    const item = catalog.addItem({ url: ITEM_URL });
    addPmtilesLink(item);
    await catalog.createServer(worker);
    const requests = await recordRequests(worker, PMTILES_URL);
    await loginOnItemPage(page, worker, item, hasQuery('API_KEY', 'secret'));

    await expect.poll(() => requests.length, { timeout: 15000 }).toBeGreaterThan(0);
    expect(requests[0].url).toContain('API_KEY=secret');
  });

  const TILEJSON_URL = 'https://stac.example/manifest.json';

  function addTileJsonLink(item) {
    item.data.links.push({
      rel: 'tilejson',
      href: TILEJSON_URL,
      type: 'application/json',
    });
  }

  test('TileJSON manifest requests on the map carry the auth header', async ({ page, worker }) => {
    await configureBrowser(page, HEADER_AUTH);
    const catalog = createStaticCatalog();
    const item = catalog.addItem({ url: ITEM_URL });
    addTileJsonLink(item);
    await catalog.createServer(worker);
    const requests = await recordRequests(worker, TILEJSON_URL);
    await loginOnItemPage(page, worker, item, hasHeader('x-api-key', 'secret'));

    await expect.poll(() => requests.length, { timeout: 15000 }).toBeGreaterThan(0);
    expect(requests[0].apiKey).toBe('secret');
  });

  test('TileJSON manifest requests on the map carry the private query parameter', async ({ page, worker }) => {
    await configureBrowser(page, QUERY_AUTH);
    const catalog = createStaticCatalog();
    const item = catalog.addItem({ url: ITEM_URL });
    addTileJsonLink(item);
    await catalog.createServer(worker);
    const requests = await recordRequests(worker, TILEJSON_URL);
    await loginOnItemPage(page, worker, item, hasQuery('API_KEY', 'secret'));

    await expect.poll(() => requests.length, { timeout: 15000 }).toBeGreaterThan(0);
    expect(requests[0].url).toContain('API_KEY=secret');
  });

  function addGeoZarrAsset(item) {
    item.data.assets.zarr = {
      href: ZARR_URL,
      type: 'application/vnd.zarr; version=3; profile=multiscales',
      title: 'Data Cube',
      roles: ['data'],
    };
  }

  test('GeoZarr requests on the map carry the auth header', async ({ page, worker }) => {
    await configureBrowser(page, HEADER_AUTH);
    const catalog = createStaticCatalog();
    const item = catalog.addItem({ url: ITEM_URL });
    addGeoZarrAsset(item);
    await catalog.createServer(worker);
    const requests = await recordRequests(worker, `${ZARR_URL}/zarr.json`);
    await loginOnItemPage(page, worker, item, hasHeader('x-api-key', 'secret'));

    await expect.poll(() => requests.length, { timeout: 15000 }).toBeGreaterThan(0);
    expect(requests[0].apiKey).toBe('secret');
  });

  test('GeoZarr requests on the map carry the private query parameter', async ({ page, worker }) => {
    await configureBrowser(page, QUERY_AUTH);
    const catalog = createStaticCatalog();
    const item = catalog.addItem({ url: ITEM_URL });
    addGeoZarrAsset(item);
    await catalog.createServer(worker);
    const requests = await recordRequests(worker, `${ZARR_URL}/zarr.json`);
    await loginOnItemPage(page, worker, item, hasQuery('API_KEY', 'secret'));

    await expect.poll(() => requests.length, { timeout: 15000 }).toBeGreaterThan(0);
    expect(requests[0].url).toContain('API_KEY=secret');
  });
});

test.describe('External viewer actions', () => {
  const ITEM_URL = 'https://stac.example/item.json';

  // A GeoJSON asset, for which the geojson.io action (enabled by default) shows
  function createCatalogWithGeoJsonAsset() {
    const catalog = createStaticCatalog();
    const item = catalog.addItem({ url: ITEM_URL });
    item.data.assets.vector = {
      href: 'https://stac.example/data.geojson',
      type: 'application/geo+json',
      title: 'Vector Data',
      roles: ['data'],
    };
    return { catalog, item };
  }

  test('are hidden when header credentials are required', async ({ page, worker }) => {
    await configureBrowser(page, {
      authConfig: { type: 'apiKey', in: 'header', name: 'X-API-Key' },
    });
    const { catalog, item } = createCatalogWithGeoJsonAsset();
    await catalog.createServer(worker);
    await requireAuth(worker, ROOT_URL, hasHeader('x-api-key', 'secret'));

    await page.goto(item.getBrowserPath());
    await expectLoginModal(page);
    await submitApiKey(page, 'secret');
    await waitForBrowserReady(page);

    await page.getByRole('button', { name: /vector data/i }).click();
    await expect(page.getByRole('button', { name: /download/i }).first()).toBeVisible();
    await expect(page.getByRole('button', { name: /geojson\.io/i })).not.toBeVisible();
  });

  test('are shown without authentication', async ({ page, worker }) => {
    const { catalog, item } = createCatalogWithGeoJsonAsset();
    await catalog.createServer(worker);

    await page.goto(item.getBrowserPath());
    await waitForBrowserReady(page);

    await page.getByRole('button', { name: /vector data/i }).click();
    await expect(page.getByRole('button', { name: /geojson\.io/i })).toBeVisible();
  });
});

test.describe('STAC Authentication extension', () => {
  test('unsupported scheme on an asset shows an error on login attempt', async ({ page, worker }) => {
    const catalog = createStaticCatalog();
    const item = catalog.addItem({ url: 'https://stac.example/item.json' });
    item.setMetadata({
      'auth:schemes': {
        oauth: {
          type: 'oauth2',
          flows: {
            authorizationCode: {
              authorizationUrl: 'https://auth.example/authorize',
              tokenUrl: 'https://auth.example/token',
              scopes: {},
            },
          },
        },
      },
    });
    item.data.assets.data['auth:refs'] = ['oauth'];
    await catalog.createServer(worker);

    await page.goto(item.getBrowserPath());
    await waitForBrowserReady(page);

    // Expand the accordion of the asset that requires authentication
    await page.getByRole('button', { name: /measurements/i }).click();

    const authButton = page.getByRole('button', { name: /authentication required/i }).first();
    await expect(authButton).toBeVisible();
    await authButton.click();
    await expect(page.getByText(/is not supported by STAC Browser/i)).toBeVisible();
  });
});
