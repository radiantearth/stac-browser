/**
 * Favorites tests.
 *
 * Verifies marking catalogs, collections and items as favorites via the
 * toggle button, the Favorites page (listing, removal, local-only notice),
 * persistence in local storage, and the export/import round-trip.
 */
import { test, expect } from './fixtures.js';
import { configureBrowser, waitForBrowserReady } from './helpers.js';
import StaticCatalog from '../fixtures/instances/static.js';
import { Buffer } from 'node:buffer';
import fs from 'node:fs';

function createStaticCatalog() {
  const catalog = new StaticCatalog({ url: 'https://stac.example/catalog.json' });
  catalog.setMetadata({ title: 'Example Catalog' });
  const collection = catalog.addCollection({ url: 'https://stac.example/collection.json' })
    .setMetadata({ title: 'Example Collection' });
  const item = collection.addItem({ url: 'https://stac.example/item.json' })
    .setMetadata({ title: 'Example Item' });
  return { catalog, collection, item };
}

// The favorite toggle button on the page of a catalog, collection or item
const favoriteToggle = page => page.getByRole('button', { name: 'Favorite', exact: true });
// The Favorites page button in the header
const favoritesNav = page => page.locator('header').getByRole('button', { name: 'Favorites' });

// Exports the favorites in the given format and returns the download
async function exportAs(page, format) {
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export' }).click();
  await page.locator('.dropdown-menu.show').getByText(format, { exact: true }).click();
  return await downloadPromise;
}

// Favorites the given collection and opens the Favorites page
async function favoriteAndOpenFavorites(page, collection) {
  await page.goto(collection.getBrowserPath());
  await waitForBrowserReady(page);
  await favoriteToggle(page).click();
  await expect(favoriteToggle(page)).toHaveAttribute('aria-pressed', 'true');
  await favoritesNav(page).click();
}

