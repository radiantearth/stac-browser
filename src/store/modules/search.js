// src/store/modules/search.js

export const SEARCH_MODULE_KEY = 'search';

// URL prefix for search state params (e.g. "s.datetime")
export const URL_PREFIX = 's.';

const defaultShared = () => ({
  datetime: null,   // string | null — ISO8601 interval "start/end" or instant
  bbox: null,       // [west, south, east, north] | null
  limit: null,      // number | null — null means "use server default"
});

const defaultFilterSet = () => ({
  q: null,
  ids: [],
  sortby: null,
  queryableFilters: [],  // [{ id, operator, value }] — structured, UI-bound
  cql2: null,            // serialized Cql object | null — handed to API
});

export default {
  namespaced: true,

  state: () => ({
    shared: defaultShared(),
    collectionFilters: defaultFilterSet(),
    itemFilters: defaultFilterSet(),
    queryablesCache: {},  // { [href]: Queryable[] }
    droppedFilters: [],   // [{ field, reason }] — feeds the toast in Phase 4
  }),

  getters: {
    // Full merged filter objects ready to hand to Utils.addFiltersToLink
    collectionSearchParams: (state) => ({
      ...state.shared,
      ...state.collectionFilters,
    }),
    itemSearchParams: (state) => ({
      ...state.shared,
      ...state.itemFilters,
    }),

    hasActiveFilters: (state) => {
      const s = state.shared;
      const f = state.itemFilters;
      return !!(s.datetime || s.bbox || s.limit || f.q ||
        f.ids.length || f.sortby || f.queryableFilters.length || f.cql2);
    },

    hasDroppedFilters: (state) => state.droppedFilters.length > 0,

    cachedQueryables: (state) => (href) => state.queryablesCache[href] || null,
  },

  mutations: {
    setShared(state, patch) {
      state.shared = { ...state.shared, ...patch };
    },
    setCollectionFilters(state, patch) {
      state.collectionFilters = { ...state.collectionFilters, ...patch };
    },
    setItemFilters(state, patch) {
      state.itemFilters = { ...state.itemFilters, ...patch };
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
  },

  actions: {
    // Convenience: update shared fields (datetime, bbox, limit)
    updateShared({ commit }, patch) {
      commit('setShared', patch);
    },

    // Convenience: replace the full item filter set
    updateItemFilters({ commit }, filters) {
      commit('setItemFilters', filters);
    },

    // Convenience: replace the full collection filter set
    updateCollectionFilters({ commit }, filters) {
      commit('setCollectionFilters', filters);
    },

    // Clear everything — called on catalog reset
    reset({ commit }) {
      commit('resetAll');
    },
  },
};