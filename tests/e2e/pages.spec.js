/**
 * Custom pages (see docs/pages.md), defined via the runtime `pages` option.
 */
import { test, expect } from './fixtures.js';
import { http, HttpResponse } from 'msw';
import { configureBrowser, waitForBrowserReady } from './helpers.js';

const PAGES = {
  imprint: {
    title: { en: 'Imprint', de: 'Impressum' },
    description: 'Legal information about the operator',
    content: {
      en: '# Operator\n\nExample Org, see also the [privacy policy](page:privacy).',
      de: '# Betreiber\n\nExample Org'
    },
    footer: true
  },
  privacy: {
    title: 'Privacy',
    content: 'We collect no data.',
    menu: true
  },
  remote: {
    title: 'Remote',
    url: 'https://docs.example/remote.md'
  },
  broken: {
    title: 'Broken',
    url: 'https://docs.example/missing.md'
  }
};

async function setup(page, overrides = {}) {
  await configureBrowser(page, { pages: PAGES, detectLocaleFromBrowser: false, storeLocale: false, ...overrides });
}

const heading = page => page.locator('header h1');

test.describe('Custom pages', () => {
  test('renders a Markdown page with title and description', async ({ page }) => {
    await setup(page);
    await page.goto('/pages/imprint');
    await waitForBrowserReady(page);

    await expect(heading(page)).toHaveText('Imprint');
    await expect(page.locator('main.custom-page h1')).toHaveText('Operator');
    await expect(page).toHaveTitle(/Imprint/);
    await expect(page.locator('#meta-description')).toHaveAttribute('content', 'Legal information about the operator');
  });

  test('uses the localized title and content', async ({ page }) => {
    await setup(page, { locale: 'de' });
    await page.goto('/pages/imprint');
    await waitForBrowserReady(page);

    await expect(heading(page)).toHaveText('Impressum');
    await expect(page.locator('main.custom-page h1')).toHaveText('Betreiber');
  });

  for (const path of ['/pages/unknown', '/pages/imprint/sub', '/pages/toString']) {
    test(`shows an error for the unknown page ${path}`, async ({ page }) => {
      await setup(page);
      await page.goto(path);
      await waitForBrowserReady(page);
      await expect(page.getByText('The requested page does not exist.')).toBeVisible();
    });
  }

  test('loads the content from a URL', async ({ page, worker }) => {
    await worker.use(
      http.get('https://docs.example/remote.md', () => HttpResponse.text('Content from **remote**')),
      http.get('https://docs.example/missing.md', () => new HttpResponse(null, { status: 404 }))
    );
    await setup(page);

    await page.goto('/pages/remote');
    await waitForBrowserReady(page);
    await expect(page.locator('main.custom-page strong')).toHaveText('remote');

    await page.goto('/pages/broken');
    await waitForBrowserReady(page);
    await expect(page.getByText('The content of the page could not be loaded.')).toBeVisible();
  });

  test('links pages in the footer', async ({ page }) => {
    await setup(page, {
      footerLinks: [
        { page: 'privacy' },
        { page: 'imprint', label: 'Legal' },
        { page: 'unknown' },
        { label: 'Docs', url: 'https://example.com/docs' }
      ]
    });
    await page.goto('/pages/privacy');
    await waitForBrowserReady(page);

    const links = page.locator('footer .footer-links a');
    await expect(links).toHaveText(['Privacy', 'Legal', 'Docs']);
    await expect(links.nth(2)).toHaveAttribute('target', '_blank');

    await links.nth(1).click();
    await expect(page).toHaveURL(/\/pages\/imprint$/);
    await expect(heading(page)).toHaveText('Imprint');
  });

  test('adds pages to the footer and the header menu', async ({ page }) => {
    await setup(page);
    await page.goto('/pages/imprint');
    await waitForBrowserReady(page);

    await expect(page.locator('footer .footer-links a')).toHaveText(['Imprint']);

    const menuButton = page.locator('header nav.navigation a[href="/pages/privacy"]');
    await menuButton.click();
    await expect(page).toHaveURL(/\/pages\/privacy$/);
    await expect(heading(page)).toHaveText('Privacy');
    await expect(page.locator('main.custom-page')).toHaveText('We collect no data.');
    // The description of the previous page must not remain in the metadata
    await expect(page.locator('#meta-description')).toHaveAttribute('content', '');
    await expect(page.locator('#og-description')).toHaveAttribute('content', '');
  });

  test('follows page: links in Markdown without reloading', async ({ page }) => {
    await setup(page);
    await page.goto('/pages/imprint');
    await waitForBrowserReady(page);
    await page.evaluate(() => { window.notReloaded = true; });

    const link = page.locator('main.custom-page a', { hasText: 'privacy policy' });
    await expect(link).toHaveAttribute('href', '/pages/privacy');
    await link.click();

    await expect(page).toHaveURL(/\/pages\/privacy$/);
    await expect(heading(page)).toHaveText('Privacy');
    expect(await page.evaluate(() => window.notReloaded)).toBe(true);
  });

  test('hides pages if their condition is not met', async ({ page }) => {
    await page.addInitScript(() => {
      window.STAC_BROWSER_CONFIG = Object.assign({}, window.STAC_BROWSER_CONFIG, {
        pages: {
          german: {
            title: 'Nur Deutsch',
            content: 'Hallo',
            footer: true,
            condition: ({ state }) => state.uiLanguage === 'de'
          }
        },
        detectLocaleFromBrowser: false,
        storeLocale: false
      });
    });

    await page.goto('/pages/german');
    await waitForBrowserReady(page);
    await expect(page.getByText('The requested page does not exist.')).toBeVisible();
    await expect(page.locator('footer .footer-links')).toHaveCount(0);

    await configureBrowser(page, { locale: 'de' });
    await page.goto('/pages/german');
    await waitForBrowserReady(page);
    await expect(heading(page)).toHaveText('Nur Deutsch');
    await expect(page.locator('footer .footer-links a')).toHaveText(['Nur Deutsch']);
  });
});
