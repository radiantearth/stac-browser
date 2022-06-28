const FEATURES_CORE = 'http://www.opengis.net/spec/ogcapi-features-1/1.*/conf/core';

const CQL_TEXT = 'http://www.opengis.net/spec/cql2/1.*/conf/cql2-text';
const CQL_JSON = 'http://www.opengis.net/spec/cql2/1.*/conf/cql2-json';

const ITEMSEARCH_SORT = 'https://api.stacspec.org/v1.*/item-search#sort';
const COLLECTION_ITEMS_SORT = 'https://api.stacspec.org/v1.*/ogcapi-features#sort';

// Add wildcard at the end to work around stac-fastapi issue: https://github.com/stac-utils/stac-fastapi/pull/417
const ITEMSEARCH_FILTER = 'https://api.stacspec.org/v1.*/item-search#filter*';
// Check for the OGC API conformance class until 
const COLLECTION_ITEMS_FILTER = 'http://www.opengis.net/spec/ogcapi-features-3/1.*/*/features-filter';

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