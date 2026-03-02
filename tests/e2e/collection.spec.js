/**
 * Collection metadata & assets tests.
 *
 * Verifies rendering a STAC collection: metadata fields, spatial extent map,
 * item listing, and detail controls.
 *
 * Fixtures: tests/fixtures/catalogs/test-catalog/eo-collection/
 */
import { test, expect } from '@playwright/test';
import { mockCatalogByFolder, loadMockCatalog, loadFixture, waitForBrowserReady } from './helpers';

test.describe('Collection view using folder fixtures', () => {
  const folderName = 'test-catalog';
  const catalogUrl = `https://example.com/${folderName}`;

  const catalog = loadFixture(folderName, 'catalog.json');
  const collection = loadFixture(folderName, 'eo-collection', 'collection.json');

  test.beforeEach(async ({ page }) => {
    await mockCatalogByFolder(page, catalogUrl);
  });

  test('displays collection metadata, map, items and controls', async ({ page }) => {
    await loadMockCatalog(page, catalog, catalogUrl);

    // navigate into the specific collection
    await page.getByRole('link', { name: new RegExp(collection.title, 'i') }).click();
    await waitForBrowserReady(page);

    // title & description
    await expect(page.getByRole('heading', { name: new RegExp(collection.title, 'i') })).toBeVisible();
    await expect(page.getByText(/Global surface reflectance data/i).first()).toBeVisible();

    // "Up" navigation returns to parent catalog
    const upBtn = page.getByRole('button', { name: /up/i }).first();
    await expect(upBtn).toBeVisible();
    await upBtn.click();
    await waitForBrowserReady(page);
    await expect(page.getByRole('heading', { name: new RegExp(catalog.title, 'i') })).toBeVisible();

    // navigate back into the collection to continue checks
    await page.getByRole('link', { name: new RegExp(collection.title, 'i') }).click();
    await waitForBrowserReady(page);

    // keywords badges
    for (const kw of collection.keywords) {
      const badge = page.locator('.keywords .keyword', { hasText: new RegExp(kw, 'i') });
      await expect(badge.first()).toBeVisible();
    }

    // license link
    await expect(page.getByRole('link', { name: /Test Data License/i })).toBeVisible();

    // temporal extent value should include the start date from the fixture
    const start = collection.extent.temporal.interval[0][0].split('T')[0];
    await expect(page.getByText(new RegExp(start))).toBeVisible();

    // map/thumbnail tabs
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

    // metadata, assets, providers sections should render
    await expect(page.locator('section.metadata.mb-4').first()).toBeVisible();
    await expect(page.locator('.providers')).toBeVisible();
    await expect(page.locator('.assets').first()).toBeVisible();

    // open the first asset card and verify details show
    const assetBtn = page.getByRole('button', { name: /Collection Metadata/i }).first();
    await expect(assetBtn).toBeVisible();
    await assetBtn.click();
    // the expanded asset panel shows Download / Copy URL buttons
    await expect(page.getByRole('button', { name: /Download/i })).toBeVisible({ timeout: 5000 });

    // items from "item" links should be visible
    const itemLinks = page.getByRole('link', { name: /item-2025-/i });
    await expect(itemLinks.first()).toBeVisible();
  });

  test('items navigation from collection to item view', async ({ page }) => {
    await loadMockCatalog(page, catalog, catalogUrl);
    await page.getByRole('link', { name: new RegExp(collection.title, 'i') }).click();
    await waitForBrowserReady(page);

    // click the first item link to navigate to item view
    const itemLink = page.getByRole('link', { name: /item-2025-001/i }).first();
    await expect(itemLink).toBeVisible();
    await itemLink.click();
    await waitForBrowserReady(page);

    // item heading should show the item id
    await expect(page.getByRole('heading', { name: /item-2025-001/i })).toBeVisible();
  });
});
