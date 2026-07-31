/**
 * Shared Playwright helpers for accessing the Vuex store from browser callbacks.
 * Provides a single place to update if a better approach becomes available later.
 */

/**
 * Waits for the Vuex store to be ready, then commits a mutation.
 *
 * @param {import('@playwright/test').Page} page
 * @param {string} mutation - Fully-namespaced mutation name (e.g. 'search/setItemFilters').
 * @param {*} [payload] - Optional mutation payload.
 */
export async function commitToStore(page, mutation, payload) {
  await page.waitForFunction(
    ({ mutation, payload }) => {
      const store = document.querySelector('[data-v-app]')
        ?.__vue_app__?.config?.globalProperties?.$store;

      if (!store?.state?.search || !store.state.browserReady) return false;
      store.commit(mutation, payload);
      return true;
    },
    { mutation, payload },
    { timeout: 10000 }
  );
}

/**
 * Waits for the Vuex store to be ready, then returns a plain snapshot of
 * `state.search` along with the relevant search getters.
 *
 * @param {import('@playwright/test').Page} page
 * @returns {Promise<{
 *   collectionFilters: object,
 *   itemFilters: object,
 *   carryFromCollectionSearch: boolean,
 *   droppedFilters: {Global: Array, Collections: Array, Items: Array},
 *   getters: {
 *     hasActiveFilters: boolean,
 *     hasCollectionSearchCriteria: boolean,
 *     hasDroppedFilters: boolean,
 *     itemSearchParams: object,
 *     collectionSearchParams: object,
 *   }
 * } | null>}
 */
export async function getSearchState(page) {
  await page.waitForFunction(() => {
    const store = document.querySelector('[data-v-app]')
      ?.__vue_app__?.config?.globalProperties?.$store;
    return store?.state?.search !== undefined && store.state.browserReady;
  }, { timeout: 10000 });

  return page.evaluate(() => {
    const store = document.querySelector('[data-v-app]')
      ?.__vue_app__?.config?.globalProperties?.$store;
    const s = store?.state?.search;
    if (!s) return null;
    // CQL operator classes and Cql instances don't serialize across the page
    // boundary; replace them with markers that can be asserted on.
    const sanitizeRow = (row) => {
      if (!('operator' in row)) {
        return { ...row };
      }
      const { operator, ...rest } = row;
      return { ...rest, hasOperator: typeof operator === 'function' };
    };
    const sanitizeFilterSet = (filterSet) => ({
      ...filterSet,
      filters: filterSet.filters ? '<cql>' : null,
      rawFilters: (filterSet.rawFilters || []).map(sanitizeRow),
    });
    const sanitizeParams = (params) => ({
      ...params,
      filters: params.filters ? '<cql>' : null,
    });
    return {
      collectionFilters: sanitizeFilterSet(s.collectionFilters),
      itemFilters: sanitizeFilterSet(s.itemFilters),
      carryFromCollectionSearch: s.carryFromCollectionSearch,
      droppedFilters: {
        Global: (s.droppedFilters.Global || []).map(sanitizeRow),
        Collections: (s.droppedFilters.Collections || []).map(sanitizeRow),
        Items: (s.droppedFilters.Items || []).map(sanitizeRow),
      },
      getters: {
        hasActiveFilters: store.getters['search/hasActiveFilters'],
        hasCollectionSearchCriteria: store.getters['search/hasCollectionSearchCriteria'],
        hasDroppedFilters: store.getters['search/hasDroppedFilters'],
        itemSearchParams: sanitizeParams(store.getters['search/itemSearchParams']),
        collectionSearchParams: sanitizeParams(store.getters['search/collectionSearchParams']),
      }
    };
  });
}

/**
 * Waits for the Vuex store to be ready, then dispatches an action.
 *
 * @param {import('@playwright/test').Page} page
 * @param {string} action - Fully-namespaced action name (e.g. 'search/carryToItemSearch').
 * @param {*} [payload] - Optional action payload. Must be JSON-serializable.
 */
export async function dispatchToStore(page, action, payload) {
  // waitForFunction doesn't await async predicates, so wait for readiness with
  // a synchronous check first and dispatch via evaluate, which awaits promises.
  await page.waitForFunction(
    () => {
      const store = document.querySelector('[data-v-app]')
        ?.__vue_app__?.config?.globalProperties?.$store;
      return Boolean(store?.state?.search && store.state.browserReady);
    },
    undefined,
    { timeout: 10000 }
  );
  await page.evaluate(
    async ({ action, payload }) => {
      const store = document.querySelector('[data-v-app]')
        ?.__vue_app__?.config?.globalProperties?.$store;
      await store.dispatch(action, payload);
    },
    { action, payload }
  );
}
