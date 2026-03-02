/**
 * API-backed catalog tests.
 *
 * Verifies STAC Browser behaviour when browsing a STAC API catalog (as opposed
 * to a static catalog).  Covers: collection listing from GET /collections,
 * item loading from GET /collections/{id}/items, pagination, and the item
 * filter toggle.
 *
 * Fixtures: tests/fixtures/api/ (root.json, collections.json, collection-1.json,
 *           collection-1-items.json, collection-1-items-page2.json)
 */
import { test, expect } from '@playwright/test';
import {
  mockApiRootAndCollections,
  mockApiCollection,
  waitForBrowserReady,
} from './helpers';

const API_ROOT_PATH = '/external/example.com/api';
const COLLECTION_PATH = '/external/example.com/api/collections/test-collection-1';

test.describe('API-backed catalog browsing', () => {

  test('API root loads and displays collections from /collections endpoint', async ({ page }) => {
    await mockApiRootAndCollections(page);
    await page.goto(API_ROOT_PATH);
    await waitForBrowserReady(page);

    await expect(page.getByRole('heading', { name: /Test STAC API/i })).toBeVisible();

    // Collections should be loaded from the API /collections endpoint
    await expect(page.getByRole('link', { name: /Test Collection 1/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /Test Collection 2/i })).toBeVisible();
  });

  test('clicking a collection navigates to its page', async ({ page }) => {
    await mockApiCollection(page);
    await page.goto(API_ROOT_PATH);
    await waitForBrowserReady(page);

    await page.getByRole('link', { name: /Test Collection 1/i }).click();
    await waitForBrowserReady(page);

    await expect(page.getByRole('heading', { name: /Test Collection 1/i })).toBeVisible();
  });

  test('collection page loads items from /items endpoint', async ({ page }) => {
    await mockApiCollection(page);
    await page.goto(COLLECTION_PATH);
    await waitForBrowserReady(page);

    // Items should be loaded from the API items endpoint
    await expect(page.locator('.item-card')).toHaveCount(2, { timeout: 10000 });
    await expect(page.locator('.item-card').nth(0).locator('.stac-link .title')).toHaveText('API Item Alpha');
    await expect(page.locator('.item-card').nth(1).locator('.stac-link .title')).toHaveText('API Item Beta');
  });

  test('collection page shows item count from API response', async ({ page }) => {
    await mockApiCollection(page);
    await page.goto(COLLECTION_PATH);
    await waitForBrowserReady(page);

    await expect(page.locator('.item-card')).toHaveCount(2, { timeout: 10000 });

    // The items header badge should show numberMatched from the API
    const itemsHeader = page.locator('.items header');
    await expect(itemsHeader.locator('.badge')).toContainText('3');
  });

  test('pagination controls appear when items response has next link', async ({ page }) => {
    await mockApiCollection(page, { itemsPage2Fixture: 'collection-1-items-page2.json' });
    await page.goto(COLLECTION_PATH);
    await waitForBrowserReady(page);

    await expect(page.locator('.item-card')).toHaveCount(2, { timeout: 10000 });

    // Pagination should be visible since the items response has a "next" link
    const pagination = page.locator('.items .btn-group').first();
    await expect(pagination).toBeVisible();
  });

  test('clicking next page loads additional items', async ({ page }) => {
    await mockApiCollection(page, { itemsPage2Fixture: 'collection-1-items-page2.json' });
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

  test('back button returns to API root from collection', async ({ page }) => {
    await mockApiCollection(page);
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
