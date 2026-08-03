/**
 * getStacLayerOptions config option tests.
 *
 * Verifies that the `getStacLayerOptions` function from the config is passed
 * through to ol-stac's `getLayerOptions` option: it is called with the layer
 * type, the assembled layer options and the STAC Asset or Link right before
 * each individual layer is created, and the options it returns (possibly
 * asynchronously) are the ones used to create the layer.
 *
 * The function is injected at runtime through `window.STAC_BROWSER_CONFIG`
 * (see src/merged-config.js), which is how deployments provide function-valued
 * config options.
 */
import { test, expect } from './fixtures.js';
import { waitForBrowserReady, waitForMapReady } from './helpers.js';
import StaticCatalog from '../fixtures/instances/static.js';

function createItem() {
  const catalog = new StaticCatalog({ url: 'https://stac.example/catalog.json' });
  const item = catalog.addItem({ url: 'https://stac.example/item.json', template: 'minimal' })
    .setMetadata({ title: 'Layer Options Item', datetime: '2025-01-01T00:00:00Z' });
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
  // The item has no assets, so this web map link is rendered as a tile layer
  // and the getStacLayerOptions hook is called for it.
  item.addLink({
    rel: 'xyz',
    href: 'https://tiles.example/{z}/{x}/{y}.png',
    id: 'e2e-tiles',
    type: 'image/png',
  });
  return { catalog, item };
}

test.describe('getStacLayerOptions', () => {
  test('is passed through to ol-stac and applied to the created layers', async ({ page, worker }) => {
    const { catalog, item } = createItem();
    await catalog.createServer(worker);

    await page.addInitScript(() => {
      window.__stacLayerHook = { calls: [] };
      window.STAC_BROWSER_CONFIG = {
        // Async on purpose: ol-stac must await the returned promise.
        getStacLayerOptions: async (type, options, reference) => {
          window.__stacLayerHook.calls.push({
            type: String(type),
            rel: reference?.rel ?? null,
            hasSource: Boolean(options?.source),
          });
          // `properties` is passed through to the OpenLayers layer, so the
          // test can verify that the returned options were actually used.
          return { ...options, properties: { e2eLayerOptionsApplied: true } };
        },
      };
    });

    await page.goto(item.getBrowserPath());
    await waitForBrowserReady(page);
    await waitForMapReady(page);

    // The hook was called for the tile layer created for the web map link.
    await expect
      .poll(() => page.evaluate(() => window.__stacLayerHook.calls.length), { timeout: 15000 })
      .toBeGreaterThan(0);
    const hook = await page.evaluate(() => window.__stacLayerHook);
    expect(hook.calls).toContainEqual({ type: 'Tile', rel: 'xyz', hasSource: true });

    // The returned options were used to create the layer: the injected
    // property is readable on the layer nested inside the ol-stac layer
    // group. The OL map isn't exposed to the DOM, so locate it via the
    // MapView component instance (see getMapState in helpers.js).
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
        // Flatten layer groups (the ol-stac layer is a LayerGroup).
        const layers = map.getLayers().getArray()
          .flatMap((layer) => (layer.getLayersArray ? layer.getLayersArray() : [layer]));
        return layers.some((layer) => layer.get && layer.get('e2eLayerOptionsApplied') === true);
      }), { timeout: 15000 })
      .toBe(true);
  });
});
