/**
 * Dispatches search/resetForCollection with a controlled fetchQueryables stub.
 *
 * @param {import('@playwright/test').Page} page
 * @param {string[]} supportedIds - Queryable IDs the destination collection supports.
 */
export async function dispatchResetForCollection(page, supportedIds) {
  await page.waitForFunction(
    async (supportedIds) => {
      const store = document.querySelector('[data-v-app]')
        ?.__vue_app__?.config?.globalProperties?.$store;
      if (!store?.state?.search || !store.state.browserReady) return false;
      await store.dispatch('search/resetForCollection', {
        collection: {},
        fetchQueryables: async () => supportedIds.map(id => ({ id })),
      });
      return true;
    },
    supportedIds,
    { timeout: 10000 }
  );
}
/**
 * Creates a minimal raw filter row that survives JSON serialization across the page boundary. 
 *
 * @param {string} queryableId
 * @param {{ negate?: boolean }} [options]
 */
export function makeRawFilter(queryableId, { negate = false } = {}) {
  return {
    id: `${queryableId}-test`,
    queryable: { id: queryableId },
    value: null,
    operator: null,
    negate,
  };
}