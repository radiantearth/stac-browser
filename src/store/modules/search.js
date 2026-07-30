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
    droppedFilters: {
      Global: [],
      Collections: [],
      Items: []
    },
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
    hasDroppedFilters: state => Object.values(state.droppedFilters).some(arr => arr.length > 0),
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
    setDroppedFilters(state, { type, filters }) {
      if (state.droppedFilters[type]) {
        state.droppedFilters[type] = filters;
      }
    },
    clearDroppedFilters(state, type) {
      if (state.droppedFilters[type]) {
        state.droppedFilters[type] = [];
      }
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
      commit('clearDroppedFilters', targetType);

      const capabilities = TYPES[targetType] || {};
      const supports = (capability) => {
        const classes = capabilities[capability];
        if (typeof classes === 'boolean') {return classes;}
        if (!classes) {return false;}
        return rootGetters.supportsConformance(classes);
      };

      const raw = effective(state, 'rawFilters');
      const sortby = effective(state, 'sortby');
      const resolved = {};
      const dropped = [];

      for (const [field, { capability, dropType, describe, empty }] of Object.entries(CARRY_OVER)) {
        const value = effective(state, field);
        if (!isSet(value)) {continue;}

        if (capability === null || supports(capability)) {
          resolved[field] = value;
        } else {
          dropped.push({ type: dropType, ...(describe ? describe(value) : { value }) });
          resolved[field] = empty ? empty() : null; 
        }
      }

      if (isSet(sortby)) {
        if (supports('Sort')) {
          resolved.sortby = sortby;
        } else {
          dropped.push({ type: 'sort', sortby });
          resolved.sortby = null;
        }
      }

      const hasCql = Array.isArray(raw) && raw.length > 0;
      const filterLogic = effective(state, 'filterLogic') || { andOr: 'and', negate: false };
      const { andOr, negate } = filterLogic;
      let validCompatible = [];
      let rebuiltCql = null;

      if (hasCql) {
        let queryables = [];
        try {
          queryables = await fetchQueryables(collection);
        } catch (e) {
          console.error('failed to fetch queryables for reconciliation', e);
          queryables = [];
        }

        const supportedIds = new Set(queryables.map(q => q.id));
        validCompatible = raw.filter(f => supportedIds.has(f.queryable.id) && f.operator);
        const cqlDropped = raw.filter(f => !supportedIds.has(f.queryable.id));
        const invalidCompatible = raw.filter(f => supportedIds.has(f.queryable.id) && !f.operator);

        cqlDropped.forEach(f => dropped.push({ type: 'cql2', ...f }));
        invalidCompatible.forEach(f => dropped.push({ type: 'cql2', ...f }));

        if (validCompatible.length > 0) {
          const args = validCompatible.map(f => {
            let filter;
            if (typeof f.operator === 'function') {
              filter = new f.operator(f.queryable, f.value);
            } else {
              filter = { queryable: f.queryable, value: f.value };
            }
            return f.negate ? new CqlNot(filter) : filter;
          });
          let logical = CqlLogicalOperator.create(andOr, args);
          if (negate) {
            logical = new CqlNot(logical);
          }
          rebuiltCql = new Cql(logical, null);
        }
      }

      if (hasCql) {
        commit('setItemFilters', {
          ...resolved,
          filters: rebuiltCql,
          rawFilters: validCompatible,
          filterLogic: { andOr, negate },
        });
      } else if (Object.keys(resolved).length > 0 || dropped.length > 0) {
        commit('setItemFilters', resolved);
      }

      if (dropped.length > 0) {
        commit('setDroppedFilters', { type: targetType, filters: dropped });
      }
    }
  }
};
