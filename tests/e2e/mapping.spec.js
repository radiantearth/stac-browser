/**
 * Antimeridian handling tests.
 *
 * Verifies that a STAC Item whose footprint crosses the antimeridian (180°/-180°)
 * is both displayed on the map and zoomed to correctly, rather than falling back
 * to a world view. See https://github.com/radiantearth/stac-browser/issues/736
 */
import { test, expect } from './fixtures.js';
import { waitForBrowserReady, waitForMapReady, getMapState } from './helpers.js';
import StaticCatalog from '../fixtures/instances/static.js';

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
