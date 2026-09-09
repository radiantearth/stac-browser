/**
 * Sticky header behavior.
 *
 * The header shows a shadow (`scrolled` class) while the browser is scrolled and,
 * when scrolling down, slides the site row out of view (`hide-site-header` class).
 * Both signals are driven by whichever element actually scrolls the browser.
 * This behavior must be identical to before the scroll-target refactor, so this
 * spec is expected to pass unchanged on both `main` and `use-as-component`.
 */
import { test, expect } from './fixtures.js';
import { waitForBrowserReady } from './helpers.js';
import StaticCatalog from '../fixtures/instances/static.js';

test.describe('Sticky header', () => {
  async function createTallCatalog(worker, count = 30) {
    const catalog = new StaticCatalog({ url: 'https://stac.example/catalog.json' });
    catalog.setMetadata({ title: 'Sticky Header Catalog', description: 'A catalog with many children.' });
    for (let i = 0; i < count; i++) {
      catalog.addCollection({ url: `https://stac.example/collection-${i}.json` });
    }
    await catalog.createServer(worker);
    return catalog;
  }

  test('toggles scrolled and hide-site-header classes with the scroll position', async ({ page, worker }) => {
    // A short viewport guarantees the page scrolls regardless of content height.
    await page.setViewportSize({ width: 600, height: 400 });

    const catalog = await createTallCatalog(worker);
    await page.goto(catalog.root.getBrowserPath());
    await waitForBrowserReady(page);

    const header = page.locator('#stac-browser > header');
    await expect(header).toBeVisible();

    // The header must be sticky for this behavior to apply (theme default).
    await expect(header).toHaveCSS('position', 'sticky');

    // Sanity check: there is something to scroll.
    const scrollable = await page.evaluate(() => document.documentElement.scrollHeight > window.innerHeight);
    expect(scrollable).toBe(true);

    // At the top: neither class is set.
    await expect(header).not.toHaveClass(/scrolled/);
    await expect(header).not.toHaveClass(/hide-site-header/);

    // Scroll down: the shadow appears and the site row is hidden.
    await page.evaluate(() => window.scrollTo(0, 400));
    await expect(header).toHaveClass(/scrolled/);
    await expect(header).toHaveClass(/hide-site-header/);

    // Scroll back to the top: both classes clear.
    await page.evaluate(() => window.scrollTo(0, 0));
    await expect(header).not.toHaveClass(/scrolled/);
    await expect(header).not.toHaveClass(/hide-site-header/);
  });
});
