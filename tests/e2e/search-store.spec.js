/**
 * Vuex search module tests.
 *
 * Verifies the search Vuex module state shape, mutations, getters, and the
 * carry-over action by directly accessing the store through the running
 * browser page.
 *
 * Note that everything sent into the page is JSON-serialized, so CQL operator
 * classes cannot be injected here; the CQL rebuild with real operator classes
 * needs unit tests instead.
 */
import { test, expect } from './fixtures.js';
import API from '../fixtures/instances/api.js';
import { commitToStore, getSearchState } from '../helpers/store.js';
import { dispatchCarryToItemSearch, makeRawFilter } from '../helpers/reconciliation.js';

const DATETIME = '2025-05-01T00:00:00.000Z/2025-05-29T00:00:00.000Z';

test.describe('Vuex search module', () => {
  test.beforeEach(async ({ worker, page }) => {
    const api = API.minimalApi({}, { defaultLimit: 5 });
    const collection = api.addCollection('collection1').setMetadata({ title: 'Test Collection 1' });
    api.addManyItems(collection, 5);
    api.addCollectionsExtension().addItemsExtension().addSearchExtension();
    await api.createServer(worker);
    await page.goto(api.root.getSearchPath());
  });

  test('module initializes with correct default state', async ({ page }) => {
    const state = await getSearchState(page);
    expect(state.itemFilters.datetime).toBeNull();
    expect(state.itemFilters.bbox).toBeNull();
    expect(state.itemFilters.limit).toBeNull();
    expect(state.itemFilters.filters).toBeNull();
    expect(state.collectionFilters.filters).toBeNull();
    expect(state.carryFromCollectionSearch).toBe(false);
    expect(state.droppedFilters).toEqual({ Global: [], Collections: [], Items: [] });
    expect(state.getters.hasActiveFilters).toBe(false);
    expect(state.getters.hasCollectionSearchCriteria).toBe(false);
    expect(state.getters.hasDroppedFilters).toBe(false);
  });

  test('datetime, bbox and limit are per-bucket, not aliased across search modes', async ({ page }) => {
    await commitToStore(page, 'search/setCollectionFilters', {
      datetime: DATETIME,
      limit: 10,
    });
    const state = await getSearchState(page);
    expect(state.collectionFilters.datetime).toBe(DATETIME);
    expect(state.collectionFilters.limit).toBe(10);
    // Writing to one bucket must not leak into the other; carry-over happens
    // only at navigation, gated on the target's conformance.
    expect(state.itemFilters.datetime).toBeNull();
    expect(state.itemFilters.limit).toBeNull();
  });

  test('itemFilters and collectionFilters are independent', async ({ page }) => {
    await commitToStore(page, 'search/setItemFilters', { q: ['sentinel'] });
    await commitToStore(page, 'search/setCollectionFilters', { q: ['landsat'] });
    const state = await getSearchState(page);
    expect(state.itemFilters.q).toEqual(['sentinel']);
    expect(state.collectionFilters.q).toEqual(['landsat']);
  });

  test('reset clears all state', async ({ page }) => {
    await commitToStore(page, 'search/setItemFilters', {
      datetime: DATETIME,
      q: ['sentinel'],
    });
    await commitToStore(page, 'search/setCarryFromCollectionSearch', true);
    await commitToStore(page, 'search/reset');
    const state = await getSearchState(page);
    expect(state.itemFilters.datetime).toBeNull();
    expect(state.itemFilters.q).toEqual([]);
    expect(state.collectionFilters.q).toEqual([]);
    expect(state.carryFromCollectionSearch).toBe(false);
    expect(state.droppedFilters).toEqual({ Global: [], Collections: [], Items: [] });
  });

  test('resetting a bucket disarms the carry-over', async ({ page }) => {
    await commitToStore(page, 'search/setCarryFromCollectionSearch', true);
    await commitToStore(page, 'search/resetItemFilters');
    let state = await getSearchState(page);
    expect(state.carryFromCollectionSearch).toBe(false);

    await commitToStore(page, 'search/setCarryFromCollectionSearch', true);
    await commitToStore(page, 'search/resetCollectionFilters');
    state = await getSearchState(page);
    expect(state.carryFromCollectionSearch).toBe(false);
  });

  test('getters reflect current state correctly', async ({ page }) => {
    await commitToStore(page, 'search/setItemFilters', { limit: 20, q: ['sentinel'] });
    await commitToStore(page, 'search/setCollectionFilters', { q: ['landsat'] });
    const state = await getSearchState(page);
    expect(state.getters.hasActiveFilters).toBe(true);
    expect(state.getters.hasCollectionSearchCriteria).toBe(true);
    expect(state.getters.itemSearchParams.limit).toBe(20);
    expect(state.getters.itemSearchParams.q).toEqual(['sentinel']);
    expect(state.getters.collectionSearchParams.q).toEqual(['landsat']);
  });

  test('presentational settings alone are no search criteria', async ({ page }) => {
    await commitToStore(page, 'search/setCollectionFilters', { sortby: 'title', limit: 10 });
    const state = await getSearchState(page);
    expect(state.getters.hasActiveFilters).toBe(true);
    expect(state.getters.hasCollectionSearchCriteria).toBe(false);
  });
});

