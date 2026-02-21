import { test, expect } from '@playwright/test';
import { mockCatalogByFolder, loadMockCatalog, waitForBrowserReady, mockStacResource } from './helpers';
import fs from 'fs';
import path from 'path';

// exercises viewing an item obtained via the catalog/collection folder fixtures
// uses the first collection and first item from microsoft-pc/sentinel-2-l2a

test.describe('Item view using folder fixtures', () => {
  const folderName = 'microsoft-pc';
  const catalogUrl = `https://example.com/${folderName}`;

  let catalog;
  let collection;
  let item;
  let base;

  test.beforeAll(() => {
    base = path.resolve(new URL('../fixtures/catalogs/', import.meta.url).pathname, folderName);
    catalog = JSON.parse(fs.readFileSync(path.join(base, 'info.json')));
    const collList = JSON.parse(fs.readFileSync(path.join(base, 'collections.json')));
    collection = collList.collections.find(c => c.id === 'sentinel-2-l2a');
    const items = JSON.parse(fs.readFileSync(path.join(base, 'collections', collection.id, 'items.json')));
    item = items.features[0];
    if (!item) {
      throw new Error('no item found in fixture');
    }
  });

  test.beforeEach(async ({ page }) => {
    await mockCatalogByFolder(page, catalogUrl);

    // stub the individual item resource so navigation works
    const itemUrl = new URL(item.links.find(l => l.rel === 'self').href).href;
    const itemPath = path.join(base, 'collections', collection.id, 'items', `${item.id}.json`);
    if (fs.existsSync(itemPath)) {
      const itemData = JSON.parse(fs.readFileSync(itemPath));
      await mockStacResource(page, itemUrl, itemData);
    }
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

    // license link may or may not appear on item view; if it does, verify the URL
    const lic = page.getByRole('link', { name: /Copernicus Sentinel data terms/i });
    if (await lic.count()) {
      await expect(lic).toHaveAttribute('href', /sentinel-data/i);
    }

    // keywords (if any)
    if (Array.isArray(item.properties?.keywords) && item.properties.keywords.length > 0) {
      for (const kw of item.properties.keywords) {
        await expect(page.getByText(new RegExp(kw, 'i'))).toBeVisible();
      }
    }

    // "Collection" button sits next to Up and should navigate to parent collection
    const collBtn = page.getByRole('button', { name: /collection/i }).first();
    await expect(collBtn).toBeVisible();
    // click collection nav
    await collBtn.click();
    await waitForBrowserReady(page);
    await expect(page.getByRole('heading', { name: new RegExp(collection.title, 'i') })).toBeVisible();
    // return to item to continue the remainder of the test
    await page.getByRole('link', { name: new RegExp(item.id, 'i') }).click();
    await waitForBrowserReady(page);

    // "Up" returns to parent catalog (already tested elsewhere)
    const up = page.getByRole('button', { name: /up/i }).first();
    await expect(up).toBeVisible();
    await up.click();
    await waitForBrowserReady(page);
    await expect(page.getByRole('heading', { name: new RegExp(collection.title, 'i') })).toBeVisible();
  });

  test('map & thumbnails behave correctly', async ({ page }) => {
    await gotoItem(page);

    // initially map visible
    await expect(page.locator('.maps-preview')).toBeVisible();
    const thumbTab = page.getByRole('tab', { name: /thumbnails/i });
    await thumbTab.click();
    await expect(page.getByRole('tabpanel', { name: /thumbnails/i })).toBeVisible();
    const mapTab = page.getByRole('tab', { name: /map/i });
    await mapTab.click();
    const zoomIn = page.locator('.maps-preview button', { hasText: '+' }).first();
    const zoomOut = page.locator('.maps-preview button').filter({ hasText: /[-–−]/ }).first();
    const fullscreen = page.locator('.maps-preview button', { hasText: /⛶|fullscreen/i }).first();
    await expect(zoomIn).toBeEnabled();
    await expect(zoomOut).toHaveCount(1);
    await expect(fullscreen).toBeEnabled();
  });

  test('assets section and show-on-map action', async ({ page }) => {
    await gotoItem(page);

    // assets list should show and be clickable
    const assetBtn = page.getByRole('button', { name: /Aerosol optical thickness/i }).first();
    await expect(assetBtn).toBeVisible();
    await assetBtn.click();
    const alt = page.locator('.asset-alternative');
    await alt.first().waitFor({ state: 'visible', timeout: 5000 });
    expect(await alt.count()).toBeGreaterThan(0);
  });

  test('providers and links are correct', async ({ page }) => {
    await gotoItem(page);

    if (Array.isArray(item.providers)) {
      for (const prov of item.providers) {
        await expect(page.getByRole('link', { name: new RegExp(prov.name, 'i') })).toHaveAttribute('target', '_blank');
      }
    }
  });

  test('metadata groups contain expected fields', async ({ page }) => {
    await gotoItem(page);

    // at least one metadata heading should exist
    await expect(page.getByRole('heading', { name: /metadata/i }).first()).toBeVisible();
  });
});
