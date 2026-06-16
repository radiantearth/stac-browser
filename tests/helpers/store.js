/**
 * Shared Playwright helpers for accessing the Vuex store from browser callbacks.
 * Provides a single place to update if a better approach becomes available later.
 */

/**
 * Waits for the Vuex store to be ready, then commits a mutation.
 *
 * @param {import('@playwright/test').Page} page
 * @param {string} mutation - Fully-namespaced mutation name (e.g. 'search/setShared').
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
 *   shared: object,
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
      shared: { ...s.shared },
      collectionFilters: { ...s.collectionFilters },
      itemFilters: { ...s.itemFilters },
      droppedFilters: [...s.droppedFilters],
      getters: {
        hasActiveFilters: store.getters['search/hasActiveFilters'],
        hasDroppedFilters: store.getters['search/hasDroppedFilters'],
        itemSearchParams: { ...store.getters['search/itemSearchParams'] },
        collectionSearchParams: { ...store.getters['search/collectionSearchParams'] },
      }
    };
  });
}