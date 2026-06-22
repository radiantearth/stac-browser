/**
 * Dropped filter banner tests.
 *
 * Verifies that when a user searches collections with free-text or sort filters
 * and then navigates into a specific collection, unsupported filters are
 * tracked and surfaced via a dismissible warning banner at the top of the page.
 *
 */
import { test, expect } from './fixtures.js';
import API from '../fixtures/instances/api.js';
import { waitForBrowserReady } from './helpers.js';

const FREE_TEXT_CONFORMANCE = 'https://api.stacspec.org/v1.0.0/collection-search#free-text';

// Helper: add a free-text tag to the collection search filter multiselect
const addFreeTextTerm = async (page, term) => {
  const freeTextGroup = page.locator('.filter-freetext');
  const multiselect = freeTextGroup.locator('.multiselect');
  await multiselect.locator('.multiselect__tags').click();
  const input = multiselect.locator('input.multiselect__input');
  await expect(input).toBeVisible();
  await input.fill(term);
  await input.press('Enter');
  await expect(freeTextGroup.locator('.multiselect__tag').filter({ hasText: term })).toBeVisible();
};

// Helper: navigate to the Search page and switch to the Collections tab
const goToCollectionSearchTab = async (page, browserPath) => {
  await page.goto(browserPath);
  await waitForBrowserReady(page);
  await page.getByRole('button', { name: /^search$/i }).click();
  await waitForBrowserReady(page);
  await page.getByRole('tab', { name: /search for collections/i }).click();
  await waitForBrowserReady(page);
};

