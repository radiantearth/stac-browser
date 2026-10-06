/**
 * Custom frontpage (see docs/pages.md#frontpage), defined via the runtime `frontpage` option.
 */
import { test, expect } from './fixtures.js';
import { configureBrowser, mockStacResource, waitForBrowserReady } from './helpers.js';
import StaticCatalog from '../fixtures/instances/static.js';
import fs from 'fs';

const catalogs = JSON.parse(fs.readFileSync(
  new URL('../fixtures/templates/catalogs.json', import.meta.url), 'utf-8'
));

const MAIN_URL = 'https://main.example/catalog.json';

const FRONTPAGE = {
  title: { en: 'Welcome', de: 'Willkommen' },
  widgets: [
    { id: 'CustomText', props: { text: 'Hello from the frontpage' } },
    { id: 'Featured', props: { entities: ['products/collection.json'], title: 'Highlights' } }
  ]
};

async function setup(page, worker, overrides = {}) {
  const catalog = new StaticCatalog({ url: MAIN_URL });
  catalog.setMetadata({ title: 'Main Catalog' });
  catalog.addCollection({ url: 'products/collection.json' }).setMetadata({ id: 'products', title: 'Products' });
  await catalog.createServer(worker);
  await configureBrowser(page, { catalogUrl: MAIN_URL, frontpage: FRONTPAGE, ...overrides });
}

const heading = page => page.locator('header h1');

test.describe('Frontpage with a catalogUrl', () => {
  test('shows the frontpage and moves the root catalog to /browse/', async ({ page, worker }) => {
    await setup(page, worker);
    await page.goto('/');
    await waitForBrowserReady(page);

    await expect(heading(page)).toHaveText('Welcome');
    await expect(page.getByText('Hello from the frontpage')).toBeVisible();
    await expect(page.locator('header .site .title a')).toHaveAttribute('href', '/');

    await page.goto('/browse/');
    await waitForBrowserReady(page);
    await expect(heading(page)).toHaveText('Main Catalog');
    await expect(page.locator('a[href="/products/collection.json"]').first()).toBeVisible();

    await page.goto('/products/collection.json');
    await waitForBrowserReady(page);
    await expect(heading(page)).toHaveText('Products');
    await expect(page.locator('header a[href="/browse/"]').first()).toBeVisible();
  });

  test('shows featured entities on the frontpage', async ({ page, worker }) => {
    await setup(page, worker);
    await page.goto('/');
    await waitForBrowserReady(page);

    const featured = page.locator('.featured');
    await expect(featured.getByText('Highlights')).toBeVisible();
    await featured.locator('a[href="/products/collection.json"]').first().click();
    await expect(page).toHaveURL(url => url.pathname === '/products/collection.json');
    await expect(heading(page)).toHaveText('Products');
  });

  test('uses the catalog title if the frontpage has no title', async ({ page, worker }) => {
    await setup(page, worker, { frontpage: { content: 'Just Markdown' } });
    await page.goto('/');
    await waitForBrowserReady(page);

    await expect(page.getByText('Just Markdown')).toBeVisible();
    await expect(heading(page)).toHaveText('Main Catalog');
  });

  test('shows the root catalog if the condition is not met', async ({ page, worker }) => {
    await setup(page, worker, { frontpage: null });
    await page.addInitScript(() => {
      window.STAC_BROWSER_CONFIG.frontpage = {
        title: 'Only in German',
        content: 'Hallo',
        condition: ({ state }) => state.uiLanguage === 'de'
      };
    });
    await page.goto('/');
    await waitForBrowserReady(page);

    await expect(heading(page)).toHaveText('Main Catalog');
    await expect(page.getByText('Hallo')).toHaveCount(0);

    await page.goto('/products/collection.json');
    await waitForBrowserReady(page);
    await expect(page.locator('header a[href="/"]').first()).toBeVisible();
    await expect(page.locator('header a[href="/browse/"]')).toHaveCount(0);
  });
});

test.describe('Frontpage without a catalogUrl', () => {
  test('can contain the data source selection', async ({ page, worker }) => {
    await mockStacResource(worker, 'https://stacindex.org/api/catalogs', catalogs);
    await configureBrowser(page, {
      frontpage: {
        title: 'Pick a catalog',
        widgets: [
          { id: 'CustomText', props: { text: 'Choose wisely' } },
          { id: 'SelectDataSource' }
        ]
      }
    });
    await page.goto('/');
    await waitForBrowserReady(page);

    await expect(heading(page)).toHaveText('Pick a catalog');
    await expect(page.getByText('Choose wisely')).toBeVisible();
    await expect(page.locator('.stac-index button').first()).toBeVisible();
  });

  test('switches from the default to the custom frontpage when the condition is met', async ({ page, worker }) => {
    await mockStacResource(worker, 'https://stacindex.org/api/catalogs', catalogs);
    await configureBrowser(page, { detectLocaleFromBrowser: false, storeLocale: false });
    await page.addInitScript(() => {
      window.STAC_BROWSER_CONFIG.frontpage = {
        title: 'Willkommen',
        widgets: [{ id: 'CustomText', props: { text: 'Nur auf Deutsch' } }],
        condition: ({ state }) => state.uiLanguage === 'de'
      };
    });
    await page.goto('/');
    await waitForBrowserReady(page);
    await expect(page.locator('.stac-index button').first()).toBeVisible();

    await page.evaluate(() => {
      const store = document.querySelector('[data-v-app]').__vue_app__.config.globalProperties.$store;
      return store.dispatch('switchLocale', { locale: 'de' });
    });

    await expect(heading(page)).toHaveText('Willkommen');
    await expect(page.getByText('Nur auf Deutsch')).toBeVisible();
    await expect(page.locator('.select-data-source')).toHaveCount(0);
  });
});
