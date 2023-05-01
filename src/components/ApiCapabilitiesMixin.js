const FEATURES_CORE = [
  'https://api.stacspec.org/v1.*/ogcapi-features',
  'http://www.opengis.net/spec/ogcapi-features-1/1.*/conf/core'
];

// Add deprecated CQL conformance classes for stac-fastapi:
// https://github.com/stac-utils/stac-fastapi/issues/539
const CQL_TEXT = [
  'https://api.stacspec.org/v1.*/item-search#filter:cql-text', // deprecated
  'http://www.opengis.net/spec/cql2/1.*/conf/cql2-text'
];
const CQL_JSON = [
  'https://api.stacspec.org/v1.*/item-search#filter:cql-json', // deprecated
  'http://www.opengis.net/spec/cql2/1.*/conf/cql2-json'
];

const CQL_ADV_COMPARISON = ['http://www.opengis.net/spec/cql2/1.*/req/advanced-comparison-operators'];

const ITEMSEARCH_SORT = ['https://api.stacspec.org/v1.*/item-search#sort'];
const COLLECTION_ITEMS_SORT = [
  'https://api.stacspec.org/v1.*/ogcapi-features#sort',
  'http://www.opengis.net/spec/ogcapi-records-1/1.*/conf/sorting'
];

const ITEMSEARCH_FILTER = ['https://api.stacspec.org/v1.*/item-search#filter'];
// Check for the OGC API conformance class
// It seems some conformance classes use conf (correct) and some req (deprecated?) after the version number
const COLLECTION_ITEMS_FILTER = ['http://www.opengis.net/spec/ogcapi-features-3/1.*/*/features-filter'];

import { mapGetters } from "vuex";

export default ogcapi => ({
  computed: {
    ...mapGetters(['supportsConformance']),

    canSort() {
      return this.supportsConformance(ogcapi ? COLLECTION_ITEMS_SORT : ITEMSEARCH_SORT);
    },
    canFilterExtents() {
      return ogcapi ? this.supportsConformance(FEATURES_CORE) : true;
    },
    cql() {
      if (!this.supportsConformance(ogcapi ? COLLECTION_ITEMS_FILTER : ITEMSEARCH_FILTER)) {
        return null;
      }
      let textMode = this.supportsConformance(CQL_TEXT);
      let jsonMode = this.supportsConformance(CQL_JSON);
      if (!textMode/* && !jsonMode*/) {
        return null;
      }

      return {
        textMode,
        jsonMode,
        advancedComparison: this.supportsConformance(CQL_ADV_COMPARISON)
      };
    },
    filterComponentProps() {
      return {
        canSort: this.canSort,
        canFilterExtents: this.canFilterExtents,
        cql: this.cql
      };
    }
  },
});

export {
  FEATURES_CORE,
  CQL_TEXT,
  CQL_JSON,
  ITEMSEARCH_SORT,
  COLLECTION_ITEMS_SORT,
  ITEMSEARCH_FILTER,
  COLLECTION_ITEMS_FILTER
};