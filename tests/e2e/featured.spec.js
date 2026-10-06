/**
 * Placement of the Featured widget: it only shows on the root catalog and on the frontpage,
 * regardless of the hook it is placed in (see tests/e2e/widgets.config.js).
 */
import { test, expect } from './fixtures.js';
import { configureBrowser, waitForBrowserReady } from './helpers.js';
import StaticCatalog from '../fixtures/instances/static.js';

const MAIN_URL = 'https://main.example/catalog.json';

async function setup(page, worker, hooks, config = {}) {
  const catalog = new StaticCatalog({ url: MAIN_URL });
  catalog.setMetadata({ title: 'Main Catalog' });
  catalog.addCollection({ url: 'products/collection.json' }).setMetadata({ id: 'products', title: 'Products' });
  catalog.addCatalog({ url: 'sub/catalog.json' }).setMetadata({ id: 'sub', title: 'Sub Catalog' });
  await catalog.createServer(worker);
  await configureBrowser(page, { catalogUrl: MAIN_URL, ...config });
  await page.addInitScript(enabled => { window.E2E_WIDGET_HOOKS = enabled; }, hooks);
}

const heading = page => page.locator('header h1');
const featured = (page, hook) => page.locator('.featured', { hasText: `Featured in ${hook}` });

async function open(page, path, title) {
  await page.goto(path);
  await waitForBrowserReady(page);
  await expect(heading(page)).toHaveText(title);
}

test.describe('Featured widget', () => {
  test('shows in the collection overview of the root catalog only', async ({ page, worker }) => {
    const hook = 'view-catalog-catalogs-start';
    await setup(page, worker, [hook]);

    await open(page, '/', 'Main Catalog');
    await expect(featured(page, hook).locator('a[href="/products/collection.json"]').first()).toBeVisible();

    await open(page, '/sub/catalog.json', 'Sub Catalog');
    await expect(page.locator('.featured')).toHaveCount(0);

    await open(page, '/products/collection.json', 'Products');
    await expect(page.locator('.featured')).toHaveCount(0);
  });

  test('shows in global hooks on the root catalog only', async ({ page, worker }) => {
    const hook = 'root-before-content';
    await setup(page, worker, [hook], {
      pages: { about: { title: 'About', content: 'About us' } },
      frontpage: null
    });

    await open(page, '/', 'Main Catalog');
    await expect(featured(page, hook)).toBeVisible();

    await open(page, '/sub/catalog.json', 'Sub Catalog');
    await expect(page.locator('.featured')).toHaveCount(0);

    await open(page, '/pages/about', 'About');
    await expect(page.locator('.featured')).toHaveCount(0);

    await open(page, '/favorites', 'Favorites');
    await expect(page.locator('.featured')).toHaveCount(0);

    await page.goto('/search');
    await waitForBrowserReady(page);
    await expect(page.locator('.featured')).toHaveCount(0);
  });

  test('shows in the frontpage hooks', async ({ page, worker }) => {
    const hook = 'frontpage-start';
    await setup(page, worker, [hook, 'root-before-content'], {
      frontpage: { title: 'Welcome', content: 'Hello' }
    });

    await open(page, '/', 'Welcome');
    await expect(featured(page, hook).locator('a[href="/products/collection.json"]').first()).toBeVisible();
    // Global hooks are not part of the frontpage
    await expect(featured(page, 'root-before-content')).toHaveCount(0);

    await open(page, '/browse/', 'Main Catalog');
    await expect(featured(page, hook)).toHaveCount(0);
    await expect(featured(page, 'root-before-content')).toBeVisible();
  });

  test('does not show on custom pages', async ({ page, worker }) => {
    await setup(page, worker, [], {
      pages: {
        about: {
          title: 'About',
          widgets: [
            { id: 'CustomText', props: { text: 'About us' } },
            { id: 'Featured', props: { entities: ['products/collection.json'] } }
          ]
        }
      }
    });

    await open(page, '/pages/about', 'About');
    await expect(page.getByText('About us')).toBeVisible();
    await expect(page.locator('.featured')).toHaveCount(0);
  });
});
