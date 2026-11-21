<template>
  <b-table
    class="metadata-table" :items="tblItems" :fields="tblFields"
    :class="{ 'metadata-table-fixed': hasFixedColumns }"
    responsive small sticky-header striped
    bordered show-empty v-bind="tblTexts"
  >
    <template #head()="data">
      <span v-html="data.label" />
    </template>
    <template #cell()="data">
      <Histogram v-if="data.field.key === 'histogram' && isObject(data.unformatted)" :data="data.unformatted" />
      <span v-else v-html="data.value" />
    </template>
  </b-table>
</template>

<script>
import EntryMixin from './EntryMixin';
import StacFieldsMixin from '../StacFieldsMixin';
import { isObject } from 'stac-js/src/utils.js';
import { format } from '@radiantearth/stac-fields';
import { defineAsyncComponent } from 'vue';
import { BTable } from 'bootstrap-vue-next';

const MLM_TABLE_ORDER = {
  'mlm:input': ['name', 'description', 'input', 'bands', 'variables'],
  'mlm:output': [
    'name',
    'description',
    'result',
    'bands',
    'variables',
    'tasks',
    'classification:classes'
  ]
};
const MLM_FIXED_WIDTHS = {
  name: 15,
  description: 20,
  input: 25,
  result: 25
};
const MLM_FLEXIBLE_WIDTH_WEIGHTS = {
  bands: 10,
  variables: 15,
  tasks: 20,
  'classification:classes': 25,
  value_scaling: 15,
  resize_type: 10,
  pre_processing_function: 20,
  post_processing_function: 20
};

export default {
  name: 'MetadataTable',
  components: {
    Histogram: defineAsyncComponent(() => import('./Histogram.vue')),
    BTable
  },
  mixins: [
    EntryMixin,
    StacFieldsMixin({ format })
  ],
  computed: {
    tblTexts() {
      return {
        'empty-filtered-text': this.$t('table.emptyFilteredText'),
        'empty-text': this.$t('table.emptyText'),
        'label-sort-asc': this.$t('table.sort.asc'),
        'label-sort-desc': this.$t('table.sort.desc'),
        'label-sort-clear': this.$t('table.sort.clear')
      };
    },
    tblItems() {
      if (this.field === 'mlm:hyperparameters' && isObject(this.value)) {
        return Object.entries(this.value).map(([key, value]) => ({
          _id: key,
          value
        }));
      }
      if (this.field === 'mlm:output' && Array.isArray(this.value)) {
        return this.value.map(item => {
          if (!isObject(item) || !('classification_classes' in item) ||
            'classification:classes' in item) {
            return item;
          }
          const { classification_classes, ...output } = item;
          return {
            ...output,
            'classification:classes': classification_classes
          };
        });
      }
      if (isObject(this.value)) {
        let items = [];
        for(let key in this.value) {
          items.push({
            _id: key,
            ...this.value[key]
          });
        }
        return items;
      }
      else {
        return this.value;
      }
    },
    tblFields() {
      if (this.field === 'mlm:hyperparameters') {
        return [
          {
            key: '_id',
            label: this.$t('fields.Name'),
            sortable: true,
            thStyle: { width: '35%' }
          },
          {
            key: 'value',
            label: this.$t('fields.Value'),
            formatter: this.formatCell.bind(this)
          }
        ];
      }

      const mlmOrder = MLM_TABLE_ORDER[this.field];
      const isMlmTable = mlmOrder !== undefined;
      let keys = this.field === 'mlm:output'
        ? [...new Set(this.itemOrder.map(key =>
          key === 'classification_classes' ? 'classification:classes' : key
        ))]
        : this.itemOrder;
      if (mlmOrder) {
        keys = [
          ...mlmOrder.filter(key => keys.includes(key)),
          ...keys.filter(key => !mlmOrder.includes(key))
        ];
      }

      const visibleKeys = keys;
      const fixedWidthTotal = isMlmTable
        ? visibleKeys.reduce((total, key) => total + (MLM_FIXED_WIDTHS[key] || 0), 0)
        : 0;
      const flexibleKeys = isMlmTable
        ? visibleKeys.filter(key => !MLM_FIXED_WIDTHS[key])
        : [];
      const flexibleWeightTotal = flexibleKeys.reduce(
        (total, key) => total + (MLM_FLEXIBLE_WIDTH_WEIGHTS[key] || 14),
        0
      );
      const stableScale = flexibleKeys.length === 0 && fixedWidthTotal > 0
        ? 100 / fixedWidthTotal
        : 1;
      const availableWidth = flexibleKeys.length > 0 ? 100 - fixedWidthTotal : 0;

      let fields = [];
      for (let key of visibleKeys) {
        let col = this.items[key] ||
          (key === 'classification:classes' ? this.items.classification_classes : undefined) ||
          {};
        const fixedWidth = isMlmTable ? MLM_FIXED_WIDTHS[key] : undefined;
        let width;
        if (fixedWidth) {
          width = fixedWidth * stableScale;
        }
        else if (flexibleWeightTotal > 0) {
          const weight = MLM_FLEXIBLE_WIDTH_WEIGHTS[key] || 14;
          width = availableWidth * weight / flexibleWeightTotal;
        }
        fields.push({
          key,
          label: key === 'classification:classes' ? this.$t('fields.Classes') : col.label,
          sortable: col.sortable,
          thStyle: width !== undefined ? { width: `${width.toFixed(2)}%` } : undefined,
          formatter: this.formatCell.bind(this),
          default: col.default
        });
      }
      if (isObject(this.value)) {
        fields.unshift({
          key: '_id',
          sortable: true,
          isRowHeader: true
        });
      }
      return fields;
    },
    hasFixedColumns() {
      return this.tblFields.some(field => field.thStyle?.width);
    }
  },
  methods: {
    isObject(value) {
      return isObject(value);
    },
    formatCell(value, key, item) {
      let spec = this.items?.[key] ||
        (key === 'classification:classes' ? this.items?.classification_classes : undefined) ||
        {};
      // ToDo: Set context (third param)?
      if (typeof spec.default !== 'undefined' && (typeof value === 'undefined' || value === null)) {
        value = spec.default;
      }
      return this.format(value, key, null, item, spec);
    }
  }
};
</script>

<style>
#stac-browser .metadata-table .table thead th {
  vertical-align: middle;
}

#stac-browser .metadata-table .table td dl,
#stac-browser .metadata-table .table td dd,
#stac-browser .metadata-table .table td ol {
  margin-bottom: 0;
}

#stac-browser .metadata-table .table td dl > dd:has(> ol) {
  display: block;
}

#stac-browser .metadata-table .table td dl > dd:has(> ol)::after {
  content: "";
  white-space: normal;
}

#stac-browser .metadata-table.metadata-table-fixed .table {
  table-layout: fixed;
  width: 100%;
}
</style>