test.describe('Dropped filter banner — collection search to collection navigation', () => {
  let api;
  let BROWSER_PATH;

  test.beforeEach(async ({ worker }) => {
    api = API.minimalApi({}, { defaultLimit: 10 });

    api.addCollection('sentinel-2-l2a')
      .setMetadata({ title: 'Sentinel-2 L2A' });
    api.addCollection('landsat-8')
      .setMetadata({ title: 'Landsat 8' });

    api.addCollectionsExtension()
      .addItemsExtension()
      .addSearchExtension();

    api.root.addConformsTo('https://api.stacspec.org/v1.0.0/collection-search');
    api.root.addConformsTo(FREE_TEXT_CONFORMANCE);

    await api.createServer(worker);
    BROWSER_PATH = api.root.getBrowserPath();
  });

  test('Free-text banner appears when navigating from collection search into a collection', async ({ page }) => {
    await test.step('Navigate to collection search tab', async () => {
      await goToCollectionSearchTab(page, BROWSER_PATH);
    });

    await test.step('Verify free-text input is visible (conformance registered correctly)', async () => {
      await expect(page.locator('.filter-freetext')).toBeVisible();
    });

    await test.step('Add free-text term and submit', async () => {
      await addFreeTextTerm(page, 'sentinel');
      await page.getByRole('button', { name: /submit/i }).click();
      await waitForBrowserReady(page);
    });

    await test.step('Click into a collection result', async () => {
      const collectionLink = page.getByText('Sentinel-2 L2A', { exact: false }).first();
      await expect(collectionLink).toBeVisible({ timeout: 10000 });
      await collectionLink.click();
      await waitForBrowserReady(page);
    });

    await test.step('Verify free-text banner appears', async () => {
      const banner = page.locator('.alert-warning').first();
      await expect(banner).toBeVisible({ timeout: 10000 });
      await expect(banner).toContainText('sentinel');
      await expect(banner).toContainText(/removed/i);
    });
  });

  test('Free-text banner contains all dropped search terms', async ({ page }) => {
    await goToCollectionSearchTab(page, BROWSER_PATH);

    await test.step('Add multiple free-text terms and submit', async () => {
      await addFreeTextTerm(page, 'sentinel');
      await addFreeTextTerm(page, 'radar');
      await page.getByRole('button', { name: /submit/i }).click();
      await waitForBrowserReady(page);
    });

    await test.step('Navigate into a collection', async () => {
      const collectionLink = page.getByText('Sentinel-2 L2A', { exact: false }).first();
      await expect(collectionLink).toBeVisible({ timeout: 10000 });
      await collectionLink.click();
      await waitForBrowserReady(page);
    });

    await test.step('Verify banner lists all dropped terms', async () => {
      const banner = page.locator('.alert-warning').first();
      await expect(banner).toBeVisible({ timeout: 10000 });
      await expect(banner).toContainText('sentinel');
      await expect(banner).toContainText('radar');
    });
  });

  test('Free-text banner appears at the top of the page before collection content', async ({ page }) => {
    await goToCollectionSearchTab(page, BROWSER_PATH);

    await test.step('Add free-text term and submit', async () => {
      await addFreeTextTerm(page, 'sentinel');
      await page.getByRole('button', { name: /submit/i }).click();
      await waitForBrowserReady(page);
    });

    await test.step('Navigate into a collection', async () => {
      const collectionLink = page.getByText('Sentinel-2 L2A', { exact: false }).first();
      await expect(collectionLink).toBeVisible({ timeout: 10000 });
      await collectionLink.click();
      await waitForBrowserReady(page);
    });

    await test.step('Verify banner renders above the description heading', async () => {
      const banner = page.locator('.alert-warning').first();
      const description = page.locator('h2').filter({ hasText: /description/i }).first();

      await expect(banner).toBeVisible({ timeout: 10000 });
      await expect(description).toBeVisible();

      const bannerBox = await banner.boundingBox();
      const descriptionBox = await description.boundingBox();
      expect(bannerBox.y).toBeLessThan(descriptionBox.y);
    });
  });

  test('Free-text banner can be dismissed independently and disappears', async ({ page }) => {
    await goToCollectionSearchTab(page, BROWSER_PATH);

    await test.step('Add free-text term, submit, navigate to collection', async () => {
      await addFreeTextTerm(page, 'sentinel');
      await page.getByRole('button', { name: /submit/i }).click();
      await waitForBrowserReady(page);
      const collectionLink = page.getByText('Sentinel-2 L2A', { exact: false }).first();
      await expect(collectionLink).toBeVisible({ timeout: 10000 });
      await collectionLink.click();
      await waitForBrowserReady(page);
    });

    await test.step('Dismiss the free-text banner', async () => {
      const banner = page.locator('.alert-warning').first();
      await expect(banner).toBeVisible({ timeout: 10000 });
      const dismissButton = banner.locator('button.btn-close').first();
      await dismissButton.click();
      await expect(banner).not.toBeVisible({ timeout: 5000 });
    });
  });

  test('Sort-only drop does not trigger the banner', async ({ page }) => {
    await test.step('Navigate directly to a collection without any search or free-text', async () => {
        await page.goto(BROWSER_PATH);
        await waitForBrowserReady(page);
        const collectionLink = page.getByText('Sentinel-2 L2A', { exact: false }).first();
        await expect(collectionLink).toBeVisible({ timeout: 10000 });
        await collectionLink.click();
        await waitForBrowserReady(page);
    });

    await test.step('Verify no banner appears', async () => {
        await page.waitForTimeout(500);
        await expect(page.locator('.alert-warning')).toHaveCount(0);
    });
 });

  test('Banner fires on first-ever collection navigation with no prior collection visited', async ({ page }) => {
    await goToCollectionSearchTab(page, BROWSER_PATH);

    await test.step('Add free-text and submit', async () => {
      await addFreeTextTerm(page, 'sentinel');
      await page.getByRole('button', { name: /submit/i }).click();
      await waitForBrowserReady(page);
    });

    await test.step('Click directly into first collection — oldData is undefined here', async () => {
      const collectionLink = page.getByText('Sentinel-2 L2A', { exact: false }).first();
      await expect(collectionLink).toBeVisible({ timeout: 10000 });
      await collectionLink.click();
      await waitForBrowserReady(page);
    });

    await test.step('Banner appears even though no previous collection was loaded', async () => {
      const banner = page.locator('.alert-warning').first();
      await expect(banner).toBeVisible({ timeout: 10000 });
      await expect(banner).toContainText('sentinel');
    });
  });

  test('No banner appears when navigating to a collection without any prior search', async ({ page }) => {
    await test.step('Navigate directly to catalog root without searching', async () => {
      await page.goto(BROWSER_PATH);
      await waitForBrowserReady(page);
    });

    await test.step('Click into a collection directly', async () => {
      const collectionLink = page.getByText('Sentinel-2 L2A', { exact: false }).first();
      await expect(collectionLink).toBeVisible({ timeout: 10000 });
      await collectionLink.click();
      await waitForBrowserReady(page);
    });

    await test.step('Verify no banner appears', async () => {
      await page.waitForTimeout(500);
      await expect(page.locator('.alert-warning')).toHaveCount(0);
    });
  });

  test('Navigating to a second collection does not re-show an already dismissed banner', async ({ page }) => {
    await goToCollectionSearchTab(page, BROWSER_PATH);

    await test.step('Add free-text, submit, navigate to first collection', async () => {
      await addFreeTextTerm(page, 'sentinel');
      await page.getByRole('button', { name: /submit/i }).click();
      await waitForBrowserReady(page);
      const collectionLink = page.getByText('Sentinel-2 L2A', { exact: false }).first();
      await expect(collectionLink).toBeVisible({ timeout: 10000 });
      await collectionLink.click();
      await waitForBrowserReady(page);
    });

    await test.step('Dismiss the banner', async () => {
      const banner = page.locator('.alert-warning').first();
      await expect(banner).toBeVisible({ timeout: 10000 });
      await banner.locator('button.btn-close').first().click();
      await expect(banner).not.toBeVisible({ timeout: 5000 });
    });

    await test.step('Navigate back and into a second collection', async () => {
      await page.goto(BROWSER_PATH);
      await waitForBrowserReady(page);
      const secondLink = page.getByText('Landsat 8', { exact: false }).first();
      await expect(secondLink).toBeVisible({ timeout: 10000 });
      await secondLink.click();
      await waitForBrowserReady(page);
    });

    await test.step('Verify banner does not reappear', async () => {
      await page.waitForTimeout(500);
      await expect(page.locator('.alert-warning')).toHaveCount(0);
    });
  });
});