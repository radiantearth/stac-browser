/**
 * URL handling (resolving/correction) tests.
 *
 * Related issue(s):
 * - https://github.com/radiantearth/stac-browser/issues/943
 */
import { test, expect } from './fixtures.js';
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
