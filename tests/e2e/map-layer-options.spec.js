/**
 * Map layer option tests.
 *
 * getStacLayerOptions: Verifies that the `getStacLayerOptions` function from
 * the config is passed through to ol-stac's `getLayerOptions` option.
 * The function is injected at runtime through `window.STAC_BROWSER_CONFIG`
 * (see src/merged-config.js), which is how deployments provide function-valued
 * config options.
 *
 * Tile URL templates: URL templates from web map links (XYZ) and TileJSON
 * manifests must keep their `{z}/{x}/{y}` placeholders when stac-browser
 * rewrites request URLs through `getRequestUrl`.
 * Regression test for https://github.com/radiantearth/stac-browser/issues/996
 */
import { http, HttpResponse } from 'msw';
import { test, expect } from './fixtures.js';
import { waitForBrowserReady, waitForMapReady } from './helpers.js';
import StaticCatalog from '../fixtures/instances/static.js';

const TILE_TEMPLATE = 'https://tiles.example/tiles/{z}/{x}/{y}.png';
const MANIFEST_URL = 'https://tiles.example/manifest.json';

function createItem(link) {
  const catalog = new StaticCatalog({ url: 'https://stac.example/catalog.json' });
  const item = catalog.addItem({ url: 'https://stac.example/item.json', template: 'minimal' })
    .setMetadata({ title: 'Web Map Link Item', datetime: '2025-01-01T00:00:00Z' });
  item.data.bbox = [172, -42, 175, -39];
  item.data.geometry = {
    type: 'Polygon',
    coordinates: [[
      [172, -42],
      [175, -42],
      [175, -39],
      [172, -39],
      [172, -42],
    ]],
  };
  item.addLink(link);
  return { catalog, item };
}

/**
 * Reads the tile URL templates from the non-basemap tile sources on the map:
 * the `tiles` templates for TileJSON sources, the source URLs otherwise.
 * The OL map isn't exposed to the DOM, so locate it via the MapView component
 * instance (see getMapState in helpers.js).
 *
 * @param {import('@playwright/test').Page} page
 * @returns {Promise<Array<string>|null>} The templates, or null while the sources are not ready
 */
function getTileUrlTemplates(page) {
  return page.evaluate(() => {
    let el = document.querySelector('.map-container .map') || document.querySelector('.map');
    let map = null;
    while (el) {
      const inst = el.__vueParentComponent;
      let candidate;
      try {
        candidate = inst?.proxy?.map ?? inst?.ctx?.map;
      } catch {
        candidate = null;
      }
      if (candidate && typeof candidate.getView === 'function') {
        map = candidate;
        break;
      }
      el = el.parentElement;
    }
    if (!map) {
      return null;
    }
    const layers = map.getLayers().getArray()
      .filter((layer) => !(layer.get && layer.get('base')))
      .flatMap((layer) => (layer.getLayersArray ? layer.getLayersArray() : [layer]));
    for (const layer of layers) {
      const source = layer.getSource && layer.getSource();
      if (!source) {
        continue;
      }
      if (typeof source.getTileJSON === 'function') {
        const tileJSON = source.getTileJSON();
        if (tileJSON && Array.isArray(tileJSON.tiles)) {
          return tileJSON.tiles;
        }
        continue;
      }
      if (typeof source.getUrls === 'function') {
        const urls = source.getUrls();
        if (Array.isArray(urls) && urls.length > 0) {
          return urls;
        }
      }
    }
    return null;
  });
}

test.describe('getStacLayerOptions', () => {
  test('is passed through to ol-stac and applied to the created layers', async ({ page, worker }) => {
    const { catalog, item } = createItem({
      rel: 'xyz',
      href: TILE_TEMPLATE,
      id: 'e2e-tiles',
      type: 'image/png',
    });
    await catalog.createServer(worker);

    await page.addInitScript(() => {
      window.__stacLayerHook = { calls: [] };
      window.STAC_BROWSER_CONFIG = {
        getStacLayerOptions: (type, options, reference) => {
          window.__stacLayerHook.calls.push({
            type: String(type),
            rel: reference?.rel ?? null,
            hasSource: Boolean(options?.source),
          });
          // Promise on purpose: ol-stac must await it
          return Promise.resolve({ ...options, properties: { e2eLayerOptionsApplied: true } });
        },
      };
    });

    await page.goto(item.getBrowserPath());
    await waitForBrowserReady(page);
    await waitForMapReady(page);

    await expect
      .poll(() => page.evaluate(() => window.__stacLayerHook.calls.length), { timeout: 15000 })
      .toBeGreaterThan(0);
    const hook = await page.evaluate(() => window.__stacLayerHook);
    expect(hook.calls).toContainEqual({ type: 'Tile', rel: 'xyz', hasSource: true });

    await expect
      .poll(() => page.evaluate(() => {
        let el = document.querySelector('.map-container .map') || document.querySelector('.map');
        let map = null;
        while (el) {
          const inst = el.__vueParentComponent;
          let candidate;
          try {
            candidate = inst?.proxy?.map ?? inst?.ctx?.map;
          } catch {
            candidate = null;
          }
          if (candidate && typeof candidate.getView === 'function') {
            map = candidate;
            break;
          }
          el = el.parentElement;
        }
        if (!map) {
          return false;
        }
        const layers = map.getLayers().getArray()
          .flatMap((layer) => (layer.getLayersArray ? layer.getLayersArray() : [layer]));
        return layers.some((layer) => layer.get && layer.get('e2eLayerOptionsApplied') === true);
      }), { timeout: 15000 })
      .toBe(true);
  });
});

test.describe('tile URL templates', () => {
  test('keeps the placeholders of XYZ web map links', async ({ page, worker }) => {
    const { catalog, item } = createItem({
      rel: 'xyz',
      href: TILE_TEMPLATE,
      id: 'e2e-xyz',
      type: 'image/png',
    });
    await catalog.createServer(worker);

    await page.goto(item.getBrowserPath());
    await waitForBrowserReady(page);
    await waitForMapReady(page);

    await expect
      .poll(() => getTileUrlTemplates(page), { timeout: 15000 })
      .toEqual([TILE_TEMPLATE]);
  });

  test('keeps the placeholders of TileJSON tile templates', async ({ page, worker }) => {
    const { catalog, item } = createItem({
      rel: 'tilejson',
      href: MANIFEST_URL,
      id: 'e2e-tilejson',
      type: 'application/json',
    });
    await catalog.createServer(worker);
    await worker.use(
      http.get(MANIFEST_URL, () => HttpResponse.json({
        tilejson: '2.2.0',
        tiles: [TILE_TEMPLATE],
        bounds: [172, -42, 175, -39],
      }))
    );

    await page.goto(item.getBrowserPath());
    await waitForBrowserReady(page);
    await waitForMapReady(page);

    await expect
      .poll(() => getTileUrlTemplates(page), { timeout: 15000 })
      .toEqual([TILE_TEMPLATE]);
  });
});
