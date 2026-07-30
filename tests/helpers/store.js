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
 *   droppedFilters: Array,
 *   getters: {
 *     hasActiveFilters: boolean,
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
    return {
      collectionFilters: { ...s.collectionFilters },
      itemFilters: { ...s.itemFilters },
      droppedFilters: [...(s.droppedFilters.Items || [])],
      getters: {
        hasActiveFilters: store.getters['search/hasActiveFilters'],
        hasDroppedFilters: store.getters['search/hasDroppedFilters'],
        itemSearchParams: { ...store.getters['search/itemSearchParams'] },
        collectionSearchParams: { ...store.getters['search/collectionSearchParams'] },
      }
    };
  });
}

/**
 * Waits for the Vuex store to be ready, then dispatches an action.
 *
 * @param {import('@playwright/test').Page} page
 * @param {string} action - Fully-namespaced action name (e.g. 'search/migrateFiltersToCollection').
 * @param {*} [payload] - Optional action payload. Must be JSON-serializable.
 */
export async function dispatchToStore(page, action, payload) {
  await page.waitForFunction(
    async ({ action, payload }) => {
      const store = document.querySelector('[data-v-app]')
        ?.__vue_app__?.config?.globalProperties?.$store;
      if (!store?.state?.search || !store.state.browserReady) return false;
      await store.dispatch(action, payload);
      return true;
    },
    { action, payload },
    { timeout: 10000 }
  );
}
