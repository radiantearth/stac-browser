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

const ITEMSEARCH_SORT = ['https://api.stacspec.org/v1.*/item-search#sort'];
const COLLECTION_ITEMS_SORT = [
  'https://api.stacspec.org/v1.*/ogcapi-features#sort',
  'http://www.opengis.net/spec/ogcapi-records-1/1.*/conf/sorting'
];

// Add wildcard at the end to work around stac-fastapi issue:
// https://github.com/stac-utils/stac-fastapi/pull/417
const ITEMSEARCH_FILTER = ['https://api.stacspec.org/v1.*/item-search#filter*'];
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
    canFilterCql() {
      return this.supportsConformance(ogcapi ? COLLECTION_ITEMS_FILTER : ITEMSEARCH_FILTER)
        && this.cqlModes.includes("Text"); // ToDo: this.cqlModes.length > 0
    },
    cqlModes() {
      let modes = [];
      if (this.supportsConformance(CQL_TEXT)) {
        modes.push('Text');
      }
      if (this.supportsConformance(CQL_JSON)) {
        modes.push('JSON');
      }
      return modes;
    },
    filterComponentProps() {
      return {
        canSort: this.canSort,
        canFilterCql: this.canFilterCql,
        canFilterExtents: this.canFilterExtents
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