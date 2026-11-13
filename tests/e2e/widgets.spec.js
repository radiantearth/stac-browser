/**
 * Widget tests.
 *
 * The widgets are configured in tests/e2e/widgets.config.js and only shown
 * for catalogs hosted at WIDGET_TEST_HOST.
 */
import { test, expect } from './fixtures.js';
import { waitForBrowserReady } from './helpers.js';
import StaticCatalog from '../fixtures/instances/static.js';
import { WIDGET_TEST_HOST } from './widgets.config.js';

function createCatalog(host = WIDGET_TEST_HOST) {
  const catalog = new StaticCatalog({ url: `${host}catalog.json` });
  catalog.setMetadata({ title: 'Widget Catalog' });
  const collection = catalog.addCollection({ url: `${host}collection.json` });
  collection.setMetadata({ title: 'Widget Collection' });
  return { catalog, collection };
}

test.describe('Widgets', () => {
  test('renders custom and pre-defined widgets in their hooks', async ({ page, worker }) => {
    const { catalog } = createCatalog();
    await catalog.createServer(worker);

    await page.goto(catalog.root.getBrowserPath());
    await waitForBrowserReady(page);

    await expect(page.locator('.test-widget[data-widget="A"]')).toHaveText('Widget A');
    await expect(page.locator('.test-widget[data-widget="B"]')).toHaveText('Widget B');
    await expect(page.locator('.alert', { hasText: 'Pre-defined widget' })).toBeVisible();
  });

  test('shows widgets only if their condition is met', async ({ page, worker }) => {
    const { catalog, collection } = createCatalog();
    await catalog.createServer(worker);

    await page.goto(catalog.root.getBrowserPath());
    await waitForBrowserReady(page);
    await expect(page.locator('.test-widget[data-widget="B"]')).toBeVisible();
    await expect(page.getByText('Collections only')).toHaveCount(0);

    await page.getByRole('link', { name: collection.getMetadata().title }).first().click();
    await expect(page.getByText('Collections only')).toBeVisible();
  });

  test('widgets in different hooks do not replace each other', async ({ page, worker }) => {
    const { catalog, collection } = createCatalog();
    await catalog.createServer(worker);

    await page.goto(catalog.root.getBrowserPath());
    await waitForBrowserReady(page);
    await expect(page.locator('.test-widget[data-widget="A"]')).toHaveCount(1);
    await expect(page.locator('.test-widget[data-widget="B"]')).toHaveCount(1);

    // Navigating re-renders the hooks: the widget in root-start must stay the same
    await page.getByRole('link', { name: collection.getMetadata().title }).first().click();
    await expect(page.getByText('Collections only')).toBeVisible();
    await expect(page.locator('.test-widget[data-widget="A"]')).toHaveCount(1);
    await expect(page.locator('.test-widget[data-widget="B"]')).toHaveCount(1);
  });

  test('does not show widgets for other catalogs', async ({ page, worker }) => {
    const { catalog } = createCatalog('https://stac.example/');
    await catalog.createServer(worker);

    await page.goto(catalog.root.getBrowserPath());
    await waitForBrowserReady(page);

    await expect(page.getByRole('heading', { name: 'Widget Catalog' })).toBeVisible();
    await expect(page.locator('.test-widget')).toHaveCount(0);
  });
});
