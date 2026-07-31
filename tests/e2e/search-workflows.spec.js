/**
 * End-to-end user workflows for the search filter carry-over.
 *
 * Each test drives a complete user flow through the UI and verifies both the
 * visible behavior and (where the UI can't show it) the resulting store state:
 *
 * - CQL filters composed in the collection search are rebuilt with their real
 *   operator classes when carried into a collection that supports them.
 * - The carry-over is non-destructive: a filter dropped at one collection is
 *   available again at another collection that supports it, and the collection
 *   search form keeps its state when switching tabs back and forth.
 * - Plain browsing is unaffected by filters from an unrelated item search.
 * - Once the user executes their own item search, navigating on does not
 *   re-import the collection search criteria.
 * - URL-provided free-text terms seed the search form.
 * - Resetting a search clears its bucket and stops the carry-over.
 */
import { test, expect } from './fixtures.js';
import API from '../fixtures/instances/api.js';
import { getSearchState } from '../helpers/store.js';
import { waitForBrowserReady } from './helpers.js';

const addFreeTextTerm = async (page, term) => {
  const freeTextGroup = page.locator('.filter-freetext').first();
  const multiselect = freeTextGroup.locator('.multiselect');
  await multiselect.locator('.multiselect__tags').click();
  const input = multiselect.locator('input.multiselect__input');
  await expect(input).toBeVisible();
  await input.fill(term);
  await input.press('Enter');
  await expect(freeTextGroup.locator('.multiselect__tag').filter({ hasText: term })).toBeVisible();
};

const addItemIdTerm = async (page, term) => {
  const group = page.locator('.filter-item-id').first();
  const multiselect = group.locator('.multiselect');
  await multiselect.locator('.multiselect__tags').click();
  const input = multiselect.locator('input.multiselect__input');
  await expect(input).toBeVisible();
  await input.fill(term);
  await input.press('Enter');
  await expect(group.locator('.multiselect__tag').filter({ hasText: term })).toBeVisible();
};

const goToSearch = async (page, browserPath) => {
  await page.goto(browserPath);
  await waitForBrowserReady(page);
  await page.getByRole('button', { name: /^search$/i }).click();
  await waitForBrowserReady(page);
};

const goToCollectionSearchTab = async (page, browserPath) => {
  await goToSearch(page, browserPath);
  await page.getByRole('tab', { name: /search for collections/i }).click();
  await waitForBrowserReady(page);
};

const navigateIntoCollection = async (page, title) => {
  const link = page.getByText(title, { exact: false }).first();
  await expect(link).toBeVisible({ timeout: 10000 });
  await link.click();
  await waitForBrowserReady(page);
};

// Add a CQL filter row for the "Identifier" queryable in the visible filter form
const addIdentifierFilter = async (page) => {
  const addFilter = page.getByRole('button', { name: /add filter/i }).first();
  await expect(addFilter).toBeVisible({ timeout: 10000 });
  await addFilter.click();
  await page.getByRole('menuitem', { name: /identifier/i }).first().click();
  await expect(page.locator('.additional-filters .queryable-group').first()).toBeVisible();
};