test.describe('Filter carry-over into item search', () => {

  test.beforeEach(async ({ worker, page }) => {
    const api = API.minimalApi({}, { defaultLimit: 5 });
    const collection = api.addCollection('collection1').setMetadata({ title: 'Test Collection 1' });
    api.addManyItems(collection, 5);
    api.addCollectionsExtension().addItemsExtension().addSearchExtension();
    await api.createServer(worker);
    await page.goto(api.root.getSearchPath());
  });

  test('conformance-gated fields are carried or dropped; the collection search is untouched', async ({ page }) => {
    await commitToStore(page, 'search/setCollectionFilters', {
      q: ['sentinel'],
      datetime: DATETIME,
      limit: 10,
    });

    await dispatchCarryToItemSearch(page, []);

    const state = await getSearchState(page);
    // The test API supports basic filters for Features, but no free-text
    expect(state.itemFilters.datetime).toBe(DATETIME);
    expect(state.itemFilters.limit).toBe(10);
    expect(state.itemFilters.q).toEqual([]);
    expect(state.droppedFilters.Items).toContainEqual({ type: 'freeText', terms: ['sentinel'] });
    // Non-destructive: the collection search keeps all its criteria
    expect(state.collectionFilters.q).toEqual(['sentinel']);
    expect(state.collectionFilters.datetime).toBe(DATETIME);
    expect(state.collectionFilters.limit).toBe(10);
  });

  test('sortby is validated against the target sortables and translated to item properties', async ({ page }) => {
    await commitToStore(page, 'search/setCollectionFilters', { sortby: '-title', q: ['sentinel'] });

    // The test API advertises item-search#sort, but no sort for Features
    await dispatchCarryToItemSearch(page, [], { targetType: 'Items' });
    let state = await getSearchState(page);
    expect(state.itemFilters.sortby).toBeNull();
    expect(state.droppedFilters.Items).toContainEqual({ type: 'sort', sortby: '-title' });

    // Without advertised sortables, the collection field is translated to the
    // matching default item property
    await dispatchCarryToItemSearch(page, [], { targetType: 'Global' });
    state = await getSearchState(page);
    expect(state.itemFilters.sortby).toBe('-properties.title');
    expect(state.droppedFilters.Global.filter(f => f.type === 'sort')).toHaveLength(0);

    // Advertised sortables win over the fallback
    await dispatchCarryToItemSearch(page, [], { targetType: 'Global', sortables: ['title'] });
    state = await getSearchState(page);
    expect(state.itemFilters.sortby).toBe('-title');

    // A field that is not sortable at the target is dropped despite sort support
    await commitToStore(page, 'search/setCollectionFilters', { sortby: 'keywords' });
    await dispatchCarryToItemSearch(page, [], { targetType: 'Global', sortables: ['properties.datetime'] });
    state = await getSearchState(page);
    expect(state.itemFilters.sortby).toBeNull();
    expect(state.droppedFilters.Global).toContainEqual({ type: 'sort', sortby: 'keywords' });
  });

  test('CQL rows are dropped when unsupported or incomplete; the source keeps them', async ({ page }) => {
    await commitToStore(page, 'search/setCollectionFilters', {
      rawFilters: [
        makeRawFilter('eo:cloud_cover'),
        makeRawFilter('s2:mgrs_tile'),
      ],
      filterLogic: { andOr: 'and', negate: false },
    });

    await dispatchCarryToItemSearch(page, ['eo:cloud_cover']);

    const state = await getSearchState(page);
    // s2:mgrs_tile is unsupported; eo:cloud_cover is supported but the row has
    // no operator class (JSON boundary), so it can't be rebuilt either
    expect(state.itemFilters.rawFilters).toHaveLength(0);
    expect(state.itemFilters.filters).toBeNull();
    const droppedIds = state.droppedFilters.Items.filter(f => f.type === 'cql2').map(f => f.queryable.id);
    expect(droppedIds).toEqual(expect.arrayContaining(['eo:cloud_cover', 's2:mgrs_tile']));
    // Non-destructive: the collection search keeps the filters
    expect(state.collectionFilters.rawFilters).toHaveLength(2);
  });

  test('a failed queryables fetch neither destroys state nor reports filters as unsupported', async ({ page }) => {
    await commitToStore(page, 'search/setCollectionFilters', {
      q: ['sentinel'],
      rawFilters: [makeRawFilter('eo:cloud_cover')],
      filterLogic: { andOr: 'and', negate: false },
    });

    await dispatchCarryToItemSearch(page, ['eo:cloud_cover'], { fail: true });

    const state = await getSearchState(page);
    // The CQL filters are not carried over, but they are also not classified
    // as unsupported, and the collection search keeps them
    expect(state.itemFilters.rawFilters).toHaveLength(0);
    expect(state.itemFilters.filters).toBeNull();
    expect(state.droppedFilters.Items.filter(f => f.type === 'cql2')).toHaveLength(0);
    expect(state.collectionFilters.rawFilters).toHaveLength(1);
  });

  test('item-only fields survive the carry-over', async ({ page }) => {
    await commitToStore(page, 'search/setItemFilters', { ids: ['item1'], collections: ['collection1'] });
    await commitToStore(page, 'search/setCollectionFilters', { q: ['sentinel'] });

    await dispatchCarryToItemSearch(page, []);

    const state = await getSearchState(page);
    expect(state.itemFilters.ids).toEqual(['item1']);
    expect(state.itemFilters.collections).toEqual(['collection1']);
  });

  test('repeating the carry-over for another collection re-evaluates from the collection search', async ({ page }) => {
    await commitToStore(page, 'search/setCollectionFilters', { datetime: DATETIME });

    await dispatchCarryToItemSearch(page, []);
    // Simulate the user changing the item filters in between
    await commitToStore(page, 'search/setItemFilters', { datetime: null, q: ['sentinel'] });
    await dispatchCarryToItemSearch(page, []);

    const state = await getSearchState(page);
    // The next collection gets the collection search criteria again
    expect(state.itemFilters.datetime).toBe(DATETIME);
    expect(state.itemFilters.q).toEqual([]);
  });
});
