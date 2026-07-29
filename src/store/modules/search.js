import Cql from '../../models/cql2/cql';
import CqlLogicalOperator, { CqlNot } from '../../models/cql2/operators/logical';
import { TYPES } from '../../components/ApiCapabilitiesMixin';

// Fields that may cross search modes, with the capability gating each one.
// `capability` keys into TYPES[targetType], so the same field is gated by a
// different conformance class depending on where the user is going.
// `null` means the field is not capability-dependent and is always carried.
const CARRY_OVER = {
  q: {
    capability: 'FreeText',
    dropType: 'freeText',
    describe: (value) => ({ terms: [...value] }),
    empty: () => [],
  },
  datetime: { capability: 'BasicFilters', dropType: 'datetime' },
  bbox: { capability: 'BasicFilters', dropType: 'bbox' },
  limit: { capability: null, dropType: null },
};

const isSet = (value) => {
  if (value === null || value === undefined) {
    return false;
  }
  if (Array.isArray(value)) {
    return value.length > 0;
  }
  return true;
};

// Reads a field from whichever bucket the user populated: collection search writes
// to collectionFilters, both global and in-collection item search write to itemFilters.
const effective = (state, field) => {
  const fromCollections = state.collectionFilters[field];
  return isSet(fromCollections) ? fromCollections : state.itemFilters[field];
};

const defaultFilterSet = () => ({
  datetime: null,
  bbox: null,
  limit: null,
  q: [],
  ids: [],
  collections: [],
  sortby: null,
  filters: null,
  rawFilters: [],
  filterLogic: { andOr: 'and', negate: false },
});

const buildSearchParams = (filters) => {
  const rest = { ...filters };
  delete rest.rawFilters;
  delete rest.filterLogic;
  return rest;
};

export default {
  namespaced: true,
  state: () => ({
    collectionFilters: defaultFilterSet(),
    itemFilters: defaultFilterSet(),
    queryablesCache: {},
    droppedFilters: [],
  }),

  getters: {
    // Full filter objects ready to hand to Utils.addFiltersToLink
    collectionSearchParams: (state) => buildSearchParams(state.collectionFilters),
    itemSearchParams: (state) => buildSearchParams(state.itemFilters),
    hasActiveFilters: (state) => {
      const isActive = (f) => (
        Boolean(f.datetime) ||
        Boolean(f.bbox) ||
        Boolean(f.limit) ||
        (Array.isArray(f.q) && f.q.length > 0) ||
        (Array.isArray(f.ids) && f.ids.length > 0) ||
        (Array.isArray(f.collections) && f.collections.length > 0) ||
        Boolean(f.sortby) ||
        Boolean(f.filters)
      );
      return isActive(state.itemFilters) || isActive(state.collectionFilters);
    },
    hasDroppedFilters: (state) => state.droppedFilters.length > 0,
    cachedQueryables: (state) => (href) => state.queryablesCache[href] || null,
  },

  mutations: {
    setCollectionFilters(state, patch) {
      state.collectionFilters = { ...state.collectionFilters, ...patch };
    },
    setItemFilters(state, patch) {
      state.itemFilters = { ...state.itemFilters, ...patch };
    },
    resetCollectionFilters(state) {
      state.collectionFilters = defaultFilterSet();
    },
    resetItemFilters(state) {
      state.itemFilters = defaultFilterSet();
    },
    resetAll(state) {
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

  actions: {
    /**
     * Called when the user navigates into a specific search mode.
     *
     * A filter is carried over only if the target mode advertises support for it
     * per the STAC API conformance classes in TYPES. Anything unsupported is
     * cleared and recorded in `droppedFilters` so the UI can report it.
     *
     * @param {Object} collection - The STAC collection being navigated into
     * @param {Function} fetchQueryables - Async fn fetching the collection's queryables
     * @param {String} targetType - 'Items' (OGC API Features) or 'Global' (STAC item search)
     */
    async migrateFiltersToCollection({ commit, state, rootGetters }, { collection, fetchQueryables, targetType = 'Items' }) {
      commit('clearDroppedFilters');

      const capabilities = TYPES[targetType] || {};
      const supports = (capability) => {
        const classes = capabilities[capability];
        if (typeof classes === 'boolean') {
          return classes;
        }
        if (!classes) {
          return false;
        }
        return rootGetters.supportsConformance(classes);
      };

      const raw = effective(state, 'rawFilters');
      const sortby = effective(state, 'sortby');

      const resolved = {};
      const dropped = [];

      for (const [field, { capability, dropType, describe, empty }] of Object.entries(CARRY_OVER)) {
        const value = effective(state, field);
        if (!isSet(value)) {
          continue;
        }
        if (capability === null || supports(capability)) {
          resolved[field] = value;
        } else {
          dropped.push({ type: dropType, ...(describe ? describe(value) : { value }) });
          resolved[field] = empty ? empty() : null;
        }
      }

      // sortby is dropped even where the target advertises sort support: conformance
      // says the endpoint sorts, not that it sorts by the user's field (item sortables
      // are `properties.`-prefixed). Validating against target sortables is follow-up.
      if (isSet(sortby)) {
        dropped.push({ type: 'sort', sortby });
        resolved.sortby = null;
      }

      const hasCql = Array.isArray(raw) && raw.length > 0;

      if (!hasCql && Object.keys(resolved).length === 0 && dropped.length === 0) {
        return;
      }

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

        cqlDropped.forEach(f => dropped.push({ type: 'cql2', ...f }));

        const { andOr, negate } = state.itemFilters.filterLogic;

        let rebuiltCql = null;
        if (compatible.length > 0 && compatible.every(f => f.operator)) {
          const args = compatible.map(f => {
            let filter = new f.operator(f.queryable, f.value);
            return f.negate ? new CqlNot(filter) : filter;
          });
          let logical = CqlLogicalOperator.create(andOr, args);
          if (negate) {
            logical = new CqlNot(logical);
          }
          rebuiltCql = new Cql(logical, null);
        }

        commit('resetCollectionFilters');
        commit('setDroppedFilters', dropped);
        commit('setItemFilters', {
          ...resolved,
          filters: rebuiltCql,
          rawFilters: compatible,
          filterLogic: { andOr, negate },
        });
      } else {
        commit('resetCollectionFilters');
        commit('setDroppedFilters', dropped);
        if (Object.keys(resolved).length > 0) {
          commit('setItemFilters', resolved);
        }
      }
    }
  }
};