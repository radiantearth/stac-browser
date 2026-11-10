/**
 * Browser paths of a configured catalog that start with a reserved route
 * (e.g. validation or external) get the /browse prefix so that they don't
 * open the wrong view.
 */
import { test, expect } from './fixtures.js';
import { configureBrowser, waitForBrowserReady } from './helpers.js';
import StaticCatalog from '../fixtures/instances/static.js';

const MAIN_URL = 'https://main.example/catalog.json';

const CHILDREN = [
  { url: 'validation/collection.json', title: 'Validation Folder', path: '/browse/validation/collection.json' },
  { url: 'external/foo/collection.json', title: 'External Folder', path: '/browse/external/foo/collection.json' },
  { url: 'browse/collection.json', title: 'Browse Folder', path: '/browse/browse/collection.json' },
  { url: 'products/collection.json', title: 'Products Folder', path: '/products/collection.json' }
];

async function setup(page, worker) {
  const catalog = new StaticCatalog({ url: MAIN_URL });
  catalog.setMetadata({ title: 'Main Catalog' });
  for (const child of CHILDREN) {
    catalog.addCollection({ url: child.url }).setMetadata({ id: child.title.toLowerCase().replace(' ', '-'), title: child.title });
  }
  await catalog.createServer(worker);
  await configureBrowser(page, { catalogUrl: MAIN_URL });
}

test.describe('Reserved browser paths', () => {
  test('links to children in reserved folders get the /browse prefix', async ({ page, worker }) => {
    await setup(page, worker);
    await page.goto('/');
    await waitForBrowserReady(page);

    await Promise.all(CHILDREN.map(child => expect(page.locator(`a[href="${child.path}"]`).first()).toBeVisible()));
  });

  for (const child of CHILDREN) {
    test(`opens ${child.path} in the browse view`, async ({ page, worker }) => {
      await setup(page, worker);
      await page.goto(child.path);
      await waitForBrowserReady(page);

      await expect(page.getByRole('heading', { name: child.title })).toBeVisible();
      await expect(page).toHaveURL(url => url.pathname === child.path);
    });
  }

  test('navigates from the root to an escaped child and back', async ({ page, worker }) => {
    await setup(page, worker);
    await page.goto('/');
    await waitForBrowserReady(page);

    await page.locator('a[href="/browse/validation/collection.json"]').first().click();
    await expect(page).toHaveURL(url => url.pathname === '/browse/validation/collection.json');
    await expect(page.getByRole('heading', { name: 'Validation Folder' })).toBeVisible();

    await page.goBack();
    await expect(page.getByRole('heading', { name: 'Main Catalog' })).toBeVisible();
  });

  test('opens /browse/ as the root catalog', async ({ page, worker }) => {
    await setup(page, worker);
    await page.goto('/browse/');
    await waitForBrowserReady(page);

    await expect(page.getByRole('heading', { name: 'Main Catalog' })).toBeVisible();
  });
});
