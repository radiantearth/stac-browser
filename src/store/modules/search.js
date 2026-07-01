import Cql from '../../models/cql2/cql';
import CqlLogicalOperator, { CqlNot } from '../../models/cql2/operators/logical';

const SHARED_FIELDS = ['datetime', 'bbox', 'limit'];

const defaultShared = () => ({
  datetime: null,   
  bbox: null,       
  limit: null,      
});

const defaultFilterSet = () => ({
  q: [],
  ids: [],
  collections: [],
  sortby: null,
  filters: null,
  rawFilters: [],
  filterLogic: { andOr: 'and', negate: false },
});

function splitShared(patch) {
  const shared = {};
  const rest = {};
  for (const [key, value] of Object.entries(patch)) {
    if (SHARED_FIELDS.includes(key)) {
      shared[key] = value;
    } else {
      rest[key] = value;
    }
  }
  return { shared, rest };
}

export default {
  namespaced: true,
  state: () => ({
    shared: defaultShared(),
    collectionFilters: defaultFilterSet(),
    itemFilters: defaultFilterSet(),
    queryablesCache: {},  
    droppedFilters: [],   
  }),

  getters: {
    // Full merged filter objects ready to hand to Utils.addFiltersToLink
    collectionSearchParams: (state) => {
      const rest = { ...state.collectionFilters };
      delete rest.rawFilters;
      delete rest.filterLogic;
      return { ...state.shared, ...rest };
    },
    itemSearchParams: (state) => {
      const rest = { ...state.itemFilters };
      delete rest.rawFilters;
      delete rest.filterLogic;
      return { ...state.shared, ...rest };
    },
    hasActiveFilters: (state) => {
      const s = state.shared;
      const isActive = (f) => (
        (Array.isArray(f.q) && f.q.length > 0) ||
        (Array.isArray(f.ids) && f.ids.length > 0) ||
        (Array.isArray(f.collections) && f.collections.length > 0) ||
        Boolean(f.sortby) ||
        Boolean(f.filters)
      );
      return Boolean(s.datetime || s.bbox || s.limit) || isActive(state.itemFilters) || isActive(state.collectionFilters);
    },
    hasDroppedFilters: (state) => state.droppedFilters.length > 0,
    cachedQueryables: (state) => (href) => state.queryablesCache[href] || null,
  },

  mutations: {
    setShared(state, patch) {
      state.shared = { ...state.shared, ...patch };
    },
    setCollectionFilters(state, patch) {
      const { shared, rest } = splitShared(patch);
      state.shared = { ...state.shared, ...shared };
      state.collectionFilters = { ...state.collectionFilters, ...rest };
    },
    setItemFilters(state, patch) {
      const { shared, rest } = splitShared(patch);
      state.shared = { ...state.shared, ...shared };
      state.itemFilters = { ...state.itemFilters, ...rest };
    },
    resetShared(state) {
      state.shared = defaultShared();
    },
    resetCollectionFilters(state) {
      state.collectionFilters = defaultFilterSet();
    },
    resetItemFilters(state) {
      state.itemFilters = defaultFilterSet();
    },
    resetAll(state) {
      state.shared = defaultShared();
      state.collectionFilters = defaultFilterSet();
      state.itemFilters = defaultFilterSet();
      state.droppedFilters = [];
    },
    cacheQueryables(state, { href, queryables }) {
      state.queryablesCache = { ...state.queryablesCache, [href]: queryables };
    },
    setDroppedFilters(state, dropped) {
      state.droppedFilters = dropped;
    },
    clearDroppedFilters(state) {
      state.droppedFilters = [];
    },
    clearDroppedFiltersByType(state, type) {
      state.droppedFilters = state.droppedFilters.filter(f => f.type !== type);
    },
  },
  /**
 * Called when the user navigates from collection search into a specific collection.
 *
 * Collection search filters don't all carry over to item search. Free-text terms
 * and sort are dropped since item search on most APIs doesn't support them. 
 * The unsupported filters are dropped, compatible ones are rebuilt and applied to itemFilters.
 *
 * All dropped filters are recorded in `droppedFilters` so the UI can notify the
 * user via a warning banner when they open the item filter panel.
 *
 * @param {Object} collection - The STAC collection being navigated into
 * @param {Function} fetchQueryables - Async function that fetches the collection's queryables
 */
  actions: {
    async migrateFiltersToCollection({ commit, state }, { collection, fetchQueryables }) {
      commit('clearDroppedFilters');

      const raw = state.itemFilters.rawFilters;
      const q = state.collectionFilters.q; // ← read q and sortby before any reset commits
      const sortby = state.collectionFilters.sortby;
      
      const hasCql = Array.isArray(raw) && raw.length > 0;
      const hasFreeText = Array.isArray(q) && q.length > 0;
      const hasSort = Boolean(sortby);

      if (!hasCql && !hasFreeText && !hasSort) {
        return;
      }

      const dropped = [];

      // --- free-text descriptor ---
      if (hasFreeText) {
        dropped.push({ type: 'freeText', terms: [...q] });
      }
      if (hasSort) {
        dropped.push({ type: 'sort', sortby }); 
      }
      // --- CQL2 reconciliation ---
      if (hasCql) {
        let queryables = [];
        try {
          queryables = await fetchQueryables(collection);
        } catch (e) {
          console.error('failed to fetch queryables for reconciliation', e);
          commit('resetAll');
          return;
        }

        const supportedIds = new Set(queryables.map(queryable => queryable.id));
        const compatible = raw.filter(f => supportedIds.has(f.queryable.id));
        const cqlDropped = raw.filter(f => !supportedIds.has(f.queryable.id));

        // wrap each dropped CQL2 filter with a type field
        cqlDropped.forEach(f => dropped.push({ type: 'cql2', ...f }));

        const { andOr, negate } = state.itemFilters.filterLogic;

        let rebuiltCql = null;
        if (compatible.length > 0 && compatible.every(f => f.operator)) {
          const args = compatible.map(f => {
            let filter = new f.operator(f.queryable, f.value);
            return f.negate ? new CqlNot(filter) : filter;
          });
          let logical = CqlLogicalOperator.create(andOr, args);
          if (negate) { logical = new CqlNot(logical); }
          rebuiltCql = new Cql(logical, null);
        }

        commit('resetCollectionFilters');
        commit('setDroppedFilters', dropped);
        commit('setItemFilters', {
          filters: rebuiltCql,
          rawFilters: compatible,
          filterLogic: { andOr, negate },
        });
      } else {
        // only free-text was active, no CQL2 to reconcile
        commit('resetCollectionFilters');
        commit('setDroppedFilters', dropped);
      }
    }
  }
};
