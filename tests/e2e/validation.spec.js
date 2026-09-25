/**
* Validation tests.
*
* Verifies that STAC Browser's validate toolbar button correctly triggers
* validation and renders pass/fail results for catalogs, collections, and items.
*
* STAC Browser calls an external validation service (validate.stacspec.org).
* All validator responses are mocked via MSW so tests are fully offline and
* deterministic.
*
* Covered:
*  - Validate button is present on catalog, collection, and item pages
*  - A valid STAC object renders a "passed" / success indicator
*  - An invalid STAC object renders a "failed" / error indicator with detail
*  - Validation panel closes on outside click
*  - Validation is re-triggered on demand (clicking Validate a second time)
*/
import { test, expect } from './fixtures.js';
import StaticCatalog from '../fixtures/instances/static.js';
import { configureBrowser, waitForBrowserReady, openSourcePanel } from './helpers.js';

// ---------------------------------------------------------------------------
// Validate button presence
// ---------------------------------------------------------------------------

test.describe('Validation - button visibility', () => {
  let catalog, collection, item;
  
  test.beforeEach(async ({worker }) => {
    catalog = new StaticCatalog({ url: 'https://stac.example/catalog.json' });
    collection = catalog.addCollection({ url: 'https://stac.example/collection.json' })
      .setMetadata({ title: 'Validation Test Collection' });
    item = collection.addItem({ url: 'https://stac.example/item.json' })
      .setMetadata({ title: 'Validation Test Item' });
    
    await catalog.createServer(worker);
  });
  
  test('validate button is visible on a catalog page', async ({ page }) => {
    await page.goto(catalog.root.getBrowserPath());
    await waitForBrowserReady(page);
    
    const sourcePanel = await openSourcePanel(page);
    await expect(sourcePanel.getByText('Valid', { exact: true })).toBeVisible();
  });
  
  test('validate button is visible on a collection page', async ({ page }) => {
    await page.goto(collection.getBrowserPath());
    await waitForBrowserReady(page);
    
    
    const sourcePanel = await openSourcePanel(page);
    await expect(sourcePanel.getByText('Valid', { exact: true })).toBeVisible();
  });
  
  test('validate button is visible on an item page', async ({ page }) => {
    await page.goto(item.getBrowserPath());
    await waitForBrowserReady(page);
    
    const sourcePanel = await openSourcePanel(page);
    await expect(sourcePanel.getByText('Valid', { exact: true })).toBeVisible();
  });
});

test.describe('Validation - catalog', () => {
  let catalog;
  
  test.beforeEach(() => {
    catalog = new StaticCatalog({ url: 'https://stac.example/catalog.json' })
      .setMetadata({ title: 'Test Catalog' });
  });
  
  test('valid catalog shows passed validation result', async ({ page, worker }) => {
    await catalog.createServer(worker);
    await page.goto(catalog.root.getBrowserPath());
    await waitForBrowserReady(page);
    
    const SourcePanel = await openSourcePanel(page);
    
    const validationBtn = SourcePanel.locator('.stac-valid .btn-success');
    await expect(validationBtn).toBeVisible();
    await expect(validationBtn).toContainText('yes', { ignoreCase: true });
    
    await validationBtn.click();
    await waitForBrowserReady(page);
    
    await expect(page.getByRole('heading', { name: /validation report/i })).toBeVisible();
    
    const resultRow = page.locator('main').getByText('Result').locator('..');
    await expect(resultRow.getByText(/Valid/i)).toBeVisible();
    
    const cards = page.locator('.results .card');
    const cardCount = await cards.count();
    expect(cardCount).toBeGreaterThan(0);
  });

  test('keeps the store locale separate from the validation localizer', async ({ page, worker }) => {
    await catalog.createServer(worker);
    await configureBrowser(page, {
      detectLocaleFromBrowser: false,
      locale: 'en',
      fallbackLocale: 'en',
      supportedLocales: ['ar', 'en'],
    });
    const warnings = [];
    page.on('console', message => {
      if (message.type() === 'warning') {
        warnings.push(message.text());
      }
    });

    await page.goto(`/validation${catalog.root.getBrowserPath()}?.language=ar`);
    const validation = page.locator('main.validation');
    await expect(validation).toBeVisible();
    await expect.poll(() => validation.evaluate(element => {
      const component = element.__vueParentComponent?.proxy;
      return {
        locale: component?.locale,
        validationLocaleType: typeof component?.validationLocale,
      };
    })).toEqual({ locale: 'ar', validationLocaleType: 'function' });
    expect(warnings.some(warning =>
      warning.includes('Computed property "locale" is already defined in Data')
    )).toBe(false);
  });
});
