<template>
  <b-table
    class="metadata-table" :items="tblItems" :fields="tblFields" variant="light"
    responsive small
    sticky-header striped
    v-bind="tblTexts"
  >
    <template #head()="data">
      <span v-html="data.label" />
    </template>
    <template #cell()="data">
      <Histogram v-if="data.field.key === 'histogram'" :data="data.unformatted" />
      <span v-else v-html="data.value" />
    </template>
  </b-table>
</template>

<script>
import { BTable } from 'bootstrap-vue';
import EntryMixin from './EntryMixin';
import StacFieldsMixin from '../StacFieldsMixin';
import Utils from '../../utils';
import { format } from '@radiantearth/stac-fields';

export default {
  name: 'MetadataTable',
  components: {
    BTable,
    Histogram: () => import('./Histogram.vue')
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
      if (Utils.isObject(this.value)) {
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
      let fields = [];
      for(let key of this.itemOrder) {
        let col = this.items[key];
        fields.push({
          key,
          label: col.label,
          sortable: col.sortable,
          formatter: this.formatCell.bind(this),
          default: col.default
        });
      }
      if (Utils.isObject(this.value)) {
        fields.unshift({
          key: '_id',
          sortable: true,
          isRowHeader: true
        });
      }
      return fields;
    }
  },
  methods: {
    formatCell(value, key, item) {
      let spec = this.items[key];
      // ToDo: Set context (third param)?
      if (typeof spec.default !== 'undefined' && (typeof value === 'undefined' || value === null)) {
        value = spec.default;
      }
      return this.format(value, key, NaN, item, spec);
    }
  }
};
</script>

<style>
#stac-browser .metadata-table .table thead th {
  vertical-align: middle;
}

/*
  Fix an issue in vue-bootstrap v2.22.0:
  https://github.com/bootstrap-vue/bootstrap-vue/issues/6961 */
.b-table-sticky-header > .table.b-table > thead > tr > th {
  position: sticky !important;
}
</style>