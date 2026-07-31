import Cql from '../../models/cql2/cql';
import CqlLogicalOperator, { CqlNot } from '../../models/cql2/operators/logical';
import { CQL_JSON, CQL_TEXT, TYPES } from '../../components/ApiCapabilitiesMixin';

// Fields that may be carried over from a collection search into an item search,
// with the capability gating each one. `capability` keys into TYPES[targetType],
// so the same field is gated by a different conformance class depending on where
// the user is going. `null` means the field is always carried.
const CARRY_OVER = {
  q: {
    capability: 'FreeText',
    dropType: 'freeText',
    describe: (value) => ({ terms: [...value] }),
  },
  datetime: { capability: 'BasicFilters', dropType: 'datetime' },
  bbox: { capability: 'BasicFilters', dropType: 'bbox' },
  limit: { capability: null, dropType: null },
};

// All filter fields that hold plain values in a filter set; the remaining
// fields (filters, rawFilters, filterLogic) hold the CQL filters.
export const FILTER_FIELDS = ['q', 'datetime', 'bbox', 'ids', 'collections', 'sortby', 'limit'];

// The subset of FILTER_FIELDS that expresses actual search criteria, as
// opposed to presentational settings such as sort order or page size, which
// may also be set programmatically through defaults. ids and collections only
// exist for item searches and never carry over from a collection search.
const CRITERIA_FIELDS = ['q', 'datetime', 'bbox'];

const isSet = (value) => {
  if (value === null || value === undefined) {
    return false;
  }
  if (Array.isArray(value)) {
    return value.length > 0;
  }
  return true;
};

// Whether the user has entered actual search criteria
const hasSearchCriteria = (filters) => (
  CRITERIA_FIELDS.some(field => isSet(filters[field])) ||
  isSet(filters.rawFilters) ||
  Boolean(filters.filters)
);

const isActive = (filters) => (
  FILTER_FIELDS.some(field => isSet(filters[field])) ||
  isSet(filters.rawFilters) ||
  Boolean(filters.filters)
);

// Fields listed in FILTER_FIELDS, plus the CQL filters
export const defaultFilterSet = () => ({
  q: [],
  datetime: null,
  bbox: null,
  ids: [],
  collections: [],
  sortby: null,
  limit: null,
  filters: null,
  rawFilters: [],
  filterLogic: { andOr: 'and', negate: false },
});

export const freshSearchState = () => ({
  // Each bucket is owned by its search form and is never rewritten by
  // navigation: collectionFilters by the collection search, itemFilters by the
  // item searches (both global and in-collection). Carrying filters from a
  // collection search into an item search only ever writes the item bucket.
  collectionFilters: defaultFilterSet(),
  itemFilters: defaultFilterSet(),
  // The links behind the search results shown last, so that the results can
  // be restored when the user returns to the Search page
  resultsLinks: {
    Collections: null,
    Global: null
  },
  // One-shot flag armed when the user clicks a link in the collection search
  // results and consumed by the collection page to carry the search criteria
  // over into its item filters
  carryOnNextNavigation: false,
  droppedFilters: {
    Global: [],
    Collections: [],
    Items: []
  },
});

const buildSearchParams = (filters) => {
  const rest = { ...filters };
  delete rest.rawFilters;
  delete rest.filterLogic;
  return rest;
};

// Fields to validate a carried sortby against when the target doesn't
// advertise sortables. Keep in sync with the fallback in
// SearchFilter.sortOptions.
const FALLBACK_ITEM_SORT_FIELDS = [
  'id',
  'properties.title',
  'properties.datetime',
  'properties.created',
  'properties.updated',
];

