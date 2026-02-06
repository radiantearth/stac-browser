<template>
  <b-row>
    <b-col :md="showTable ? 12 : 3" class="label" :title="field">
      <span v-html="label" />
    </b-col>
    <b-col v-if="showTable" md="12" class="value mt-2">
      <MetadataTable v-bind="$props" />
    </b-col>
    <b-col v-else md="9" class="value">
      <Histogram v-if="field === 'histogram' && isObject" :data="value" />
      <StorageSchemes v-else-if="field === 'storage:schemes' && isObject" :data="value" />
      <div v-else v-html="formatted" />
    </b-col>
  </b-row>
</template>

<script>
import EntryMixin from './EntryMixin';
import Utils from '../../utils';

const FORCE_TABLE = [
  'languages',
  'eo:bands',
  'raster:bands',
  'bands'
];

export default {
  name: "MetadataEntry",
  components: {
    Histogram: () => import('./Histogram.vue'),
    MetadataTable: () => import('./MetadataTable.vue'),
    StorageSchemes: () => import('./StorageSchemes.vue')
  },
  mixins: [
    EntryMixin
  ],
  computed: {
    showTable() {
      return FORCE_TABLE.includes(this.field) || this.itemOrder.length > 0 && Utils.size(this.value) >= 3;
    },
    isObject() {
      return Utils.isObject(this.value);
    }
  }
};
</script>
