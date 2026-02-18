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

import { mapState } from 'pinia';
import { useCatalogStore } from '../store/catalog';
import { TYPES } from './conformance-types';

// Re-export TYPES for backward compatibility
export { TYPES };

export default {
  props: {
    type: {
      type: String,
      required: true
    }
  },
  computed: {
    ...mapState(useCatalogStore, ['supportsConformance']),

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
