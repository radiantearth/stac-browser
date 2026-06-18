import { test, expect } from './fixtures.js';
import API from '../fixtures/instances/api.js';
import { waitForBrowserReady } from './helpers.js';

test.describe('Search filter persistence — Phase 1 (Vuex + URL)', () => {
  let api;
  let SEARCH_PATH;
 
  test.beforeEach(async ({ worker }) => {
    api = API.minimalApi({}, {
      defaultLimit: 5,
      prevLinkEnabled: true,
      firstLinkEnabled: true,
      lastLinkEnabled: true,
    });
    const collection = api.addCollection('collection1').setMetadata({ title: 'Test Collection 1' });
    api.addManyItems(collection, 20);
    api.addCollectionsExtension().addItemsExtension().addSearchExtension();
    await api.createServer(worker);
    SEARCH_PATH = api.root.getSearchPath();
  });
 
  // ─── URL serialization ──────────────────────────────────────────────────────
 
  test('datetime filter is serialized into URL with .s. prefix', async ({ page }) => {
    await page.goto(SEARCH_PATH);
    await waitForBrowserReady(page);

    // Enter a datetime filter in the UI
    const temporalInput = page.getByPlaceholder(/select date range/i);
    await temporalInput.click();
    await temporalInput.fill('2025-05-01 - 2025-05-29');

    // Wait for the URL to update automatically
    await expect.poll(() => page.url(), { timeout: 5000 }).toContain('.s.datetime=');
 
    const url = new URL(page.url());
    const datetimeStr = url.searchParams.get('.s.datetime');
    // JS dates serialize with month names and years when joined as a raw array
    expect(datetimeStr).toContain('2025-05');
    expect(datetimeStr).toContain('2025');
  });
 
  test('limit filter is serialized into URL with .s. prefix', async ({ page }) => {
    await page.goto(SEARCH_PATH);
    await waitForBrowserReady(page);

    // Enter a limit filter in the UI
    const limitInput = page.getByLabel(/items per page/i);
    await limitInput.fill('25');
 
    await expect.poll(() => page.url(), { timeout: 5000 }).toContain('.s.limit=');
 
    const url = new URL(page.url());
    expect(url.searchParams.get('.s.limit')).toBe('25');
  });
 
  test('null filter values are not serialized into URL', async ({ page }) => {
    await page.goto(SEARCH_PATH);
    await waitForBrowserReady(page);
 
    const url = new URL(page.url());
    expect(url.searchParams.has('.s.datetime')).toBe(false);
    expect(url.searchParams.has('.s.bbox')).toBe(false);
    expect(url.searchParams.has('.s.limit')).toBe(false);
  });
 
  // ─── URL rehydration ────────────────────────────────────────────────────────
 
  test('datetime is rehydrated from URL into Vuex store and UI on load', async ({ page }) => {
    const datetime = '2025-05-01T00:00:00.000Z/2025-05-29T00:00:00.000Z';
    await page.goto(`${SEARCH_PATH}?.s.datetime=${encodeURIComponent(datetime)}`);
    await waitForBrowserReady(page);
    
    // The UI should automatically show the dates from the URL
    const temporalInput = page.getByPlaceholder(/select date range/i);
    await expect(temporalInput).toHaveValue(/2025-05-01/);
    await expect(temporalInput).toHaveValue(/2025-05-29/);
  });
 
  test('bbox is rehydrated from URL into Vuex store and UI on load', async ({ page }) => {
    await page.goto(`${SEARCH_PATH}?.s.bbox=-116.1%2C44.3%2C-104%2C49`);
    await waitForBrowserReady(page);

    // The checkbox should automatically be checked
    const enableSpatialCheckbox = page.getByRole('checkbox', { name: /filter by spatial extent/i });
    await expect(enableSpatialCheckbox).toBeChecked();
    
    // The coordinates should automatically populate the manual input boxes
    await expect(page.getByLabel(/west longitude/i)).toHaveValue('-116.1');
    await expect(page.getByLabel(/south latitude/i)).toHaveValue('44.3');
    await expect(page.getByLabel(/east longitude/i)).toHaveValue('-104');
    await expect(page.getByLabel(/north latitude/i)).toHaveValue('49');
  });
 
  test('limit is rehydrated from URL into Vuex store and UI on load', async ({ page }) => {
    await page.goto(`${SEARCH_PATH}?.s.limit=25`);
    await waitForBrowserReady(page);

    // The UI should automatically show 25
    const limitInput = page.getByLabel(/items per page/i);
    await expect(limitInput).toHaveValue('25');
  });
 
  test('multiple .s. params are all rehydrated together', async ({ page }) => {
    const datetime = '2025-05-01T00:00:00.000Z/2025-05-29T00:00:00.000Z';
    await page.goto(
      `${SEARCH_PATH}?.s.datetime=${encodeURIComponent(datetime)}&.s.bbox=-116.1%2C44.3%2C-104%2C49&.s.limit=10`
    );
    await waitForBrowserReady(page);

    // Check UI for Datetime
    const temporalInput = page.getByPlaceholder(/select date range/i);
    await expect(temporalInput).toHaveValue(/2025-05-01/);

    // Check UI for Bbox
    const enableSpatialCheckbox = page.getByRole('checkbox', { name: /filter by spatial extent/i });
    await expect(enableSpatialCheckbox).toBeChecked();

    // Check UI for Limit
    const limitInput = page.getByLabel(/items per page/i);
    await expect(limitInput).toHaveValue('10');
  });
 
  // ─── Round-trip ─────────────────────────────────────────────────────────────
 
  test('filters survive a page reload (full URL round-trip)', async ({ page }) => {
    // 1. Load page with parameters
    const datetime = '2025-05-01T00:00:00.000Z/2025-05-29T00:00:00.000Z';
    await page.goto(`${SEARCH_PATH}?.s.datetime=${encodeURIComponent(datetime)}&.s.limit=10`);
    await waitForBrowserReady(page);

    // 2. Reload the page
    await page.reload();
    await waitForBrowserReady(page);

    // 3. Ensure UI still has the parameters
    const temporalInput = page.getByPlaceholder(/select date range/i);
    await expect(temporalInput).toHaveValue(/2025-05-01/);

    const limitInput = page.getByLabel(/items per page/i);
    await expect(limitInput).toHaveValue('10');
  });
 
  // ─── Store isolation ────────────────────────────────────────────────────────
 
  test('search state does not bleed into non-s. URL params', async ({ page }) => {
    await page.goto(SEARCH_PATH);
    await waitForBrowserReady(page);

    // Type 15 into the limit box
    const limitInput = page.getByLabel(/items per page/i);
    await limitInput.fill('15');
 
    await expect.poll(() => page.url(), { timeout: 5000 }).toContain('.s.limit=');
 
    const url = new URL(page.url());
    expect(url.searchParams.has('limit')).toBe(false); // Make sure 'limit' without prefix isn't there
    expect(url.searchParams.has('datetime')).toBe(false);
  });
});
