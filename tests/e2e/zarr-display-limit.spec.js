/**
 * Display-limit tests.
 *
 * Assets exceeding `maxDisplayPixels` are not shown on the map
 * automatically; "Show on map" asks for confirmation first and
 * selecting another asset re-arms the limit.
 */
import { http, HttpResponse } from 'msw';
import { test, expect } from './fixtures.js';
import { waitForBrowserReady, waitForMapReady } from './helpers.js';
import StaticCatalog from '../fixtures/instances/static.js';

const ROOT_URL = 'https://stac.example/catalog.json';
const ITEM_URL = 'https://stac.example/item.json';
const BIG_A_URL = 'https://stac.example/big-a.zarr';
const BIG_B_URL = 'https://stac.example/big-b.zarr';
const SMALL_URL = 'https://stac.example/small.zarr';

// 64 megapixels, exceeds the default 16 megapixel display limit
const BIG_SHAPE = [8000, 8000];
const SMALL_SHAPE = [512, 512];

/**
 * Serves a minimal single-resolution Zarr v2 store. Only the consolidated
 * metadata is needed: nothing is requested before the confirmation and
 * missing chunks resolve to the fill value afterwards.
 */
async function mockZarrStore(worker, url, shape) {
  const metadata = {
    zarr_consolidated_format: 1,
    metadata: {
      '.zgroup': { zarr_format: 2 },
      '.zattrs': {},
      'velocity/.zarray': {
        zarr_format: 2,
        shape,
        chunks: [2048, 2048],
        dtype: '<f4',
        compressor: null,
        fill_value: 'NaN',
        order: 'C',
        filters: null
      },
      'velocity/.zattrs': { _ARRAY_DIMENSIONS: ['y', 'x'] }
    }
  };
  // One handler only, the wildcard would win over a dedicated one
  await worker.use(
    http.get(`${url}/*`, ({ request }) => {
      if (new URL(request.url).pathname.endsWith('/.zmetadata')) {
        return HttpResponse.json(metadata);
      }
      return new HttpResponse(null, { status: 404 });
    })
  );
}

/**
 * Creates an item with Zarr assets, described through the datacube extension.
 */
function createItem(catalog, assets) {
  const item = catalog.addItem({ url: ITEM_URL });
  item.setMetadata({
    'cube:dimensions': {
      y: { type: 'spatial', axis: 'y', extent: [40, 50] },
      x: { type: 'spatial', axis: 'x', extent: [10, 20] }
    },
    'cube:variables': {
      velocity: { type: 'data', dimensions: ['y', 'x'] }
    }
  });
  item.data.stac_extensions = [
    'https://stac-extensions.github.io/datacube/v2.2.0/schema.json'
  ];
  // The template's assets (e.g. a GeoTIFF) would win the default visualization
  item.data.assets = {};
  for (const [key, definition] of Object.entries(assets)) {
    item.data.assets[key] = {
      href: definition.url,
      type: 'application/vnd.zarr; version=2',
      title: definition.title,
      roles: ['data']
    };
  }
  return item;
}

async function setupTwoBigAssets(page, worker) {
  const catalog = new StaticCatalog({ url: ROOT_URL });
  const item = createItem(catalog, {
    a: { url: BIG_A_URL, title: 'Big A' },
    b: { url: BIG_B_URL, title: 'Big B' }
  });
  await catalog.createServer(worker);
  await mockZarrStore(worker, BIG_A_URL, BIG_SHAPE);
  await mockZarrStore(worker, BIG_B_URL, BIG_SHAPE);
  await page.goto(item.getBrowserPath());
  await waitForBrowserReady(page);
  await waitForMapReady(page);
}

function asset(page, title) {
  return page.locator('.asset', { hasText: title });
}

async function showOnMap(page, title) {
  // The toggle's accessible name also contains the file format badges
  await asset(page, title).getByRole('button', { name: new RegExp(title) }).click();
  await asset(page, title).getByRole('button', { name: 'Show on map' }).click();
}

function dialog(page) {
  return page.locator('.modal-content', { hasText: 'Large dataset' });
}

test.describe('Display limit', () => {
  test('oversized Zarr assets are not shown automatically', async ({ page, worker }) => {
    await setupTwoBigAssets(page, worker);

    await expect(dialog(page)).toBeHidden();
    await expect(page.locator('.badge.shown')).toHaveCount(0);
    await expect(page.locator('.global-error')).toHaveCount(0);
  });

  test('selecting an oversized asset asks for confirmation, cancel keeps it hidden', async ({ page, worker }) => {
    await setupTwoBigAssets(page, worker);

    await showOnMap(page, 'Big A');
    await expect(dialog(page)).toBeVisible({ timeout: 15000 });
    await expect(dialog(page)).toContainText('may slow down or freeze the browser');

    await dialog(page).getByRole('button', { name: 'Cancel' }).click();
    await expect(dialog(page)).toBeHidden();
    await expect(page.locator('.badge.shown')).toHaveCount(0);
  });

  test('confirming shows the asset, the next selection re-arms the limit', async ({ page, worker }) => {
    await setupTwoBigAssets(page, worker);

    await showOnMap(page, 'Big A');
    await expect(dialog(page)).toBeVisible({ timeout: 15000 });
    await dialog(page).getByRole('button', { name: 'Show anyway' }).click();
    await expect(dialog(page)).toBeHidden();
    await expect(asset(page, 'Big A').locator('.badge.shown')).toBeVisible({ timeout: 15000 });

    // The confirmation only applied to the previously selected asset
    await showOnMap(page, 'Big B');
    await expect(dialog(page)).toBeVisible({ timeout: 15000 });
    await dialog(page).getByRole('button', { name: 'Show anyway' }).click();
    await expect(dialog(page)).toBeHidden();
    await expect(asset(page, 'Big B').locator('.badge.shown')).toBeVisible({ timeout: 15000 });
  });

  test('small Zarr assets are shown automatically without confirmation', async ({ page, worker }) => {
    const catalog = new StaticCatalog({ url: ROOT_URL });
    const item = createItem(catalog, {
      small: { url: SMALL_URL, title: 'Small store' }
    });
    await catalog.createServer(worker);
    await mockZarrStore(worker, SMALL_URL, SMALL_SHAPE);
    await page.goto(item.getBrowserPath());
    await waitForBrowserReady(page);
    await waitForMapReady(page);

    await expect(page.locator('.badge.shown')).toBeVisible({ timeout: 15000 });
    await expect(dialog(page)).toBeHidden();
  });
});
