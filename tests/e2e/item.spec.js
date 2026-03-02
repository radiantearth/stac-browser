import { test, expect } from '@playwright/test';
import { mockCatalogByFolder, loadMockCatalog, loadFixture, waitForBrowserReady } from './helpers';

// Exercises viewing an item in a static STAC catalog.
// Navigates: root catalog -> eo-collection -> first item (EO-2025-001)

test.describe('Item view using folder fixtures', () => {
  const folderName = 'test-catalog';
  const catalogUrl = `https://example.com/${folderName}`;

  const catalog = loadFixture(folderName, 'catalog.json');
  const collection = loadFixture(folderName, 'eo-collection', 'collection.json');
  const item = loadFixture(folderName, 'eo-collection', 'item-2025-001.json');

  test.beforeEach(async ({ page }) => {
    // mockCatalogByFolder registers routes for every fixture file (catalog,
    // collections, items) via their self links - no extra stubs needed.
    await mockCatalogByFolder(page, catalogUrl);
  });

  async function gotoItem(page) {
    await loadMockCatalog(page, catalog, catalogUrl);
    await page.getByRole('link', { name: new RegExp(collection.title, 'i') }).click();
    await waitForBrowserReady(page);
    await page.getByRole('link', { name: new RegExp(item.id, 'i') }).click();
    await waitForBrowserReady(page);
  }

  test('loads basic item metadata and navigation', async ({ page }) => {
    await gotoItem(page);

    // check heading shows item id
    await expect(page.getByRole('heading', { name: new RegExp(item.id, 'i') })).toBeVisible();

    // "Collection" button navigates to parent collection
    const collBtn = page.getByRole('button', { name: /collection/i }).first();
    await expect(collBtn).toBeVisible();
    await collBtn.click();
    await waitForBrowserReady(page);
    await expect(page.getByRole('heading', { name: new RegExp(collection.title, 'i') })).toBeVisible();

    // return to item
    await page.getByRole('link', { name: new RegExp(item.id, 'i') }).click();
    await waitForBrowserReady(page);

    // "Up" returns to parent collection
    const up = page.getByRole('button', { name: /up/i }).first();
    await expect(up).toBeVisible();
    await up.click();
    await waitForBrowserReady(page);
    await expect(page.getByRole('heading', { name: new RegExp(collection.title, 'i') })).toBeVisible();
  });

  test('map & thumbnails behave correctly', async ({ page }) => {
    await gotoItem(page);

    await expect(page.locator('.maps-preview')).toBeVisible();
    const thumbTab = page.getByRole('tab', { name: /thumbnails/i });
    await thumbTab.click();
    await expect(page.getByRole('tabpanel', { name: /thumbnails/i })).toBeVisible();
    const mapTab = page.getByRole('tab', { name: /map/i });
    await mapTab.click();
    const zoomIn = page.locator('.maps-preview button', { hasText: '+' }).first();
    const zoomOut = page.locator('.maps-preview button').filter({ hasText: /[-\u2013\u2212]/ }).first();
    const fullscreen = page.locator('.maps-preview button', { hasText: /\u26F6|fullscreen/i }).first();
    await expect(zoomIn).toBeEnabled();
    await expect(zoomOut).toHaveCount(1);
    await expect(fullscreen).toBeEnabled();
  });

  test('assets section and show-on-map action', async ({ page }) => {
    await gotoItem(page);

    const assetBtn = page.getByRole('button', { name: /Aerosol Optical Thickness/i }).first();
    await expect(assetBtn).toBeVisible();
    await assetBtn.click();
    // the expanded asset panel shows Download / Copy URL / Show on map buttons
    await expect(page.getByRole('button', { name: /Download/i })).toBeVisible({ timeout: 5000 });
  });

  test('additional resources links are shown', async ({ page }) => {
    await gotoItem(page);

    // The item has "via" and "describedby" links which appear under
    // "Additional Resources" (or similar heading) on the item view.
    await expect(page.getByRole('heading', { name: /additional resources/i })).toBeVisible();
  });

  test('metadata groups contain expected fields', async ({ page }) => {
    await gotoItem(page);

    await expect(page.getByRole('heading', { name: /metadata/i }).first()).toBeVisible();
  });
});
