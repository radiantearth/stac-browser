/**
 * Vuex search module unit tests.
 *
 * Verifies the search Vuex module state shape, mutations, getters, and actions
 * by directly accessing the store through the running browser page.
 */
import { test, expect } from './fixtures.js';
import API from '../fixtures/instances/api.js';
import { commitToStore, getSearchState } from '../helpers/store.js';
import { dispatchMigrateFiltersToCollection, makeRawFilter } from '../helpers/reconciliation.js';

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
    expect(state.shared.datetime).toBeNull();
    expect(state.shared.bbox).toBeNull();
    expect(state.shared.limit).toBeNull();
    expect(state.itemFilters.filters).toBeNull();
    expect(state.collectionFilters.filters).toBeNull();
    expect(state.droppedFilters).toEqual([]);
    expect(state.getters.hasActiveFilters).toBe(false);
    expect(state.getters.hasDroppedFilters).toBe(false);
  });

  test('setShared updates shared state without affecting filters', async ({ page }) => {
    await commitToStore(page, 'search/setShared', { datetime: '2025-05-01T00:00:00.000Z/2025-05-29T00:00:00.000Z', limit: 10 });
    const state = await getSearchState(page);
    expect(state.shared.datetime).toBe('2025-05-01T00:00:00.000Z/2025-05-29T00:00:00.000Z');
    expect(state.shared.limit).toBe(10);
    expect(state.itemFilters.q).toEqual([]);
    expect(state.collectionFilters.q).toEqual([]);
  });

  test('itemFilters and collectionFilters are independent', async ({ page }) => {
    await commitToStore(page, 'search/setItemFilters', { q: ['sentinel'] });
    await commitToStore(page, 'search/setCollectionFilters', { q: ['landsat'] });
    const state = await getSearchState(page);
    expect(state.itemFilters.q).toEqual(['sentinel']);
    expect(state.collectionFilters.q).toEqual(['landsat']);
  });

  test('resetAll clears all state', async ({ page }) => {
    await commitToStore(page, 'search/setShared', { datetime: '2025-05-01T00:00:00.000Z/2025-05-29T00:00:00.000Z' });
    await commitToStore(page, 'search/setItemFilters', { q: 'sentinel' });
    await commitToStore(page, 'search/resetAll');
    const state = await getSearchState(page);
    expect(state.shared.datetime).toBeNull();
    expect(state.itemFilters.q).toEqual([]);
    expect(state.collectionFilters.q).toEqual([]);
  });

  test('getters reflect current state correctly', async ({ page }) => {
    await commitToStore(page, 'search/setShared', { limit: 20 });
    await commitToStore(page, 'search/setItemFilters', { q: ['sentinel'] });
    await commitToStore(page, 'search/setCollectionFilters', { q: ['landsat'] });
    const state = await getSearchState(page);
    expect(state.getters.hasActiveFilters).toBe(true);
    expect(state.getters.itemSearchParams.limit).toBe(20);
    expect(state.getters.itemSearchParams.q).toEqual(['sentinel']);
    expect(state.getters.collectionSearchParams.q).toEqual(['landsat']);
  });
});

test.describe('Filter reconciliation on collection navigation', () => {

  test.beforeEach(async ({ worker, page }) => {
    const api = API.minimalApi({}, { defaultLimit: 5 });
    const collection = api.addCollection('collection1').setMetadata({ title: 'Test Collection 1' });
    api.addManyItems(collection, 5);
    api.addCollectionsExtension().addItemsExtension().addSearchExtension();
    await api.createServer(worker);
    await page.goto(api.root.getSearchPath());
  });

  test('fully compatible filters are preserved and droppedFilters stays empty', async ({ page }) => {
    await commitToStore(page, 'search/setItemFilters', {
      rawFilters: [
        makeRawFilter('eo:cloud_cover'),
        makeRawFilter('platform'),
      ],
      filterLogic: { andOr: 'and', negate: false },
    });

    await dispatchMigrateFiltersToCollection(page, ['eo:cloud_cover', 'platform']);

    const state = await getSearchState(page);
    expect(state.itemFilters.rawFilters).toHaveLength(2);
    expect(state.itemFilters.rawFilters.map(f => f.queryable.id)).toEqual(
      expect.arrayContaining(['eo:cloud_cover', 'platform'])
    );
    expect(state.droppedFilters).toHaveLength(0);
    expect(state.getters.hasDroppedFilters).toBe(false);
  });

  test('partially incompatible filters — compatible subset preserved, droppedFilters populated', async ({ page }) => {
    await commitToStore(page, 'search/setItemFilters', {
      rawFilters: [
        makeRawFilter('eo:cloud_cover'),
        makeRawFilter('platform'),
        makeRawFilter('s2:mgrs_tile'),
      ],
      filterLogic: { andOr: 'and', negate: false },
    });

    await dispatchMigrateFiltersToCollection(page, ['eo:cloud_cover', 'platform']);

    const state = await getSearchState(page);
    expect(state.itemFilters.rawFilters).toHaveLength(2);
    expect(state.itemFilters.rawFilters.map(f => f.queryable.id)).toEqual(
      expect.arrayContaining(['eo:cloud_cover', 'platform'])
    );
    expect(state.droppedFilters).toHaveLength(1);
    expect(state.droppedFilters[0].queryable.id).toBe('s2:mgrs_tile');
    expect(state.getters.hasDroppedFilters).toBe(true);
  });

  test('fully incompatible filters — rawFilters cleared, all added to droppedFilters', async ({ page }) => {
    await commitToStore(page, 'search/setItemFilters', {
      rawFilters: [
        makeRawFilter('eo:cloud_cover'),
        makeRawFilter('platform'),
        makeRawFilter('s2:mgrs_tile'),
      ],
      filterLogic: { andOr: 'and', negate: false },
    });

    await dispatchMigrateFiltersToCollection(page, ['gsd', 'datetime']);

    const state = await getSearchState(page);
    expect(state.itemFilters.rawFilters).toHaveLength(0);
    expect(state.itemFilters.filters).toBeNull();
    expect(state.droppedFilters).toHaveLength(3);
    expect(state.getters.hasDroppedFilters).toBe(true);
  });

  test('no rawFilters — basic filters are left untouched', async ({ page }) => {
    await commitToStore(page, 'search/setShared', { limit: 20 });
    await commitToStore(page, 'search/setItemFilters', { q: ['sentinel'] });

    await dispatchMigrateFiltersToCollection(page, ['eo:cloud_cover']);

    const state = await getSearchState(page);
    expect(state.shared.limit).toBe(20);
    expect(state.itemFilters.q).toEqual(['sentinel']);
    expect(state.droppedFilters).toHaveLength(0);
  });

});