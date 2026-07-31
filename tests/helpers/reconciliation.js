/**
 * Dispatches search/carryToItemSearch with controlled fetchQueryables and
 * fetchSortables stubs.
 *
 * @param {import('@playwright/test').Page} page
 * @param {string[]} supportedIds - Queryable IDs the destination collection supports.
 * @param {{ targetType?: string, fail?: boolean, sortables?: string[] }} [options] - `fail` makes the queryables fetch throw, `sortables` are the field names the destination supports sorting by.
 */
export async function dispatchCarryToItemSearch(page, supportedIds, { targetType = 'Items', fail = false, sortables = [] } = {}) {
  // waitForFunction doesn't await async predicates, so wait for readiness with
  // a synchronous check first and dispatch via evaluate, which awaits promises.
  await page.waitForFunction(
    () => {
      const store = document.querySelector('[data-v-app]')
        ?.__vue_app__?.config?.globalProperties?.$store;
      // The carry-over checks the conformance classes; wait for the root
      // catalog to be loaded like the views dispatching the action do
      return Boolean(store?.state?.search && store.state.browserReady && store.state.conformsTo?.length > 0);
    },
    undefined,
    { timeout: 10000 }
  );
  await page.evaluate(
    async ({ supportedIds, targetType, fail, sortables }) => {
      const store = document.querySelector('[data-v-app]')
        ?.__vue_app__?.config?.globalProperties?.$store;
      await store.dispatch('search/carryToItemSearch', {
        collection: {},
        fetchQueryables: async () => {
          if (fail) {
            throw new Error('Failed to fetch queryables');
          }
          return supportedIds.map(id => ({ id }));
        },
        fetchSortables: async () => sortables,
        targetType,
      });
    },
    { supportedIds, targetType, fail, sortables }
  );
}

/**
 * Creates a minimal raw filter row that survives JSON serialization across the
 * page boundary.
 *
 * Note that real CQL operator classes cannot cross this boundary, so rows
 * created here are always treated as incomplete by the carry-over and dropped
 * even when their queryable is supported. The CQL rebuild with real operator
 * classes needs unit tests instead.
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
