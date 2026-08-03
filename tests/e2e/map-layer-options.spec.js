/**
 * getStacLayerOptions config option tests.
 *
 * Verifies that the `getStacLayerOptions` function from the config is called
 * with the assembled ol-stac layer options and the STAC object shown on the
 * map, and that the options it returns are the ones used to create the layer.
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
  return { catalog, item };
}

test.describe('getStacLayerOptions', () => {
  test('is called with the layer options and STAC object, and its result is used', async ({ page, worker }) => {
    const { catalog, item } = createItem();
    await catalog.createServer(worker);

    await page.addInitScript(() => {
      window.__stacLayerHook = { calls: 0, stacIds: [], hadData: [] };
      window.STAC_BROWSER_CONFIG = {
        getStacLayerOptions: (options, stac) => {
          window.__stacLayerHook.calls++;
          window.__stacLayerHook.stacIds.push(stac?.id ?? null);
          window.__stacLayerHook.hadData.push(options?.data === stac);
          // `properties` is passed through to the OpenLayers layer, so the
          // test can verify that the returned options were actually used.
          return { ...options, properties: { e2eLayerOptionsApplied: true } };
        },
      };
    });

    await page.goto(item.getBrowserPath());
    await waitForBrowserReady(page);
    await waitForMapReady(page);

    // The hook was called with the STAC object of the page and the assembled options.
    await expect
      .poll(() => page.evaluate(() => window.__stacLayerHook.calls), { timeout: 15000 })
      .toBeGreaterThan(0);
    const hook = await page.evaluate(() => window.__stacLayerHook);
    expect(hook.stacIds).toContain(item.data.id);
    expect(hook.hadData).toContain(true);

    // The returned options were used to create the layer: the injected
    // property is readable on the ol-stac layer. The OL map isn't exposed to
    // the DOM, so locate it via the MapView component instance (see
    // getMapState in helpers.js).
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
        return map.getLayers().getArray().some((layer) => layer.get && layer.get('e2eLayerOptionsApplied') === true);
      }), { timeout: 15000 })
      .toBe(true);
  });
});