test.describe('Search filter carry-over workflows', () => {
  let api;
  let BROWSER_PATH;

  test.beforeEach(async ({ worker }) => {
    api = API.minimalApi({}, { defaultLimit: 10 });

    const alpha = api.addCollection('alpha').setMetadata({ title: 'Alpha Collection' });
    const beta = api.addCollection('beta').setMetadata({ title: 'Beta Collection' });

    api.addCollectionsExtension()
      .addItemsExtension()
      .addSearchExtension()
      .addFilterExtension();

    api.addManyItems(alpha, 3);
    api.addManyItems(beta, 3);

    api.root.addConformsTo('https://api.stacspec.org/v1.0.0/collection-search');
    api.root.addConformsTo('https://api.stacspec.org/v1.0.0/collection-search#free-text');
    api.root.addConformsTo('https://api.stacspec.org/v1.0.0/collection-search#filter');
    api.root.addConformsTo('https://api.stacspec.org/v1.0.0/collection-search#sort');
    api.root.addConformsTo('https://api.stacspec.org/v1.0.0/item-search#free-text');
    api.root.addConformsTo('http://www.opengis.net/spec/cql2/1.0/conf/cql2-text');
    api.root.addConformsTo('http://www.opengis.net/spec/ogcapi-features-3/1.0/conf/features-filter');

    // The Collections search form discovers queryables via the /collections
    // response; Alpha supports the same queryables, Beta has none.
    const queryablesUrl = api.root.getAbsoluteUrl() + 'queryables';
    const queryablesLink = { rel: 'queryables', href: queryablesUrl, type: 'application/schema+json' };
    api.collections.addLink(queryablesLink);
    alpha.addLink(queryablesLink);

    await api.createServer(worker);
    BROWSER_PATH = api.root.getBrowserPath();
  });

  test('CQL filter is rebuilt with real operators when the collection supports it', async ({ page }) => {
    await goToCollectionSearchTab(page, BROWSER_PATH);

    await test.step('Add a CQL filter on the Identifier queryable and submit', async () => {
      await addIdentifierFilter(page);
      await page.getByRole('button', { name: /submit/i }).click();
      await waitForBrowserReady(page);
    });

    await test.step('Navigate into the collection that supports the queryable', async () => {
      await navigateIntoCollection(page, 'Alpha Collection');
    });

    await test.step('Filter panel opens automatically instead of filtering silently', async () => {
      await expect(page.getByRole('button', { name: /hide filters/i })).toBeVisible({ timeout: 10000 });
    });

    await test.step('The CQL filter was carried over and rebuilt', async () => {
      const state = await getSearchState(page);
      expect(state.itemFilters.rawFilters).toHaveLength(1);
      expect(state.itemFilters.rawFilters[0].queryable.id).toBe('id');
      expect(state.itemFilters.rawFilters[0].hasOperator).toBe(true);
      expect(state.itemFilters.filters).not.toBeNull();
      expect(state.droppedFilters.Items.filter(f => f.type === 'cql2')).toHaveLength(0);
      // Non-destructive: the collection search keeps the filter
      expect(state.collectionFilters.rawFilters).toHaveLength(1);
    });

    await test.step('The carried filter is shown in the item filter form', async () => {
      await expect(page.locator('.additional-filters .queryable-group').first()).toBeVisible({ timeout: 10000 });
    });

    await test.step('Submitting the item search keeps the carried filter', async () => {
      await page.getByRole('button', { name: /submit/i }).click();
      await waitForBrowserReady(page);
      const state = await getSearchState(page);
      expect(state.itemFilters.rawFilters).toHaveLength(1);
      expect(state.itemFilters.rawFilters[0].hasOperator).toBe(true);
      expect(state.itemFilters.filters).not.toBeNull();
    });
  });

  test('Sort selection is carried into the item search form on tab switch', async ({ page }) => {
    await goToCollectionSearchTab(page, BROWSER_PATH);

    await test.step('Add a free-text term and select a sort field', async () => {
      await addFreeTextTerm(page, 'sentinel');
      const sortSelect = page.locator('.sort .multiselect').first();
      await sortSelect.locator('.multiselect__select').click();
      const sortInput = sortSelect.locator('input.multiselect__input');
      await sortInput.fill('title');
      await sortInput.press('Enter');
    });

    await test.step('Switch to the Items tab — the sort is translated and shown in the form', async () => {
      await page.getByRole('tab', { name: /search for items/i }).click();
      await waitForBrowserReady(page);
      const state = await getSearchState(page);
      // Collections sort by `title`, items by `properties.title`
      expect(state.itemFilters.sortby).toBe('properties.title');
      const itemsTab = page.getByRole('tabpanel', { name: /search for items/i });
      await expect(itemsTab.locator('.sort .multiselect__single').first()).toContainText(/title/i);
    });

    await test.step('Submitting the item search keeps the carried sort', async () => {
      await page.getByRole('tabpanel', { name: /search for items/i }).getByRole('button', { name: /submit/i }).click();
      await waitForBrowserReady(page);
      const state = await getSearchState(page);
      expect(state.itemFilters.sortby).toBe('properties.title');
    });
  });

  test('CQL filter dropped at one collection is available again at another', async ({ page }) => {
    await goToCollectionSearchTab(page, BROWSER_PATH);

    await test.step('Add a CQL filter and submit', async () => {
      await addIdentifierFilter(page);
      await page.getByRole('button', { name: /submit/i }).click();
      await waitForBrowserReady(page);
    });

    await test.step('Navigate into the collection without queryables', async () => {
      await navigateIntoCollection(page, 'Beta Collection');
    });

    await test.step('The filter is dropped and named in the banner', async () => {
      const banner = page.locator('.alert-warning').first();
      await expect(banner).toBeVisible({ timeout: 10000 });
      await expect(banner).toContainText(/identifier/i);
      const state = await getSearchState(page);
      expect(state.itemFilters.rawFilters).toHaveLength(0);
      expect(state.itemFilters.filters).toBeNull();
    });

    await test.step('Navigate on to the collection that supports the queryable', async () => {
      // Navigate in-app (a page.goto would reload and reset the store)
      await page.getByRole('button', { name: /^browse$/i }).click();
      await waitForBrowserReady(page);
      await navigateIntoCollection(page, 'Alpha Collection');
    });

    await test.step('The filter is carried over again — it was not destroyed at the first collection', async () => {
      const state = await getSearchState(page);
      expect(state.itemFilters.rawFilters).toHaveLength(1);
      expect(state.itemFilters.rawFilters[0].hasOperator).toBe(true);
      expect(state.itemFilters.filters).not.toBeNull();
      expect(state.droppedFilters.Items.filter(f => f.type === 'cql2')).toHaveLength(0);
    });
  });

  test('Collection search form keeps its state when switching tabs back and forth', async ({ page }) => {
    await goToCollectionSearchTab(page, BROWSER_PATH);

    await test.step('Add a free-text term on the Collections tab', async () => {
      await addFreeTextTerm(page, 'landsat');
    });

    await test.step('Switch to the Items tab — the term is carried over', async () => {
      await page.getByRole('tab', { name: /search for items/i }).click();
      await waitForBrowserReady(page);
      // The API supports item-search free-text, so the term is carried
      const itemsTab = page.getByRole('tabpanel', { name: /search for items/i });
      await expect(itemsTab.locator('.filter-freetext .multiselect__tag').filter({ hasText: 'landsat' })).toBeVisible();
    });

    await test.step('Switch back to the Collections tab — the form still has the term', async () => {
      await page.getByRole('tab', { name: /search for collections/i }).click();
      await waitForBrowserReady(page);
      const collectionsTab = page.getByRole('tabpanel', { name: /search for collections/i });
      await expect(collectionsTab.locator('.filter-freetext .multiselect__tag').filter({ hasText: 'landsat' })).toBeVisible();
    });
  });

  test('Plain browsing is unaffected by an unrelated item search', async ({ page }) => {
    await goToSearch(page, BROWSER_PATH);

    await test.step('Execute an item search with an item ID filter', async () => {
      await page.getByRole('tab', { name: /search for items/i }).click();
      await waitForBrowserReady(page);
      await addItemIdTerm(page, 'example-item-1');
      await page.getByRole('button', { name: /submit/i }).click();
      await waitForBrowserReady(page);
    });

    await test.step('Browse into a collection', async () => {
      await page.getByRole('button', { name: /^browse$/i }).click();
      await waitForBrowserReady(page);
      await navigateIntoCollection(page, 'Alpha Collection');
    });

    await test.step('No carry-over: no banner, filter panel stays closed', async () => {
      await expect(page.getByRole('button', { name: /show filters/i })).toBeVisible({ timeout: 10000 });
      await expect(page.locator('.alert-warning')).toHaveCount(0);
      const state = await getSearchState(page);
      expect(state.carryFromCollectionSearch).toBe(false);
      // The user's item search is untouched
      expect(state.itemFilters.ids).toEqual(['example-item-1']);
    });
  });

  test('Executing an own item search stops the carry-over on further navigation', async ({ page }) => {
    await goToCollectionSearchTab(page, BROWSER_PATH);

    await test.step('Execute a collection search with a free-text term', async () => {
      await addFreeTextTerm(page, 'sentinel');
      await page.getByRole('button', { name: /submit/i }).click();
      await waitForBrowserReady(page);
    });

    await test.step('Navigate into a collection — the carry-over runs and reports the drop', async () => {
      await navigateIntoCollection(page, 'Alpha Collection');
      await expect(page.getByRole('button', { name: /hide filters/i })).toBeVisible({ timeout: 10000 });
      await expect(page.locator('.alert-warning').first()).toBeVisible({ timeout: 10000 });
    });

    await test.step('Take over: change the limit and execute an own item search', async () => {
      const limitInput = page.locator('.limit input').first();
      await limitInput.fill('7');
      await page.getByRole('button', { name: /submit/i }).first().click();
      await waitForBrowserReady(page);
    });

    await test.step('Navigate to another collection — the own search is preserved', async () => {
      await page.getByRole('button', { name: /^browse$/i }).click();
      await waitForBrowserReady(page);
      await navigateIntoCollection(page, 'Beta Collection');

      // No new carry-over ran and no stale banner is shown
      await expect(page.locator('.alert-warning')).toHaveCount(0);
      const state = await getSearchState(page);
      expect(state.carryFromCollectionSearch).toBe(false);
      expect(state.itemFilters.limit).toBe(7);
    });
  });

  test('URL-provided free-text terms seed the item search form', async ({ page }) => {
    await page.goto(api.root.getSearchPath() + '?.q=sentinel');
    await waitForBrowserReady(page);

    await test.step('The Items tab form shows the term from the URL', async () => {
      await page.getByRole('tab', { name: /search for items/i }).click();
      await waitForBrowserReady(page);
      const itemsTab = page.getByRole('tabpanel', { name: /search for items/i });
      await expect(itemsTab.locator('.filter-freetext .multiselect__tag').filter({ hasText: 'sentinel' })).toBeVisible({ timeout: 10000 });
      const state = await getSearchState(page);
      expect(state.itemFilters.q).toEqual(['sentinel']);
    });
  });

  test('Resetting the collection search clears it and stops the carry-over', async ({ page }) => {
    await goToCollectionSearchTab(page, BROWSER_PATH);

    await test.step('Execute a collection search with a free-text term', async () => {
      await addFreeTextTerm(page, 'sentinel');
      await page.getByRole('button', { name: /submit/i }).click();
      await waitForBrowserReady(page);
    });

    await test.step('Reset the collection search', async () => {
      await page.getByRole('button', { name: /reset/i }).first().click();
      await waitForBrowserReady(page);
      const state = await getSearchState(page);
      expect(state.collectionFilters.q).toEqual([]);
      expect(state.carryFromCollectionSearch).toBe(false);
    });

    await test.step('Navigate into a collection — nothing is carried over', async () => {
      // The results pane is empty after the reset, navigate via the catalog
      await page.getByRole('button', { name: /^browse$/i }).click();
      await waitForBrowserReady(page);
      await navigateIntoCollection(page, 'Alpha Collection');
      await expect(page.getByRole('button', { name: /show filters/i })).toBeVisible({ timeout: 10000 });
      await expect(page.locator('.alert-warning')).toHaveCount(0);
    });
  });
});
