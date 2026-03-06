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
import { test, expect } from './fixtures';
import {
  mockApiRootAndCollections,
  mockApiCollection,
  waitForBrowserReady,
} from './helpers';

const API_ROOT_PATH = '/external/example.com/api';
const COLLECTION_PATH = '/external/example.com/api/collections/test-collection-1';

test.describe('API-backed catalog browsing', () => {

  test('API root loads and displays collections from /collections endpoint', async ({ page, worker }) => {
    await mockApiRootAndCollections(worker);
    await page.goto(API_ROOT_PATH);
    await waitForBrowserReady(page);

    await expect(page.getByRole('heading', { name: /Test STAC API/i })).toBeVisible();

    // Collections should be loaded from the API /collections endpoint
    await expect(page.getByRole('link', { name: /Test Collection 1/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /Test Collection 2/i })).toBeVisible();
  });

  test('clicking a collection navigates to its page', async ({ page, worker }) => {
    await mockApiCollection(worker);
    await page.goto(API_ROOT_PATH);
    await waitForBrowserReady(page);

    await page.getByRole('link', { name: 'Test Collection 1' }).click();
    await waitForBrowserReady(page);

    await expect(page.getByRole('heading', { name: 'Test Collection 1' })).toBeVisible();
  });

  test('collection page loads items from /items endpoint', async ({ page, worker }) => {
    await mockApiCollection(worker);
    await page.goto(COLLECTION_PATH);
    await waitForBrowserReady(page);

    // Items should be loaded from the API items endpoint
    await expect(page.locator('.item-card')).toHaveCount(2, { timeout: 10000 });
    await expect(page.locator('.item-card').nth(0).locator('.stac-link .title')).toHaveText('API Item Alpha');
    await expect(page.locator('.item-card').nth(1).locator('.stac-link .title')).toHaveText('API Item Beta');
  });

  test('collection page shows item count from API response', async ({ page, worker }) => {
    await mockApiCollection(worker);
    await page.goto(COLLECTION_PATH);
    await waitForBrowserReady(page);

    await expect(page.locator('.item-card')).toHaveCount(2, { timeout: 10000 });

    // The items header badge should show numberMatched from the API
    const itemsHeader = page.locator('.items header');
    await expect(itemsHeader.locator('.badge')).toContainText('3');
  });

  test('pagination controls appear when items response has next link', async ({ page, worker }) => {
    await mockApiCollection(worker, { itemsPage2Fixture: 'collection-1-items-page2.json' });
    await page.goto(COLLECTION_PATH);
    await waitForBrowserReady(page);

    await expect(page.locator('.item-card')).toHaveCount(2, { timeout: 10000 });

    // Pagination should be visible since the items response has a "next" link
    const pagination = page.locator('.items .btn-group').first();
    await expect(pagination).toBeVisible();
  });

  test('clicking next page loads additional items', async ({ page, worker }) => {
    await mockApiCollection(worker, { itemsPage2Fixture: 'collection-1-items-page2.json' });
    await page.goto(COLLECTION_PATH);
    await waitForBrowserReady(page);

    await expect(page.locator('.item-card')).toHaveCount(2, { timeout: 10000 });

    // Click the next page button
    const nextBtn = page.locator('.items .btn-group').first().getByRole('button', { name: /next/i });
    await expect(nextBtn).toBeVisible();
    await nextBtn.click();

    // After loading page 2, the third item should appear
    await expect(page.locator('.item-card').first().locator('.stac-link .title')).toHaveText('API Item Gamma', { timeout: 10000 });
  });

  test('back button returns to API root from collection', async ({ page, worker }) => {
    await mockApiCollection(worker);
    await page.goto(COLLECTION_PATH);
    await waitForBrowserReady(page);

    await expect(page.getByRole('heading', { name: /Test Collection 1/i })).toBeVisible();

    // Navigate back to parent
    const backBtn = page.getByRole('button', { name: /up/i }).first();
    await expect(backBtn).toBeVisible();
    await backBtn.click();
    await waitForBrowserReady(page);

    await expect(page.getByRole('heading', { name: /Test STAC API/i })).toBeVisible();
  });
});

