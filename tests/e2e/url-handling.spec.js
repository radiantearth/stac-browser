/**
 * URL handling (resolving/correction) tests.
 *
 * Related issue(s):
 * - https://github.com/radiantearth/stac-browser/issues/486
 * - https://github.com/radiantearth/stac-browser/issues/943
 */
import { test, expect } from './fixtures.js';
import http from 'node:http';
import { mockStacResource, waitForBrowserReady } from './helpers.js';
import API from '../fixtures/instances/api.js';

// The fixture root URL (with trailing slash, as reported by the server)
const CANONICAL = 'https://stac.example/api/';
// The same URL as a user may enter it (without trailing slash)
const ENTERED = 'https://stac.example/api';

const CANONICAL_PATH = '/external/stac.example/api/';
const ENTERED_PATH = '/external/stac.example/api';

function createApi() {
  const api = API.defaultApi();
  const collection = api.addCollection('my-collection').setMetadata({ title: 'Test Collection' });
  // Advertise free-text collection search so that the free-text field shows up
  api.root.addConformsTo('https://api.stacspec.org/v1.0.0/collection-search');
  api.root.addConformsTo('https://api.stacspec.org/v1.0.0/collection-search#free-text');
  return { api, collection };
}

function trackRootRequests(page) {
  const urls = [];
  page.on('request', request => {
    const url = request.url();
    if (url === ENTERED || url === CANONICAL) {
      urls.push(url);
    }
  });
  return urls;
}

test('corrects a URL entered without the trailing slash', async ({ page, worker }) => {
  const { api } = createApi();
  await api.createServer(worker);
  // The MSW handlers are registered for the canonical URL only,
  // so the URL without the trailing slash needs an explicit handler.
  await mockStacResource(worker, ENTERED, api.root.build());
  const rootRequests = trackRootRequests(page);

  await page.goto(ENTERED_PATH);
  await waitForBrowserReady(page);

  // The address bar gets corrected to the canonical URL
  await expect(page).toHaveURL(new RegExp(`${CANONICAL_PATH}$`));
  await expect(page.getByRole('heading', { name: /Example API/i })).toBeVisible();
  // One discovery fetch for the entered URL plus one fetch for the corrected URL
  expect(rootRequests).toEqual([ENTERED, CANONICAL]);
});

test('keeps the free-text search field when navigating back to the root (#943)', async ({ page, worker }) => {
  const { api, collection } = createApi();
  await api.createServer(worker);
  await mockStacResource(worker, ENTERED, api.root.build());
  const rootRequests = trackRootRequests(page);

  await page.goto(ENTERED_PATH);
  await waitForBrowserReady(page);
  // The inner input of the multiselect is hidden until focused,
  // so check for presence in the DOM (gated by a v-if on the conformance classes)
  const freeText = page.locator('#catalogFreeText');
  await expect(freeText).toBeAttached();

  await page.getByRole('link', { name: new RegExp(collection.getMetadata().title) }).click();
  await waitForBrowserReady(page);
  await page.goBack();
  await waitForBrowserReady(page);

  // Back-navigation lands on the corrected URL, the root is served from the
  // cache, and the conformance classes (and thus the free-text field) survive
  await expect(page).toHaveURL(CANONICAL_PATH);
  await expect(freeText).toBeAttached();
  expect(rootRequests).toEqual([ENTERED, CANONICAL]);
});

test('does not correct the URL if there is no self link', async ({ page, worker }) => {
  const { api } = createApi();
  api.root.removeSelfLink();
  await api.createServer(worker);
  await mockStacResource(worker, ENTERED, api.root.build());

  await page.goto(ENTERED_PATH);
  await waitForBrowserReady(page);

  // Without a self link there is no evidence for a correction
  await expect(page).toHaveURL(ENTERED_PATH);
  await expect(page.locator('#catalogFreeText')).toBeAttached();
});

test('corrects the URL on the search page', async ({ page, worker }) => {
  const { api } = createApi();
  await api.createServer(worker);
  await mockStacResource(worker, ENTERED, api.root.build());

  await page.goto(`/search${ENTERED_PATH}`);

  // The search page may append state query parameters (e.g. the search type)
  await expect(page).toHaveURL(url => url.pathname === `/search${CANONICAL_PATH}`);
  await expect(page.locator('main')).toBeVisible();
});

test('corrects the URL on the validation page', async ({ page, worker }) => {
  const { api } = createApi();
  await api.createServer(worker);
  await mockStacResource(worker, ENTERED, api.root.build());

  await page.goto(`/validation${ENTERED_PATH}`);

  await expect(page).toHaveURL(`/validation${CANONICAL_PATH}`);
  await expect(page.locator('main')).toBeVisible();
});

