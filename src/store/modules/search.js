const defaultShared = () => ({
  datetime: null,   
  bbox: null,       
  limit: null,      
});

const defaultFilterSet = () => ({
  q: null,
  ids: [],
  sortby: null,
  queryableFilters: [],  
  cql2: null,            
});

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
    updateShared({ commit }, patch) {
      commit('setShared', patch);
    },

    updateItemFilters({ commit }, filters) {
      commit('setItemFilters', filters);
    },

    updateCollectionFilters({ commit }, filters) {
      commit('setCollectionFilters', filters);
    },

    reset({ commit }) {
      commit('resetAll');
    },
  },
};