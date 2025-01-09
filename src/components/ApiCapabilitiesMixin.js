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

const CQL_ADV_COMPARISON = ['http://www.opengis.net/spec/cql2/1.*/conf/advanced-comparison-operators'];

import { mapGetters } from "vuex";

export const TYPES = {
  // OGC / STAC API - Features
  Items: {
    BasicFilters: [
      'https://api.stacspec.org/v1.*/ogcapi-features',
      'http://www.opengis.net/spec/ogcapi-features-1/1.*/conf/core'
    ],
    CollectionIdFilter: false,
    ItemIdFilter: false,
    // It seems some conformance classes use conf (correct) and some req (deprecated?) after the version number
    CqlFilters: ['http://www.opengis.net/spec/ogcapi-features-3/1.*/*/features-filter'],
    Sort: [
      'https://api.stacspec.org/v1.*/ogcapi-features#sort',
      'http://www.opengis.net/spec/ogcapi-records-1/1.*/conf/sorting'
    ],
    FreeText: ['https://api.stacspec.org/v1.*/ogcapi-features#free-text']
  },
  // STAC API - Item Search
  Global:  {
    BasicFilters: ['https://api.stacspec.org/v1.*/item-search'],
    CollectionIdFilter: true,
    ItemIdFilter: true,
    CqlFilters: ['https://api.stacspec.org/v1.*/item-search#filter'],
    Sort: ['https://api.stacspec.org/v1.*/item-search#sort'],
    FreeText: ['https://api.stacspec.org/v1.*/item-search#free-text']
  },
  // OGC / STAC API - Collections
  Collections: {
    BasicFilters: ['https://api.stacspec.org/v1.*/collection-search'],
    CollectionIdFilter: false,
    ItemIdFilter: false,
    CqlFilters: ['https://api.stacspec.org/v1.*/collection-search#filter'],
    Sort: ['https://api.stacspec.org/v1.*/collection-search#sort'],
    FreeText: ['https://api.stacspec.org/v1.*/collection-search#free-text']
  }
};

export default {
  props: {
    type: {
      type: String,
      required: true
    }
  },
  computed: {
    ...mapGetters(['supportsConformance']),

    conformances() {
      return TYPES[this.type];
    },

    canSort() {
      return this.supportsConformance(this.conformances.Sort);
    },
    canFilterExtents() {
      return this.supportsConformance(this.conformances.BasicFilters);
    },
    canFilterFreeText() {
      return this.supportsConformance(this.conformances.FreeText);
    },
    cql() {
      if (!this.supportsConformance(this.conformances.CqlFilters)) {
        return null;
      }
      let textMode = this.supportsConformance(CQL_TEXT);
      let jsonMode = this.supportsConformance(CQL_JSON);
      if (!textMode && !jsonMode) {
        return null;
      }

      return {
        textMode,
        jsonMode,
        advancedComparison: this.supportsConformance(CQL_ADV_COMPARISON)
      };
    }
  }
};
