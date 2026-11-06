/**
 * Footprint handling tests.
 *
 * Verifies that a STAC Item whose footprint crosses the antimeridian (180°/-180°)
 * is both displayed on the map and zoomed to correctly, rather than falling back
 * to a world view. See https://github.com/radiantearth/stac-browser/issues/736
 *
 * Also verifies that a very small footprint renders and is zoomed to, instead of
 * being collapsed to a degenerate ring by the antimeridian handling in stac-js.
 * See https://github.com/radiantearth/stac-browser/issues/1002
 */
import { test, expect } from './fixtures.js';
import { waitForBrowserReady, waitForMapReady, getMapState } from './helpers.js';
import StaticCatalog from '../fixtures/instances/static.js';
import API from '../fixtures/instances/api.js';

function getChildMapOptions(page) {
  return page.evaluate(() => {
    let el = document.querySelector('.map-container .map');
    while (el) {
      const inst = el.__vueParentComponent;
      try {
        const options = inst?.proxy?.childrenOptions ?? inst?.ctx?.childrenOptions;
        if (options) {
          return options;
        }
      } catch {
        // Continue walking up the component tree.
      }
      el = el.parentElement;
    }
    return null;
  });
}

test.describe('Child map display options', () => {
  test('can configure previews and overviews independently', async ({ page, worker }) => {
    const api = API.minimalApi();
    const collection = api.addCollection('collection');
    api.addManyItems(collection, 2);
    await api.createServer(worker);

    await page.addInitScript(() => {
      window.STAC_BROWSER_CONFIG = {
        displayPreviewsForChildren: false,
        displayOverviewsForChildren: true,
      };
    });
    await page.goto(collection.getBrowserPath());
    await waitForBrowserReady(page);
    await waitForMapReady(page);

    await expect.poll(() => getChildMapOptions(page)).toEqual({
      displayPreview: false,
      displayOverview: true,
    });
  });
});

/**
 * Build a static catalog containing a single Item near New Zealand whose
 * footprint crosses the antimeridian. The bbox uses an eastern longitude > 180°
 * (185°), which stac-js normalizes to a west > east bbox ([175, ..., -175, ...]),
 * i.e. the RFC 7946 antimeridian-crossing form.
 */
function createAntimeridianItem() {
  const catalog = new StaticCatalog({ url: 'https://stac.example/catalog.json' });
  const item = catalog.addItem({ url: 'https://stac.example/item.json', template: 'minimal' })
    .setMetadata({ title: 'Antimeridian Item', datetime: '2025-01-01T00:00:00Z' });
  // Footprint crossing the antimeridian (longitudes 175° … 185°).
  item.data.bbox = [175, -42, 185, -37];
  item.data.geometry = {
    type: 'Polygon',
    coordinates: [[
      [175, -42],
      [185, -42],
      [185, -37],
      [175, -37],
      [175, -42],
    ]],
  };
  return { catalog, item };
}

/**
 * Build a static catalog containing a single Item with the very small
 * (~10 x 6 m) footprint reported in issue #1002. The relative deduplication
 * tolerance in stac-js < 0.5.6 collapsed the ring to fewer than 4 positions,
 * so ol-stac threw "Each LinearRing of a Polygon must have 4 or more Positions"
 * and the map stayed empty.
 */
function createTinyFootprintItem() {
  const catalog = new StaticCatalog({ url: 'https://stac.example/catalog.json' });
  const item = catalog.addItem({ url: 'https://stac.example/item.json', template: 'minimal' })
    .setMetadata({ title: 'Tiny Footprint Item', datetime: '2025-01-01T00:00:00Z' });
  item.data.bbox = [5.924529216, 50.777148292, 5.924652201, 50.77720037];
  item.data.geometry = {
    type: 'MultiPolygon',
    coordinates: [[[
      [5.924644101, 50.777198179],
      [5.924646423, 50.777190599],
      [5.924652201, 50.777171705],
      [5.924595033, 50.777150348],
      [5.924552903, 50.777148292],
      [5.924557435, 50.777193782],
      [5.924529216, 50.777193909],
      [5.924584781, 50.77720037],
      [5.924587654, 50.777191403],
      [5.924606609, 50.777193841],
      [5.924644101, 50.777198179],
    ]]],
  };
  return { catalog, item };
}