test.describe('Favorites', () => {
  test('add and remove favorites, list them on the Favorites page', async ({ page, worker }) => {
    const { catalog, collection, item } = createStaticCatalog();
    await catalog.createServer(worker);

    // Favorite the collection
    await page.goto(collection.getBrowserPath());
    await waitForBrowserReady(page);
    const toggle = favoriteToggle(page);
    await expect(toggle).toBeVisible();
    await expect(toggle).toHaveAttribute('aria-pressed', 'false');
    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-pressed', 'true');

    // Favorite the item
    await page.goto(item.getBrowserPath());
    await waitForBrowserReady(page);
    await favoriteToggle(page).click();
    await expect(favoriteToggle(page)).toHaveAttribute('aria-pressed', 'true');

    // Open the Favorites page from the header
    await favoritesNav(page).click();
    await expect(page.getByText(/favorites are stored only locally/i)).toBeVisible();
    await expect(page.getByRole('link', { name: 'Example Collection' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Example Item' })).toBeVisible();

    // Favorites persist across a page reload (stored in local storage)
    await page.reload();
    await expect(page.getByRole('link', { name: 'Example Collection' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Example Item' })).toBeVisible();

    // Remove both favorites from the Favorites page
    const removeButtons = page.getByRole('button', { name: /remove from favorites/i });
    await expect(removeButtons).toHaveCount(2);
    await removeButtons.first().click();
    await expect(removeButtons).toHaveCount(1);
    await removeButtons.first().click();
    await expect(page.getByText(/no favorites have been added yet/i)).toBeVisible();
  });

  test('un-favorite via the toggle button', async ({ page, worker }) => {
    const { catalog } = createStaticCatalog();
    await catalog.createServer(worker);

    await page.goto(catalog.root.getBrowserPath());
    await waitForBrowserReady(page);
    const toggle = favoriteToggle(page);
    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-pressed', 'true');
    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-pressed', 'false');

    await favoritesNav(page).click();
    await expect(page.getByText(/no favorites have been added yet/i)).toBeVisible();
  });

  test('export and import favorites', async ({ page, worker }) => {
    const { catalog, collection } = createStaticCatalog();
    await catalog.createServer(worker);
    await favoriteAndOpenFavorites(page, collection);

    // Export the favorites to a JSON file
    const download = await exportAs(page, 'JSON');
    expect(download.suggestedFilename()).toBe('stac-browser-favorites.json');
    const exported = JSON.parse(fs.readFileSync(await download.path(), 'utf-8'));
    expect(exported).toEqual([{
      href: collection.getAbsoluteUrl(),
      title: 'Example Collection',
      type: 'Collection'
    }]);

    // Remove the favorite, then import the exported file again
    await page.getByRole('button', { name: /remove from favorites/i }).click();
    await expect(page.getByText(/no favorites have been added yet/i)).toBeVisible();
    await page.locator('input[type="file"]').setInputFiles({
      name: 'stac-browser-favorites.json',
      mimeType: 'application/json',
      buffer: Buffer.from(JSON.stringify(exported))
    });
    await expect(page.getByText(/1 new favorites were imported/)).toBeVisible();
    await expect(page.getByRole('link', { name: 'Example Collection' })).toBeVisible();

    // Importing the same file again does not add duplicates
    await page.locator('input[type="file"]').setInputFiles({
      name: 'stac-browser-favorites.json',
      mimeType: 'application/json',
      buffer: Buffer.from(JSON.stringify(exported))
    });
    await expect(page.getByText(/0 new favorites were imported/)).toBeVisible();
    await expect(page.getByRole('link', { name: 'Example Collection' })).toHaveCount(1);
  });

  test('export and import favorites as CSV', async ({ page, worker }) => {
    const { catalog, collection } = createStaticCatalog();
    await catalog.createServer(worker);
    await favoriteAndOpenFavorites(page, collection);

    // Export the favorites to a CSV file
    const download = await exportAs(page, 'CSV');
    expect(download.suggestedFilename()).toBe('stac-browser-favorites.csv');
    const csv = fs.readFileSync(await download.path(), 'utf-8');
    expect(csv).toBe(`href,title,type\r\n${collection.getAbsoluteUrl()},Example Collection,Collection`);

    // Remove the favorite, then import the exported file again
    await page.getByRole('button', { name: /remove from favorites/i }).click();
    await expect(page.getByText(/no favorites have been added yet/i)).toBeVisible();
    await page.locator('input[type="file"]').setInputFiles({
      name: 'stac-browser-favorites.csv',
      mimeType: 'text/csv',
      buffer: Buffer.from(csv)
    });
    await expect(page.getByText(/1 new favorites were imported/)).toBeVisible();
    await expect(page.getByRole('link', { name: 'Example Collection' })).toBeVisible();
  });

  test('export and import favorites as CSV for Excel', async ({ page, worker }) => {
    const { catalog } = createStaticCatalog();
    const special = catalog.addCollection({ url: 'https://stac.example/special.json' })
      .setMetadata({ title: 'Special; Title with "quotes"' });
    await catalog.createServer(worker);
    await favoriteAndOpenFavorites(page, special);

    // Export the favorites to a CSV file for Excel
    const download = await exportAs(page, 'Excel');
    expect(download.suggestedFilename()).toBe('stac-browser-favorites.csv');
    const csv = fs.readFileSync(await download.path(), 'utf-8');
    // Starts with a BOM and escapes the ; separator through quoting
    expect(csv.charCodeAt(0)).toBe(0xFEFF);
    expect(csv.slice(1)).toBe(`href;title;type\r\n${special.getAbsoluteUrl()};"Special; Title with ""quotes""";Collection`);

    // Remove the favorite, then import the exported file again
    await page.getByRole('button', { name: /remove from favorites/i }).click();
    await expect(page.getByText(/no favorites have been added yet/i)).toBeVisible();
    await page.locator('input[type="file"]').setInputFiles({
      name: 'stac-browser-favorites.csv',
      mimeType: 'text/csv',
      buffer: Buffer.from(csv)
    });
    await expect(page.getByText(/1 new favorites were imported/)).toBeVisible();
    await expect(page.getByRole('link', { name: 'Special; Title with "quotes"' })).toBeVisible();
  });

  test('importing does not create duplicates', async ({ page, worker }) => {
    const { catalog, collection } = createStaticCatalog();
    await catalog.createServer(worker);
    await favoriteAndOpenFavorites(page, collection);

    // A file that contains an existing favorite and the same new entry twice
    const data = [
      { href: collection.getAbsoluteUrl(), title: 'Example Collection', type: 'Collection' },
      { href: 'https://stac.example/new.json', title: 'New Collection', type: 'Collection' },
      { href: 'https://stac.example/new.json', title: 'New Collection', type: 'Collection' }
    ];
    await page.locator('input[type="file"]').setInputFiles({
      name: 'stac-browser-favorites.json',
      mimeType: 'application/json',
      buffer: Buffer.from(JSON.stringify(data))
    });
    // Existing favorites and duplicates within the file are skipped
    await expect(page.getByText(/1 new favorites were imported/)).toBeVisible();
    await expect(page.getByRole('link', { name: 'New Collection' })).toHaveCount(1);
    await expect(page.getByRole('link', { name: 'Example Collection' })).toHaveCount(1);
  });

  test('export and import favorites as STAC Catalog', async ({ page, worker }) => {
    const { catalog, collection } = createStaticCatalog();
    await catalog.createServer(worker);
    await favoriteAndOpenFavorites(page, collection);

    // Export the favorites to a STAC Catalog
    const download = await exportAs(page, 'STAC Catalog');
    expect(download.suggestedFilename()).toBe('catalog.json');
    const exported = JSON.parse(fs.readFileSync(await download.path(), 'utf-8'));
    expect(exported.type).toBe('Catalog');
    expect(exported.stac_version).toBe('1.1.0');
    expect(exported.links).toEqual([{
      rel: 'child',
      href: collection.getAbsoluteUrl(),
      type: 'application/json',
      stac_type: 'Collection',
      title: 'Example Collection'
    }]);

    // Remove the favorite, then import the exported file again
    await page.getByRole('button', { name: /remove from favorites/i }).click();
    await expect(page.getByText(/no favorites have been added yet/i)).toBeVisible();
    await page.locator('input[type="file"]').setInputFiles({
      name: 'catalog.json',
      mimeType: 'application/json',
      buffer: Buffer.from(JSON.stringify(exported))
    });
    await expect(page.getByText(/1 new favorites were imported/)).toBeVisible();
    await expect(page.getByRole('link', { name: 'Example Collection' })).toBeVisible();

    // The type survives the round trip through stac_type
    const reexport = await exportAs(page, 'JSON');
    const favorites = JSON.parse(fs.readFileSync(await reexport.path(), 'utf-8'));
    expect(favorites).toEqual([{
      href: collection.getAbsoluteUrl(),
      title: 'Example Collection',
      type: 'Collection'
    }]);
  });

  test('favorites are sorted by title', async ({ page, worker }) => {
    const { catalog, collection } = createStaticCatalog();
    const another = catalog.addCollection({ url: 'https://stac.example/another.json' })
      .setMetadata({ title: 'Another Collection' });
    await catalog.createServer(worker);

    // Favorite both collections, "Example Collection" first
    await page.goto(collection.getBrowserPath());
    await waitForBrowserReady(page);
    await favoriteToggle(page).click();
    await expect(favoriteToggle(page)).toHaveAttribute('aria-pressed', 'true');

    await page.goto(another.getBrowserPath());
    await waitForBrowserReady(page);
    await favoriteToggle(page).click();
    await expect(favoriteToggle(page)).toHaveAttribute('aria-pressed', 'true');

    // Shown in alphabetical order, not in the order they were added
    await favoritesNav(page).click();
    const titles = page.locator('.catalogs .card-title');
    await expect(titles).toHaveText(['Another Collection', 'Example Collection']);
  });

  test('external favorites are hidden when external access is not allowed', async ({ page, worker }) => {
    const { catalog, collection } = createStaticCatalog();
    await catalog.createServer(worker);

    await configureBrowser(page, {
      catalogUrl: catalog.root.getAbsoluteUrl(),
      allowExternalAccess: false
    });
    // Seed the stored favorites before the app boots, using the storage
    // format of BrowserStorage (JSON prefixed with the JSON indicator)
    await page.addInitScript(favorites => {
      window.localStorage.setItem('favorites', '\n\r' + JSON.stringify(favorites));
    }, [
      { href: collection.getAbsoluteUrl(), title: 'Example Collection', type: 'Collection' },
      { href: 'https://other.example/external.json', title: 'External Collection', type: 'Collection' }
    ]);

    await page.goto('/favorites');
    await expect(page.getByRole('link', { name: 'Example Collection' })).toBeVisible();
    await expect(page.getByText('External Collection')).toHaveCount(0);
  });

  test('favorites are not available when disabled in the config', async ({ page, worker }) => {
    const { catalog } = createStaticCatalog();
    await catalog.createServer(worker);
    await configureBrowser(page, { showFavorites: false });

    await page.goto(catalog.root.getBrowserPath());
    await waitForBrowserReady(page);
    await expect(favoriteToggle(page)).toHaveCount(0);
    await expect(favoritesNav(page)).toHaveCount(0);

    // The route is not registered, so the Favorites page can't be opened directly
    await page.goto('/favorites');
    await expect(page.locator('main.favorites')).toHaveCount(0);
  });

  test('importing an invalid file shows an error', async ({ page, worker }) => {
    const { catalog } = createStaticCatalog();
    await catalog.createServer(worker);

    await page.goto(catalog.root.getBrowserPath());
    await waitForBrowserReady(page);
    await favoritesNav(page).click();
    await page.locator('input[type="file"]').setInputFiles({
      name: 'invalid.json',
      mimeType: 'application/json',
      buffer: Buffer.from('not json')
    });
    await expect(page.getByText(/the selected file does not contain favorites/i)).toBeVisible();
  });
});