export default {
  namespaced: true,
  state: freshSearchState,

  getters: {
    // Full filter objects ready to hand to Utils.addFiltersToLink
    collectionSearchParams: (state) => buildSearchParams(state.collectionFilters),
    itemSearchParams: (state) => buildSearchParams(state.itemFilters),
    hasActiveFilters: (state) => isActive(state.itemFilters) || isActive(state.collectionFilters),
    hasCollectionSearchCriteria: (state) => hasSearchCriteria(state.collectionFilters),
    hasDroppedFilters: (state) => Object.values(state.droppedFilters).some(arr => arr.length > 0),
  },

  mutations: {
    setCollectionFilters(state, patch) {
      state.collectionFilters = { ...state.collectionFilters, ...patch };
    },
    setItemFilters(state, patch) {
      state.itemFilters = { ...state.itemFilters, ...patch };
    },
    // Full replacement, used by the carry-over so that fields without a carried
    // value return to their defaults instead of keeping stale values.
    seedItemFilters(state, filterSet) {
      state.itemFilters = filterSet;
    },
    setResultsLink(state, { type, link }) {
      if (type in state.resultsLinks) {
        state.resultsLinks[type] = link;
      }
    },
    setCarryOnNextNavigation(state, enabled) {
      state.carryOnNextNavigation = Boolean(enabled);
    },
    resetCollectionFilters(state) {
      state.collectionFilters = defaultFilterSet();
      state.resultsLinks.Collections = null;
    },
    resetItemFilters(state) {
      state.itemFilters = defaultFilterSet();
      state.resultsLinks.Global = null;
    },
    reset(state) {
      Object.assign(state, freshSearchState());
    },
    setDroppedFilters(state, { type, filters }) {
      if (type in state.droppedFilters) {
        state.droppedFilters[type] = filters;
      }
    },
    clearDroppedFilters(state, type) {
      if (type in state.droppedFilters) {
        state.droppedFilters[type] = [];
      }
    },
  },

  actions: {
    /**
     * Carries the collection search criteria over into the item search.
     *
     * Reads only from `collectionFilters` and only writes `itemFilters`, so the
     * collection search always survives and the carry-over can be repeated for
     * each collection the user navigates into.
     *
     * A filter is carried over only if the target mode advertises support for
     * it per the STAC API conformance classes in TYPES. Anything unsupported is
     * recorded in `droppedFilters` so the UI can report it.
     *
     * Callers must ensure there are criteria to carry (see the
     * `hasCollectionSearchCriteria` getter), otherwise the item filters are
     * needlessly reset to the defaults.
     *
     * @param {Object} collection - The STAC collection being navigated into
     * @param {Function} fetchQueryables - Async fn fetching the collection's queryables
     * @param {Function} fetchSortables - Async fn fetching the collection's sortable field names
     * @param {String} targetType - 'Items' (OGC API Features) or 'Global' (STAC item search)
     */
    async carryToItemSearch({ commit, state, rootGetters, rootState }, { collection, fetchQueryables, fetchSortables, targetType = 'Items' }) {
      const source = state.collectionFilters;
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

      const dropped = [];
      // Item-only fields have no counterpart in the collection search and are
      // kept as they are; everything else is either carried or reset.
      const seed = Object.assign(defaultFilterSet(), {
        ids: state.itemFilters.ids,
        collections: state.itemFilters.collections,
      });

      for (const [field, { capability, dropType, describe }] of Object.entries(CARRY_OVER)) {
        const value = source[field];
        if (!isSet(value)) {
          continue;
        }
        if (capability === null || supports(capability)) {
          seed[field] = value;
        } else {
          dropped.push({ type: dropType, ...(describe ? describe(value) : { value }) });
        }
      }

      // Conformance only tells us that the target sorts at all, not that the
      // user's field is sortable there, so validate against the target's
      // sortables. Item properties are usually `properties.`-prefixed while
      // collection fields are not, so also try the prefixed field name.
      // The configured default sort is applied without user interaction and is
      // neither worth carrying over nor warning about.
      if (isSet(source.sortby) && source.sortby !== (rootState.defaultCollectionSort || null)) {
        if (supports('Sort')) {
          const direction = source.sortby.startsWith('-') ? '-' : '';
          const field = direction ? source.sortby.substring(1) : source.sortby;
          let sortables = null;
          try {
            sortables = typeof fetchSortables === 'function' ? await fetchSortables(collection) : null;
          } catch (error) {
            console.error('Failed to load sortables', error);
          }
          if (!Array.isArray(sortables) || sortables.length === 0) {
            // No sortables advertised; validate against the fields the sort
            // form offers by default
            sortables = FALLBACK_ITEM_SORT_FIELDS;
          }
          const candidate = [field, `properties.${field}`].find(f => sortables.includes(f));
          if (candidate) {
            seed.sortby = direction + candidate;
          } else {
            dropped.push({ type: 'sort', sortby: source.sortby });
          }
        } else {
          dropped.push({ type: 'sort', sortby: source.sortby });
        }
      }

      if (Array.isArray(source.rawFilters) && source.rawFilters.length > 0) {
        // Store only plain data for the notification, class instances don't
        // belong into the state
        const describeCqlDrop = (f) => ({
          type: 'cql2',
          id: f.id,
          queryable: { id: f.queryable?.id, title: f.queryable?.title },
        });
        const cqlMode = {
          textMode: rootGetters.supportsConformance(CQL_TEXT),
          jsonMode: rootGetters.supportsConformance(CQL_JSON),
        };
        if (!supports('CqlFilters') || (!cqlMode.textMode && !cqlMode.jsonMode)) {
          source.rawFilters.forEach(f => dropped.push(describeCqlDrop(f)));
        }
        else {
          let queryables = null;
          try {
            queryables = await fetchQueryables(collection);
          } catch (error) {
            // Not knowing the queryables doesn't imply the filters are
            // unsupported, so don't report them as dropped. The CQL filters are
            // not carried over, but remain part of the collection search.
            console.error('Failed to load queryables, not carrying over CQL filters', error);
          }
          if (Array.isArray(queryables)) {
            const supportedIds = new Set(queryables.map(queryable => queryable.id));
            // Rows without an operator class are incomplete and can't be executed
            const compatible = source.rawFilters.filter(f => supportedIds.has(f.queryable.id) && typeof f.operator === 'function');
            source.rawFilters
              .filter(f => !compatible.includes(f))
              .forEach(f => dropped.push(describeCqlDrop(f)));

            if (compatible.length > 0) {
              const { andOr = 'and', negate = false } = source.filterLogic || {};
              const args = compatible.map(f => {
                const filter = new f.operator(f.queryable, f.value);
                return f.negate ? new CqlNot(filter) : filter;
              });
              let logical = CqlLogicalOperator.create(andOr, args);
              if (negate) {
                logical = new CqlNot(logical);
              }
              seed.filters = new Cql(logical, cqlMode);
              seed.rawFilters = compatible;
              seed.filterLogic = { andOr, negate };
            }
          }
        }
      }

      commit('seedItemFilters', seed);
      commit('setDroppedFilters', { type: targetType, filters: dropped });
    }
  }
};
