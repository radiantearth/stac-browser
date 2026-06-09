/**
 * Asset display and interaction tests.
 *
 * Tests asset accordion, format badges, help links, and download functionality.
 */
import { test, expect } from './fixtures.js';
import { waitForBrowserReady } from './helpers.js';
import StaticCatalog from '../fixtures/instances/static.js';

test.describe.skip('Asset operations', () => {
  function createCatalogWithAssets() {
    const catalog = new StaticCatalog({ url: 'https://stac.example/catalog.json' });
    const collection = catalog.addCollection({ url: 'https://stac.example/collection.json' });

    const item = collection.addItem({ url: 'https://stac.example/item.json' })
      .setMetadata({ title: 'Test Item', datetime: '2025-01-01T00:00:00Z' });

    // Add GeoParquet asset
    item.data.assets.geoparquet = {
      href: 'https://stac.example/data.parquet',
      type: 'application/vnd.apache.parquet',
      roles: ['data'],
      title: 'GeoParquet Data'
    };

    // Add COG asset
    item.data.assets.cog = {
      href: 'https://stac.example/image.tif',
      type: 'image/tiff; application=geotiff; profile=cloud-optimized',
      roles: ['data'],
      title: 'Cloud Optimized GeoTIFF'
    };

    // Add regular GeoJSON asset (no help link expected)
    item.data.assets.geojson = {
      href: 'https://stac.example/data.geojson',
      type: 'application/geo+json',
      roles: ['data'],
      title: 'GeoJSON Data'
    };

    return { catalog, collection, item };
  }

  test('should display asset accordion', async ({ page, worker }) => {
    const { catalog, item } = createCatalogWithAssets();
    await catalog.createServer(worker);

    await page.goto(item.getBrowserPath());
    await waitForBrowserReady(page);

    // Verify assets section exists
    await expect(page.getByText('GeoParquet Data')).toBeVisible();
    await expect(page.getByText('Cloud Optimized GeoTIFF')).toBeVisible();
    await expect(page.getByText('GeoJSON Data')).toBeVisible();
  });

  test('should display format badges', async ({ page, worker }) => {
    const { catalog, item } = createCatalogWithAssets();
    await catalog.createServer(worker);

    await page.goto(item.getBrowserPath());
    await waitForBrowserReady(page);

    // Check for format badges in the asset titles
    await expect(page.locator('.asset .format')).toHaveCount(3);
  });

  test('should show format help link for GeoParquet assets', async ({ page, worker }) => {
    const { catalog, item } = createCatalogWithAssets();
    await catalog.createServer(worker);

    await page.goto(item.getBrowserPath());
    await waitForBrowserReady(page);

    // Find the GeoParquet asset section and check for help link
    const geoparquetAsset = page.locator('.asset:has-text("GeoParquet Data")');
    const helpLink = geoparquetAsset.locator('.format-help');

    await expect(helpLink).toBeVisible();
    await expect(helpLink).toHaveAttribute('href', 'https://github.com/portolan-sdi/geoparquet-io');
    await expect(helpLink).toHaveAttribute('target', '_blank');
  });

  test('should show format help link for COG assets', async ({ page, worker }) => {
    const { catalog, item } = createCatalogWithAssets();
    await catalog.createServer(worker);

    await page.goto(item.getBrowserPath());
    await waitForBrowserReady(page);

    // Find the COG asset section and check for help link
    const cogAsset = page.locator('.asset:has-text("Cloud Optimized GeoTIFF")');
    const helpLink = cogAsset.locator('.format-help');

    await expect(helpLink).toBeVisible();
    await expect(helpLink).toHaveAttribute('href', 'https://github.com/cogeotiff/rio-cogeo');
  });

  test('should not show format help link for regular formats', async ({ page, worker }) => {
    const { catalog, item } = createCatalogWithAssets();
    await catalog.createServer(worker);

    await page.goto(item.getBrowserPath());
    await waitForBrowserReady(page);

    // GeoJSON asset should not have a help link
    const geojsonAsset = page.locator('.asset:has-text("GeoJSON Data")');
    const helpLink = geojsonAsset.locator('.format-help');

    await expect(helpLink).toHaveCount(0);
  });

  test('should expand asset accordion on click', async ({ page, worker }) => {
    const { catalog, item } = createCatalogWithAssets();
    await catalog.createServer(worker);

    await page.goto(item.getBrowserPath());
    await waitForBrowserReady(page);

    // Click on an asset to expand it
    const assetTitle = page.locator('.asset:has-text("GeoParquet Data") .title');
    await assetTitle.click();

    // Check that asset body is now visible
    const assetBody = page.locator('.asset:has-text("GeoParquet Data") .asset-body');
    await expect(assetBody).toBeVisible();
  });

  test('should show download button in expanded asset', async ({ page, worker }) => {
    const { catalog, item } = createCatalogWithAssets();
    await catalog.createServer(worker);

    await page.goto(item.getBrowserPath());
    await waitForBrowserReady(page);

    // Expand an asset
    const assetTitle = page.locator('.asset:has-text("GeoParquet Data") .title');
    await assetTitle.click();

    // Check for download button
    const downloadBtn = page.locator('.asset:has-text("GeoParquet Data")').getByRole('link', { name: /download/i });
    await expect(downloadBtn).toBeVisible();
  });

  test('should show copy URL button in expanded asset', async ({ page, worker }) => {
    const { catalog, item } = createCatalogWithAssets();
    await catalog.createServer(worker);

    await page.goto(item.getBrowserPath());
    await waitForBrowserReady(page);

    // Expand an asset
    const assetTitle = page.locator('.asset:has-text("GeoParquet Data") .title');
    await assetTitle.click();

    // Check for copy URL button
    const copyBtn = page.locator('.asset:has-text("GeoParquet Data")').getByRole('button', { name: /copy/i });
    await expect(copyBtn).toBeVisible();
  });
});
