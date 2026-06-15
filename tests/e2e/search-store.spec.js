/**
 * Vuex search module unit tests.
 *
 * Verifies the search Vuex module state shape, mutations, getters, and actions
 * by directly accessing the store through the running browser page.
 */
import { test, expect } from './fixtures.js';
import API from '../fixtures/instances/api.js';
import { commitToStore, getSearchState } from '../helpers/store.js';


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
    expect(state.itemFilters.queryableFilters).toEqual([]);
    expect(state.collectionFilters.queryableFilters).toEqual([]);
    expect(state.droppedFilters).toEqual([]);
    expect(state.getters.hasActiveFilters).toBe(false);
    expect(state.getters.hasDroppedFilters).toBe(false);
  });

  test('setShared updates shared state without affecting filters', async ({ page }) => {
    await commitToStore(page, 'search/setShared', { datetime: '2025-05-01T00:00:00.000Z/2025-05-29T00:00:00.000Z', limit: 10 });
    const state = await getSearchState(page);
    expect(state.shared.datetime).toBe('2025-05-01T00:00:00.000Z/2025-05-29T00:00:00.000Z');
    expect(state.shared.limit).toBe(10);
    expect(state.itemFilters.q).toBeNull();
    expect(state.collectionFilters.q).toBeNull();
  });

  test('itemFilters and collectionFilters are independent', async ({ page }) => {
    await commitToStore(page, 'search/setItemFilters', { q: 'sentinel' });
    await commitToStore(page, 'search/setCollectionFilters', { q: 'landsat' });
    const state = await getSearchState(page);
    expect(state.itemFilters.q).toBe('sentinel');
    expect(state.collectionFilters.q).toBe('landsat');
  });

  test('resetAll clears all state', async ({ page }) => {
    await commitToStore(page, 'search/setShared', { datetime: '2025-05-01T00:00:00.000Z/2025-05-29T00:00:00.000Z' });
    await commitToStore(page, 'search/setItemFilters', { q: 'sentinel' });
    await commitToStore(page, 'search/resetAll');
    const state = await getSearchState(page);
    expect(state.shared.datetime).toBeNull();
    expect(state.itemFilters.q).toBeNull();
    expect(state.collectionFilters.q).toBeNull();
  });

  test('getters reflect current state correctly', async ({ page }) => {
    await commitToStore(page, 'search/setShared', { limit: 20 });
    await commitToStore(page, 'search/setItemFilters', { q: 'sentinel' });
    await commitToStore(page, 'search/setCollectionFilters', { q: 'landsat' });
    const state = await getSearchState(page);
    expect(state.getters.hasActiveFilters).toBe(true);
    expect(state.getters.itemSearchParams.limit).toBe(20);
    expect(state.getters.itemSearchParams.q).toBe('sentinel');
    expect(state.getters.collectionSearchParams.q).toBe('landsat');
  });
});