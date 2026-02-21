import { test, expect } from '@playwright/test';
import { mockCatalogByFolder, loadMockCatalog, waitForBrowserReady } from './helpers';
import fs from 'fs';
import path from 'path';

test.describe('Collection view using folder fixtures', () => {
  const folderName = 'microsoft-pc';
  const catalogUrl = `https://example.com/${folderName}`;

  let catalog;
  let collection;

  test.beforeAll(() => {
    const base = path.resolve(new URL('../fixtures/catalogs/', import.meta.url).pathname, folderName);
    catalog = JSON.parse(fs.readFileSync(path.join(base, 'info.json')));
    const collList = JSON.parse(fs.readFileSync(path.join(base, 'collections.json')));
    // pick the sentinel-2-l2a collection; it should exist in the fixture
    collection = collList.collections.find(c => c.id === 'sentinel-2-l2a');
    if (!collection) {
      throw new Error('expected sentinel-2-l2a collection in fixture');
    }
  });

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
    // description contains links; just verify a known starting phrase is visible
    await expect(page.getByText(/The Sentinel-2 program provides global imagery/i).first()).toBeVisible();

    // "Up" navigation returns to parent catalog
    const upBtn = page.getByRole('button', { name: /up/i }).first();
    await expect(upBtn).toBeVisible();
    await upBtn.click();
    await waitForBrowserReady(page);
    // parent catalog title should reappear
    await expect(page.getByRole('heading', { name: new RegExp(catalog.title, 'i') })).toBeVisible();

    // now navigate back into the collection to continue the rest of the checks
    await page.getByRole('link', { name: new RegExp(collection.title, 'i') }).click();
    await waitForBrowserReady(page);

    // keywords badges (limit search to the rendered badge elements)
    if (Array.isArray(collection.keywords) && collection.keywords.length > 0) {
      for (const kw of collection.keywords) {
        const badge = page.locator('.keywords .keyword', { hasText: new RegExp(kw, 'i') });
        await expect(badge.first()).toBeVisible();
      }
    }

    // license and temporal extent rows
    await expect(page.getByText(/license/i)).toBeVisible();
    // license info is rendered as a link in the fixture
    await expect(page.getByRole('link', { name: /Copernicus Sentinel data terms/i })).toBeVisible();
    // temporal extent value should include the start date from the fixture
    if (collection.extent && collection.extent.temporal && collection.extent.temporal.interval.length > 0) {
      const start = collection.extent.temporal.interval[0][0].split('T')[0];
      await expect(page.getByText(new RegExp(start))).toBeVisible();
    }

    // map/thumbnail tabs: switch away and back to ensure both panels render
    await expect(page.locator('.maps-preview')).toBeVisible();
    const thumbTab = page.getByRole('tab', { name: /thumbnails/i });
    await thumbTab.click();
    // thumbnails panel appears as a tabpanel containing an image link
    await expect(page.getByRole('tabpanel', { name: /thumbnails/i })).toBeVisible();
    const mapTab = page.getByRole('tab', { name: /map/i });
    await mapTab.click();
    // after returning to map, zoom controls should be enabled
    const zoomIn = page.locator('.maps-preview button', { hasText: '+' }).first();
    const zoomOut = page.locator('.maps-preview button').filter({ hasText: /[-–−]/ }).first();
    const fullscreen = page.locator('.maps-preview button', { hasText: /⛶|fullscreen/i }).first();
    await expect(zoomIn).toBeEnabled();
    // zoom‑out button may use an en‑dash character; just ensure it exists
    await expect(zoomOut).toHaveCount(1);
    await expect(fullscreen).toBeEnabled();

    // metadata, assets, providers sections should render
    await expect(page.locator('section.metadata.mb-4').first()).toBeVisible();
    if (Array.isArray(collection.providers) && collection.providers.length > 0) {
      await expect(page.locator('.providers')).toBeVisible();
    }
    if (collection.assets && Object.keys(collection.assets).length > 0) {
      await expect(page.locator('.assets').first()).toBeVisible();
      // open the first asset card and verify details show
      const assetBtn = page.getByRole('button', { name: /GeoParquet STAC items/i }).first();
      await expect(assetBtn).toBeVisible();
      await assetBtn.click();
      // wait for detail panel to render, count rather than strict visibility
      const alt = page.locator('.asset-alternative');
      await alt.first().waitFor({ state: 'visible', timeout: 5000 });
      const altCount = await alt.count();
      expect(altCount).toBeGreaterThan(0);
    }

    // items cards are present
    const itemCards = page.locator('.items .card-grid > *');
    const count = await itemCards.count();
    expect(count).toBeGreaterThan(0);

    // pagination controls may or may not be present depending on item count
    const pag = page.locator('.pagination');
    const pagCount = await pag.count();
    if (pagCount > 0) {
      await expect(pag.first()).toBeVisible();
    }

    // show filter button toggles the form
    const showBtn = page.getByRole('button', { name: /show filter/i });
    await expect(showBtn).toBeVisible();
    // ensure the collapse panel starts hidden
    const panel = page.locator('#itemFilter');
    await expect(panel).toBeHidden();
    await showBtn.click();
    await expect(panel).toBeVisible();
  });

  test('items navigation and pagination controls', async ({ page }) => {
    await loadMockCatalog(page, catalog, catalogUrl);
    await page.getByRole('link', { name: new RegExp(collection.title, 'i') }).click();
    await waitForBrowserReady(page);

    // hover over first item card (shouldn't crash)
    const firstItem = page.locator('.items .card-grid > *').first();
    await firstItem.hover();
    await expect(firstItem).toBeVisible();

    // pagination buttons: prev/first disabled, next enabled, last may be present
    const nextBtn = page.getByRole('button', { name: /next/i }).first();
    const prevBtn = page.getByRole('button', { name: /prev(?:ious)?/i }).first();
    const firstBtn = page.getByRole('button', { name: /first/i }).first();
    const lastBtn = page.getByRole('button', { name: /last/i }).first();
    await expect(nextBtn).toBeEnabled();
    await expect(prevBtn).toBeDisabled();
    await expect(firstBtn).toBeDisabled();
    if (await lastBtn.count()) {
      await expect(lastBtn).toBeEnabled();
    }

    // click the card link to navigate to item view
    const itemLink = firstItem.locator('a').first();
    const itemHref = await itemLink.getAttribute('href');
    await itemLink.click();
    await waitForBrowserReady(page);
    // item heading should show something from href (id is last segment)
    const id = itemHref?.split('/').pop() || '';
    await expect(page.getByRole('heading', { name: new RegExp(id, 'i') })).toBeVisible();
  });
});
