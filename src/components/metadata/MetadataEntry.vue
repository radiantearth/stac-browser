<template>
  <b-row>
    <b-col md="3" class="label" :title="field" v-html="label" />
    <b-col v-if="showTable" md="12" class="value mt-2">
      <MetadataTable v-bind="$props" />
    </b-col>
    <b-col v-else md="9" class="value" v-html="formatted" />
  </b-row>
</template>

<script>
import EntryMixin from './EntryMixin';
import Utils from '../../utils';

export default {
  name: "MetadataEntry",
  components: {
    MetadataTable: () => import('./MetadataTable.vue')
  },
  mixins: [
    EntryMixin
  ],
  computed: {
    showTable() {
      return this.itemOrder.length > 0 && Utils.size(this.value) >= 3;
    }
  }
};
</script>