test('does not redirect when the entered URL matches the reported URL', async ({ page, worker }) => {
  const { api } = createApi();
  await api.createServer(worker);
  const rootRequests = trackRootRequests(page);

  await page.goto(CANONICAL_PATH);
  await waitForBrowserReady(page);

  await expect(page).toHaveURL(CANONICAL_PATH);
  await expect(page.getByRole('heading', { name: /Example API/i })).toBeVisible();
  expect(rootRequests).toEqual([CANONICAL]);
});

test('corrects a URL entered with a trailing slash if the server reports none', async ({ page, worker }) => {
  const { api } = createApi();
  // The server reports its URL without a trailing slash
  api.root.updateSelfLink({ href: ENTERED });
  await api.createServer(worker);
  await mockStacResource(worker, ENTERED, api.root.build());

  await page.goto(CANONICAL_PATH);
  await waitForBrowserReady(page);

  await expect(page).toHaveURL(ENTERED_PATH);
  await expect(page.getByRole('heading', { name: /Example API/i })).toBeVisible();
});

test.describe('Resolving relative URLs (#486)', () => {
  const STAC_VERSION = '1.1.0';
  const API_ROOT = 'https://stac.example/api/';
  const API_CONFORMANCE = [
    'https://api.stacspec.org/v1.0.0/core',
    'https://api.stacspec.org/v1.0.0/collections',
    'https://api.stacspec.org/v1.0.0/ogcapi-features'
  ];

  function catalog(id, title, links) {
    return { type: 'Catalog', stac_version: STAC_VERSION, id, title, description: `The ${title}`, links };
  }

  function collection(id, title, links) {
    return {
      type: 'Collection',
      stac_version: STAC_VERSION,
      id,
      title,
      description: `The ${title}`,
      license: 'CC0-1.0',
      extent: {
        spatial: { bbox: [[-180, -90, 180, 90]] },
        temporal: { interval: [['2020-01-01T00:00:00Z', null]] }
      },
      links
    };
  }

  function item(id, title, links = []) {
    return {
      type: 'Feature',
      stac_version: STAC_VERSION,
      id,
      geometry: null,
      properties: { title, datetime: '2020-01-01T00:00:00Z' },
      links,
      assets: {}
    };
  }

  // A STAC API root whose collections endpoint is at the given URL
  function apiRoot(collectionsUrl) {
    return Object.assign(catalog('api', 'Example API', [
      { rel: 'self', href: API_ROOT, type: 'application/json' },
      { rel: 'root', href: API_ROOT, type: 'application/json' },
      { rel: 'data', href: collectionsUrl, type: 'application/json' }
    ]), { conformsTo: API_CONFORMANCE });
  }

  // Serves an API with one collection (at collectionUrl) and its items (at itemsUrl)
  async function mockApiWithItems(worker, { collectionUrl, itemsUrl, features }) {
    const collectionsUrl = `${API_ROOT}collections`;
    const coll = collection('c1', 'Collection One', [
      { rel: 'self', href: collectionUrl, type: 'application/json' },
      { rel: 'root', href: API_ROOT, type: 'application/json' },
      { rel: 'items', href: itemsUrl, type: 'application/geo+json' }
    ]);
    await mockStacResource(worker, API_ROOT, apiRoot(collectionsUrl));
    await mockStacResource(worker, collectionsUrl, { collections: [coll], links: [] });
    await mockStacResource(worker, collectionUrl, coll);
    await mockStacResource(worker, itemsUrl, { type: 'FeatureCollection', features, links: [] });
  }

  function toBrowserPath(url) {
    return url.replace(/^https:\/\//, '/external/');
  }

  test('resolves relative links against the URL after a redirect', async ({ page }) => {
    // Playwright (and thus MSW) only intercepts the first request of a redirect chain,
    // so this test uses a real HTTP server.
    // The catalog moved from /old/ to /new/ and has no self link,
    // so the relative child link can only be resolved against the redirect target.
    const files = {
      '/new/catalog.json': catalog('root', 'Moved Catalog', [
        { rel: 'child', href: './child/catalog.json', type: 'application/json', title: 'Child Catalog' }
      ]),
      '/new/child/catalog.json': catalog('child', 'Child Catalog', [])
    };
    const server = http.createServer((req, res) => {
      // Browsers also apply CORS to the redirect responses of cross-origin requests
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Headers', '*');
      if (req.url === '/old/catalog.json') {
        res.writeHead(308, { Location: '/new/catalog.json' });
        res.end();
      }
      else if (files[req.url]) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(files[req.url]));
      }
      else {
        res.writeHead(req.method === 'OPTIONS' ? 204 : 404);
        res.end();
      }
    });
    await new Promise(resolve => {
      server.listen(0, '127.0.0.1', resolve);
    });
    const host = `127.0.0.1:${server.address().port}`;

    try {
      await page.goto(`/external/http:/${host}/old/catalog.json`);
      await waitForBrowserReady(page);

      const childLink = page.getByRole('link', { name: /Child Catalog/i }).first();
      await expect(childLink).toHaveAttribute('href', `/external/http:/${host}/new/child/catalog.json`);
      await childLink.click();
      await waitForBrowserReady(page);
      await expect(page.getByRole('heading', { name: /Child Catalog/i })).toBeVisible();
    }
    finally {
      server.close();
    }
  });

  test('resolves relative self links of Items against the URL of the items response', async ({ page, worker }) => {
    const collectionUrl = `${API_ROOT}collections/c1`;
    const itemsUrl = `${collectionUrl}/items`;
    // Relative to the items response, "items/item-1" resolves to .../collections/c1/items/item-1.
    // Relative to the collection, it would wrongly resolve to .../collections/items/item-1.
    await mockApiWithItems(worker, {
      collectionUrl,
      itemsUrl,
      features: [item('item-1', 'Item One', [{ rel: 'self', href: 'items/item-1', type: 'application/geo+json' }])]
    });

    await page.goto(toBrowserPath(collectionUrl));
    await waitForBrowserReady(page);

    await expect(page.getByRole('link', { name: /Item One/i }).first())
      .toHaveAttribute('href', toBrowserPath(`${itemsUrl}/item-1`));
  });

  for (const collectionUrl of [`${API_ROOT}collections/c1`, `${API_ROOT}collections/c1/`]) {
    test(`constructs Item URLs without self link for the collection URL ${collectionUrl}`, async ({ page, worker }) => {
      await mockApiWithItems(worker, {
        collectionUrl,
        itemsUrl: `${API_ROOT}collections/c1/items`,
        features: [item('item-1', 'Item One'), item('item#2', 'Item Two')]
      });

      await page.goto(toBrowserPath(collectionUrl));
      await waitForBrowserReady(page);

      // The same URL with and without trailing slash, and the ID is percent-encoded
      await expect(page.getByRole('link', { name: /Item One/i }).first())
        .toHaveAttribute('href', toBrowserPath(`${API_ROOT}collections/c1/items/item-1`));
      await expect(page.getByRole('link', { name: /Item Two/i }).first())
        .toHaveAttribute('href', toBrowserPath(`${API_ROOT}collections/c1/items/item%232`));
    });
  }

  test('resolves relative self links of Collections against the URL of the collections response', async ({ page, worker }) => {
    // The collections endpoint is not directly below the root, so resolving
    // "collections/c1" against the root URL would give a wrong URL.
    const collectionsUrl = `${API_ROOT}v1/collections`;
    const coll = collection('c1', 'Collection One', [
      { rel: 'self', href: 'collections/c1', type: 'application/json' }
    ]);
    await mockStacResource(worker, API_ROOT, apiRoot(collectionsUrl));
    await mockStacResource(worker, collectionsUrl, { collections: [coll], links: [] });

    await page.goto(toBrowserPath(API_ROOT));
    await waitForBrowserReady(page);

    await expect(page.getByRole('link', { name: /Collection One/i }).first())
      .toHaveAttribute('href', toBrowserPath(`${API_ROOT}v1/collections/c1`));
  });

  test('constructs Collection URLs without self link for a root URL without trailing slash', async ({ page, worker }) => {
    const root = 'https://stac.example/api';
    const collectionsUrl = `${root}/collections`;
    await mockStacResource(worker, root, Object.assign(catalog('api', 'Example API', [
      { rel: 'self', href: root, type: 'application/json' },
      { rel: 'root', href: root, type: 'application/json' },
      { rel: 'data', href: collectionsUrl, type: 'application/json' }
    ]), { conformsTo: API_CONFORMANCE }));
    await mockStacResource(worker, collectionsUrl, { collections: [collection('c1', 'Collection One', [])], links: [] });

    await page.goto(toBrowserPath(root));
    await waitForBrowserReady(page);

    await expect(page.getByRole('link', { name: /Collection One/i }).first())
      .toHaveAttribute('href', toBrowserPath(`${collectionsUrl}/c1`));
  });
});