// ─── Configured catalogUrl mode ───────────────────────────────────────────────
// When catalogUrl is set, the app loads at "/" and uses relative paths
// (e.g. /collections/...) instead of /external/... paths.
// We inject the config via window.STAC_BROWSER_CONFIG before the app boots.

const CATALOG_URL = 'https://example.com/api';

test.describe('API-backed catalog with configured catalogUrl', () => {

  test.beforeEach(async ({ page }) => {
    // Inject catalogUrl config before the app initialises
    await page.addInitScript((url) => {
      window.STAC_BROWSER_CONFIG = { catalogUrl: url };
    }, CATALOG_URL);
  });

  test('root loads at "/" and displays collections', async ({ page, worker }) => {
    await mockApiRootAndCollections(worker);
    await page.goto('/');
    await waitForBrowserReady(page);

    await expect(page.getByRole('heading', { name: /Test STAC API/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /Test Collection 1/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /Test Collection 2/i })).toBeVisible();
  });

  test('collection page loads at relative path', async ({ page, worker }) => {
    await mockApiCollection(worker);
    await page.goto('/api/collections/test-collection-1');
    await waitForBrowserReady(page);

    await expect(page.getByRole('heading', { name: /Test Collection 1/i })).toBeVisible();
    await expect(page.locator('.item-card')).toHaveCount(2, { timeout: 10000 });
  });

  test('clicking a collection navigates using relative path', async ({ page, worker }) => {
    await mockApiCollection(worker);
    await page.goto('/');
    await waitForBrowserReady(page);

    await page.getByRole('link', { name: 'Test Collection 1' }).click();
    await waitForBrowserReady(page);

    await expect(page.getByRole('heading', { name: 'Test Collection 1' })).toBeVisible();
    // URL should use relative path, not /external/...
    await expect(page).toHaveURL(/\/collections\/test-collection-1/);
    await expect(page).not.toHaveURL(/\/external\//);
  });

  test('pagination works with configured catalogUrl', async ({ page, worker }) => {
    await mockApiCollection(worker, { itemsPage2Fixture: 'collection-1-items-page2.json' });
    await page.goto('/api/collections/test-collection-1');
    await waitForBrowserReady(page);

    await expect(page.locator('.item-card')).toHaveCount(2, { timeout: 10000 });

    const nextBtn = page.locator('.items .btn-group').first().getByRole('button', { name: /next/i });
    await expect(nextBtn).toBeVisible();
    await nextBtn.click();

    await expect(page.locator('.item-card').first().locator('.stac-link .title')).toHaveText('API Item Gamma', { timeout: 10000 });
  });

  test('back button returns to root from collection', async ({ page, worker }) => {
    await mockApiCollection(worker);
    await page.goto('/api/collections/test-collection-1');
    await waitForBrowserReady(page);

    const backBtn = page.getByRole('button', { name: /up/i }).first();
    await expect(backBtn).toBeVisible();
    await backBtn.click();
    await waitForBrowserReady(page);

    await expect(page.getByRole('heading', { name: /Test STAC API/i })).toBeVisible();
    // Should navigate to root, not /external/...
    await expect(page).toHaveURL(/\/$/);
  });

  test('paginated collections are fully loaded via auto-load', async ({ page, worker }) => {
    await mockApiRootAndCollections(worker, { collectionsPage2Fixture: 'collections-page2.json' });
    await page.goto('/');
    await waitForBrowserReady(page);

    // The "Load more" button auto-triggers via v-visible when visible in the viewport.
    // With few collections all pages load automatically.
    await expect(page.locator('.catalog-card')).toHaveCount(3, { timeout: 10000 });
    await expect(page.getByRole('link', { name: /Test Collection 1/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /Test Collection 2/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /Test Collection 3/i })).toBeVisible();
  });

  test('load more button disappears after all pages are loaded', async ({ page, worker }) => {
    await mockApiRootAndCollections(worker, { collectionsPage2Fixture: 'collections-page2.json' });
    await page.goto('/');
    await waitForBrowserReady(page);

    // Wait for all pages to auto-load
    await expect(page.locator('.catalog-card')).toHaveCount(3, { timeout: 10000 });

    // The load more button should be gone after the last page
    const loadMoreBtn = page.getByRole('button', { name: /load more/i });
    await expect(loadMoreBtn).not.toBeVisible();
  });
});