test.describe('Antimeridian-crossing item', () => {
  test('displays the footprint and zooms to the antimeridian region', async ({ page, worker }) => {
    const { catalog, item } = createAntimeridianItem();
    await catalog.createServer(worker);

    await page.goto(item.getBrowserPath());
    await waitForBrowserReady(page);

    // The map is displayed.
    await waitForMapReady(page);

    // The map fits to the item extent instead of staying at the world view.
    // Poll because the fit happens asynchronously once the layer is ready.
    await expect
      .poll(async () => (await getMapState(page))?.zoom ?? 0, { timeout: 15000 })
      .toBeGreaterThan(4);

    const view = await getMapState(page);

    // Zoomed to the antimeridian: center longitude is near ±180°, not ~0° (world view).
    expect(Math.abs(view.lon), `center longitude ${view.lon} should be near the antimeridian`)
      .toBeGreaterThan(170);
    // Centered on the item's latitude band (~-39.5°), not the equator.
    expect(view.lat).toBeGreaterThan(-45);
    expect(view.lat).toBeLessThan(-35);
  });

  test('renders the crossing footprint as a split (multi-part) geometry', async ({ page, worker }) => {
    const { catalog, item } = createAntimeridianItem();
    await catalog.createServer(worker);

    await page.goto(item.getBrowserPath());
    await waitForBrowserReady(page);
    await waitForMapReady(page);

    // ol-stac splits an antimeridian-crossing footprint into a MultiPolygon so it
    // renders on both sides of 180°. Verify the rendered footprint has two parts.
    await expect
      .poll(async () => (await getMapState(page))?.footprintPolygons ?? 0, { timeout: 15000 })
      .toBeGreaterThanOrEqual(2);
  });
});

test.describe('Very small footprint item', () => {
  test('displays the footprint and zooms to it', async ({ page, worker }) => {
    const { catalog, item } = createTinyFootprintItem();
    await catalog.createServer(worker);

    await page.goto(item.getBrowserPath());
    await waitForBrowserReady(page);
    await waitForMapReady(page);

    // The footprint renders; without the fix the layer creation throws and
    // no bounds layer (and thus no footprint) exists at all.
    await expect
      .poll(async () => (await getMapState(page))?.footprintPolygons ?? 0, { timeout: 15000 })
      .toBeGreaterThanOrEqual(1);

    // The map zooms in to the ~10 x 6 m footprint instead of staying at the world view.
    await expect
      .poll(async () => (await getMapState(page))?.zoom ?? 0, { timeout: 15000 })
      .toBeGreaterThan(10);

    const view = await getMapState(page);
    expect(view.lon).toBeGreaterThan(5.92);
    expect(view.lon).toBeLessThan(5.93);
    expect(view.lat).toBeGreaterThan(50.77);
    expect(view.lat).toBeLessThan(50.78);
  });
});

