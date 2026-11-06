/**
 * Showing multiple assets on the map at once.
 */
import { http, HttpResponse } from 'msw';
import { test, expect } from './fixtures.js';
import { waitForBrowserReady, waitForMapReady } from './helpers.js';
import StaticCatalog from '../fixtures/instances/static.js';

const ROOT_URL = 'https://stac.example/catalog.json';
const ITEM_URL = 'https://stac.example/item.json';

async function setup(page, worker, count) {
  const catalog = new StaticCatalog({ url: ROOT_URL });
  const item = catalog.addItem({ url: ITEM_URL });
  item.data.assets = {};
  for (let i = 1; i <= count; i++) {
    item.data.assets[`vector-${i}`] = {
      href: `https://stac.example/vector-${i}.geojson`,
      type: 'application/geo+json',
      title: `Vector ${i}`,
      roles: ['data']
    };
  }
  await catalog.createServer(worker);
  await worker.use(
    http.get(/vector-\d+\.geojson$/, () => HttpResponse.json(item.data.geometry))
  );
  await page.goto(item.getBrowserPath());
  await waitForBrowserReady(page);
  await waitForMapReady(page);
}

function asset(page, title) {
  return page.locator('.asset', { hasText: title });
}

async function clickAssetButton(page, title, name) {
  const panel = asset(page, title);
  const button = panel.getByRole('button', { name });
  if (!(await button.isVisible())) {
    // The toggle's accessible name also contains the file format badges
    await panel.getByRole('button', { name: new RegExp(title) }).click();
  }
  await button.click();
}

test.describe('Multiple assets', () => {
  test('assets are added to the map and can be hidden again', async ({ page, worker }) => {
    await setup(page, worker, 2);
    await expect(page.locator('.badge.shown')).toHaveCount(0);

    await clickAssetButton(page, 'Vector 1', 'Show on map');
    await expect(asset(page, 'Vector 1').locator('.badge.shown')).toBeVisible();

    await clickAssetButton(page, 'Vector 2', 'Show on map');
    await expect(asset(page, 'Vector 2').locator('.badge.shown')).toBeVisible();
    await expect(asset(page, 'Vector 1').locator('.badge.shown')).toBeVisible();

    await clickAssetButton(page, 'Vector 1', 'Hide from map');
    await expect(asset(page, 'Vector 1').locator('.badge.shown')).toBeHidden();
    await expect(asset(page, 'Vector 2').locator('.badge.shown')).toBeVisible();
  });

  test('the number of assets on the map is limited', async ({ page, worker }) => {
    await setup(page, worker, 9);
    for (let i = 1; i <= 8; i++) {
      // The assets must be added one after another
      // eslint-disable-next-line no-await-in-loop
      await clickAssetButton(page, `Vector ${i}`, 'Show on map');
      // eslint-disable-next-line no-await-in-loop
      await expect(asset(page, `Vector ${i}`).locator('.badge.shown')).toBeVisible();
    }
    await clickAssetButton(page, 'Vector 9', 'Show on map');
    await expect(page.locator('.global-error')).toContainText('Up to 8 layers');
    await expect(page.locator('.badge.shown')).toHaveCount(8);
  });

  test('assets can be reordered and removed in the layer switcher', async ({ page, worker }) => {
    await setup(page, worker, 2);
    await clickAssetButton(page, 'Vector 1', 'Show on map');
    await clickAssetButton(page, 'Vector 2', 'Show on map');
    await expect(asset(page, 'Vector 2').locator('.badge.shown')).toBeVisible();

    await page.locator('.ol-layercontrol button').click();
    const layerControl = page.locator('.layercontrol');
    const entry = (title) => layerControl.locator('li', { hasText: title }).last();
    const titles = layerControl.locator('.title').filter({ hasText: /^Vector/ });

    // The layer on top is listed first
    await expect(titles).toHaveText(['Vector 2', 'Vector 1']);
    await expect(entry('Vector 2').getByRole('button', { name: 'Move up' })).toBeDisabled();

    await entry('Vector 2').getByRole('button', { name: 'Move down' }).click();
    await expect(titles).toHaveText(['Vector 1', 'Vector 2']);

    await entry('Vector 1').getByRole('button', { name: 'Hide from map' }).click();
    await expect(titles).toHaveText(['Vector 2']);
    await expect(asset(page, 'Vector 1').locator('.badge.shown')).toBeHidden();
  });

  test('showing an asset again makes its hidden layer visible', async ({ page, worker }) => {
    await setup(page, worker, 2);
    await clickAssetButton(page, 'Vector 1', 'Show on map');
    await clickAssetButton(page, 'Vector 2', 'Show on map');
    await expect(asset(page, 'Vector 2').locator('.badge.shown')).toBeVisible();

    // Hide the layer through its checkbox in the layer switcher
    await page.locator('.ol-layercontrol button').click();
    await page.locator('.layercontrol li', { hasText: 'Vector 1' }).last().getByRole('checkbox').uncheck();
    await page.locator('.ol-layercontrol button').click();
    await expect(asset(page, 'Vector 1').locator('.badge.shown')).toBeHidden();

    await clickAssetButton(page, 'Vector 1', 'Show on map');
    await expect(asset(page, 'Vector 1').locator('.badge.shown')).toBeVisible();
  });

  test('assets that fail to load can be hidden again', async ({ page, worker }) => {
    await setup(page, worker, 1);
    await worker.use(http.get(/vector-1\.geojson$/, () => new HttpResponse(null, { status: 404 })));

    await clickAssetButton(page, 'Vector 1', 'Show on map');
    await clickAssetButton(page, 'Vector 1', 'Hide from map');
    await expect(asset(page, 'Vector 1').getByRole('button', { name: 'Hide from map' })).toBeHidden();
    await expect(asset(page, 'Vector 1').getByRole('button', { name: 'Show on map' })).toBeVisible();
  });
});
