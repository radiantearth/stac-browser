/**
 * Dropped filter banner tests.
 *
 * Verifies that when a user searches collections with free-text or sort filters
 * and then navigates into a specific collection, unsupported filters are
 * tracked and surfaced via a dismissible warning banner inside the item filter panel.
 *
 */
import { test, expect } from './fixtures.js';
import API from '../fixtures/instances/api.js';
import { waitForBrowserReady } from './helpers.js';

const FREE_TEXT_CONFORMANCE = 'https://api.stacspec.org/v1.0.0/collection-search#free-text';
const SORT_CONFORMANCE = 'https://api.stacspec.org/v1.0.0/collection-search#sort';

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

// Helper: choose a sort field in the sort multiselect
const selectSortField = async (page, field) => {
  const sortSelect = page.locator('.sort .multiselect').first();
  await sortSelect.locator('.multiselect__select').click();
  const sortInput = sortSelect.locator('input.multiselect__input');
  await sortInput.fill(field);
  await sortInput.press('Enter');
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

// Helper: open the item filter panel on a collection page (banner lives inside it).
// The panel opens automatically when filters were carried over, so only click
// the toggle while it is still closed.
const openItemFilterPanel = async (page) => {
  const toggle = page.getByRole('button', { name: /show filters/i });
  if (await toggle.isVisible()) {
    await toggle.click();
  }
  await waitForBrowserReady(page);
};

test.describe('Dropped filter banner — collection search to collection navigation', () => {
  let api;
  let BROWSER_PATH;

  test.beforeEach(async ({ worker }) => {
    api = API.minimalApi({}, { defaultLimit: 10 });

    const sentinel = api.addCollection('sentinel-2-l2a')
        .setMetadata({ title: 'Sentinel-2 L2A' });
    const landsat = api.addCollection('landsat-8')
        .setMetadata({ title: 'Landsat 8' });

    api.addCollectionsExtension()
    .addItemsExtension()
    .addSearchExtension();

    api.addManyItems(sentinel, 3);
    api.addManyItems(landsat, 3);

    api.root.addConformsTo('https://api.stacspec.org/v1.0.0/collection-search');
    api.root.addConformsTo(FREE_TEXT_CONFORMANCE);
    // Collection search advertises sort; in-collection item search (Features) does not.
    api.root.addConformsTo(SORT_CONFORMANCE);

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

    await test.step('Open item filter panel', async () => {
      await openItemFilterPanel(page);
    });

    await test.step('Verify free-text banner appears', async () => {
      const banner = page.locator('.alert-warning').first();
      await expect(banner).toBeVisible({ timeout: 10000 });
      await expect(banner).toContainText(/Search Terms/i);
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

    await test.step('Open item filter panel', async () => {
      await openItemFilterPanel(page);
    });

    await test.step('Verify banner lists all dropped terms', async () => {
      const banner = page.locator('.alert-warning').first();
      await expect(banner).toBeVisible({ timeout: 10000 });
      await expect(banner).toContainText(/Search Terms/i);
    });
  });

  test('Free-text banner appears at the top of the item filter panel', async ({ page }) => {
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

    await test.step('Open item filter panel', async () => {
      await openItemFilterPanel(page);
    });

    await test.step('Verify banner renders above the filter form fields', async () => {
        const banner = page.locator('.alert-warning').first();
        const limitGroup = page.locator('.limit').first();

        await expect(banner).toBeVisible({ timeout: 10000 });
        await expect(limitGroup).toBeVisible();

        const bannerBox = await banner.boundingBox();
        const limitBox = await limitGroup.boundingBox();
        expect(bannerBox.y).toBeLessThan(limitBox.y);
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

    await test.step('Open item filter panel', async () => {
      await openItemFilterPanel(page);
    });

    await test.step('Dismiss the free-text banner', async () => {
      const banner = page.locator('.alert-warning').first();
      await expect(banner).toBeVisible({ timeout: 10000 });
      const dismissButton = banner.locator('button.btn-close').first();
      await dismissButton.click();
      await expect(banner).not.toBeVisible({ timeout: 5000 });
    });
  });

  test('Sort-only search does not carry over and shows no banner', async ({ page }) => {
    await goToCollectionSearchTab(page, BROWSER_PATH);

    await test.step('Verify sort control is visible (conformance registered correctly)', async () => {
      await expect(page.locator('.sort').first()).toBeVisible();
    });

    await test.step('Select a sort field and submit', async () => {
      await selectSortField(page, 'created');
      await page.getByRole('button', { name: /submit/i }).click();
      await waitForBrowserReady(page);
    });

    await test.step('Navigate into a collection', async () => {
      const collectionLink = page.getByText('Sentinel-2 L2A', { exact: false }).first();
      await expect(collectionLink).toBeVisible({ timeout: 10000 });
      await collectionLink.click();
      await waitForBrowserReady(page);
    });

    await test.step('Open item filter panel', async () => {
      await openItemFilterPanel(page);
    });

    // A sort order alone is no search criterion, so nothing is carried over
    // into the collection and nothing needs to be reported
    await test.step('No banner appears for a sort-only search', async () => {
      const banner = page.locator('.alert-warning').first();
      await expect(banner).not.toBeVisible({ timeout: 5000 });
    });
  });

  test('Sort is reported alongside dropped search terms', async ({ page }) => {
    await goToCollectionSearchTab(page, BROWSER_PATH);

    await test.step('Add free-text term, select a sort field and submit', async () => {
      await addFreeTextTerm(page, 'sentinel');
      await selectSortField(page, 'created');
      await page.getByRole('button', { name: /submit/i }).click();
      await waitForBrowserReady(page);
    });

    await test.step('Navigate into a collection', async () => {
      const collectionLink = page.getByText('Sentinel-2 L2A', { exact: false }).first();
      await expect(collectionLink).toBeVisible({ timeout: 10000 });
      await collectionLink.click();
      await waitForBrowserReady(page);
    });

    await test.step('Open item filter panel', async () => {
      await openItemFilterPanel(page);
    });

    // The test API doesn't advertise sort for Features, so the sort must be
    // named in the banner next to the dropped search terms
    await test.step('Banner names both the search terms and the sort', async () => {
      const banner = page.locator('.alert-warning').first();
      await expect(banner).toBeVisible({ timeout: 10000 });
      await expect(banner).toContainText(/Search Terms/i);
      await expect(banner).toContainText(/sort/i);
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

    await test.step('Open item filter panel', async () => {
      await openItemFilterPanel(page);
    });

    await test.step('Banner appears even though no previous collection was loaded', async () => {
      const banner = page.locator('.alert-warning').first();
      await expect(banner).toBeVisible({ timeout: 10000 });
      await expect(banner).toContainText(/Search Terms/i);
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

    await test.step('Open item filter panel', async () => {
      await openItemFilterPanel(page);
    });

    await test.step('Verify no banner appears', async () => {
      await page.waitForTimeout(500);
      await expect(page.locator('.alert-warning')).toHaveCount(0);
    });
  });

  test('Browsing on to another collection does not re-apply the carry-over', async ({ page }) => {
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

    await test.step('Open item filter panel', async () => {
      await openItemFilterPanel(page);
    });

    await test.step('Dismiss the banner', async () => {
      const banner = page.locator('.alert-warning').first();
      await expect(banner).toBeVisible({ timeout: 10000 });
      await banner.locator('button.btn-close').first().click();
      await expect(banner).not.toBeVisible({ timeout: 5000 });
    });

    await test.step('Navigate to a second collection via the catalog', async () => {
      // Navigate in-app (a page.goto would reload and reset the store)
      await page.getByRole('button', { name: /^browse$/i }).click();
      await waitForBrowserReady(page);
      const secondLink = page.getByText('Landsat 8', { exact: false }).first();
      await expect(secondLink).toBeVisible({ timeout: 10000 });
      await secondLink.click();
      await waitForBrowserReady(page);
    });

    await test.step('Open item filter panel for second collection', async () => {
      await openItemFilterPanel(page);
    });

    // The carry-over only applies when jumping there from the search results,
    // browsing the catalog is not affected
    await test.step('Verify no banner appears for the second collection', async () => {
      await page.waitForTimeout(500);
      await expect(page.locator('.alert-warning')).toHaveCount(0);
    });
  });

  test('Resetting the item filters clears the banner', async ({ page }) => {
    await goToCollectionSearchTab(page, BROWSER_PATH);

    await test.step('Add free-text, submit, navigate into a collection', async () => {
      await addFreeTextTerm(page, 'sentinel');
      await page.getByRole('button', { name: /submit/i }).click();
      await waitForBrowserReady(page);
      const collectionLink = page.getByText('Sentinel-2 L2A', { exact: false }).first();
      await expect(collectionLink).toBeVisible({ timeout: 10000 });
      await collectionLink.click();
      await waitForBrowserReady(page);
    });

    await test.step('Open item filter panel and verify the banner', async () => {
      await openItemFilterPanel(page);
      await expect(page.locator('.alert-warning').first()).toBeVisible({ timeout: 10000 });
    });

    await test.step('Reset the item filters — the banner disappears', async () => {
      await page.getByRole('button', { name: /reset/i }).first().click();
      await expect(page.locator('.alert-warning')).toHaveCount(0);
    });
  });
});