test.describe('Catalog with web map links', () => {
  function createCatalog(links = []) {
    const catalog = new StaticCatalog({ url: 'https://stac.example/catalog.json' });
    catalog.setMetadata({ title: 'Web Map Catalog', description: 'A catalog without spatial extent' });
    links.forEach(link => catalog.root.addLink(link));
    return catalog;
  }

  test('shows a map and lists the links next to it', async ({ page, worker }) => {
    const catalog = createCatalog([{
      rel: 'xyz',
      href: 'https://tiles.example/tiles/{z}/{x}/{y}.png',
      type: 'image/png',
      title: 'Tiles',
    }]);
    await catalog.createServer(worker);

    await page.goto(catalog.root.getBrowserPath());
    await waitForBrowserReady(page);
    await waitForMapReady(page);

    await expect(page.locator('.maps-preview')).toBeVisible();
    // The links move into the intro section so that they don't wrap below the map
    const links = page.locator('.meta > .intro > .links');
    await expect(links.getByRole('heading', { name: 'Additional Resources' })).toBeVisible();
    await expect(links.getByText('Tiles')).toBeVisible();
  });

  test('web map links can be shown on and hidden from the map', async ({ page, worker }) => {
    const catalog = createCatalog([1, 2].map(i => ({
      rel: 'xyz',
      href: `https://tiles${i}.example/tiles/{z}/{x}/{y}.png`,
      type: 'image/png',
      title: `Tiles ${i}`,
    })));
    await catalog.createServer(worker);

    await page.goto(catalog.root.getBrowserPath());
    await waitForBrowserReady(page);
    await waitForMapReady(page);

    const links = page.locator('.meta > .intro > .links');
    const openPopover = async (title) => {
      // Close other popovers first, they stay open while focused
      await page.getByRole('heading', { name: 'Web Map Catalog' }).click();
      await expect(page.locator('.link-more:visible')).toHaveCount(0);
      await links.getByText(title).hover();
      return page.locator('.link-more:visible');
    };

    // The first link is shown by default
    let popover = await openPopover('Tiles 1');
    await expect(popover.getByRole('button', { name: 'Hide from map' })).toBeVisible();

    popover = await openPopover('Tiles 2');
    await popover.getByRole('button', { name: 'Show on map' }).click();
    await expect(popover.getByRole('button', { name: 'Hide from map' })).toBeVisible();

    await popover.getByRole('button', { name: 'Hide from map' }).click();
    await expect(popover.getByRole('button', { name: 'Show on map' })).toBeVisible();

    popover = await openPopover('Tiles 1');
    await expect(popover.getByRole('button', { name: 'Hide from map' })).toBeVisible();
  });

  test('web map links that share a URL can be shown independently', async ({ page, worker }) => {
    const catalog = createCatalog(['a', 'b'].map(layer => ({
      rel: 'wms',
      href: 'https://wms.example/service',
      type: 'image/png',
      title: `Layer ${layer}`,
      'wms:layers': [layer],
    })));
    await catalog.createServer(worker);

    await page.goto(catalog.root.getBrowserPath());
    await waitForBrowserReady(page);
    await waitForMapReady(page);

    const links = page.locator('.meta > .intro > .links');
    // The first link is shown by default, the second one isn't
    await links.getByText('Layer a').hover();
    await expect(page.locator('.link-more:visible').getByRole('button', { name: 'Hide from map' })).toBeVisible();
    await page.getByRole('heading', { name: 'Web Map Catalog' }).click();
    await links.getByText('Layer b').hover();
    await expect(page.locator('.link-more:visible').getByRole('button', { name: 'Show on map' })).toBeVisible();
  });

  test('a single web map link can be removed in the layer switcher', async ({ page, worker }) => {
    const catalog = createCatalog([{
      rel: 'xyz',
      href: 'https://tiles.example/tiles/{z}/{x}/{y}.png',
      type: 'image/png',
      title: 'Tiles',
    }]);
    await catalog.createServer(worker);

    await page.goto(catalog.root.getBrowserPath());
    await waitForBrowserReady(page);
    await waitForMapReady(page);

    await page.locator('.ol-layercontrol button').click();
    const layerControl = page.locator('.layercontrol');
    await expect(layerControl.locator('.title', { hasText: 'Tiles' })).toBeVisible();
    await layerControl.getByRole('button', { name: 'Hide from map' }).click();
    await expect(layerControl.locator('.title', { hasText: 'Tiles' })).toHaveCount(0);
  });

  test('shows no map without web map links', async ({ page, worker }) => {
    const catalog = createCatalog();
    await catalog.createServer(worker);

    await page.goto(catalog.root.getBrowserPath());
    await waitForBrowserReady(page);

    await expect(page.getByRole('heading', { name: 'Web Map Catalog' })).toBeVisible();
    await expect(page.locator('.maps-preview')).toHaveCount(0);
  });
});
