<template>
  <b-table class="metadata-table" :items="tblItems" :fields="tblFields" variant="light" responsive small sticky-header striped>
    <template #head()="data">
      <span v-html="data.label" />
    </template>
  </b-table>
</template>

<script>
import { BTable } from 'bootstrap-vue';
import EntryMixin from './EntryMixin';
import Utils from '../../utils';

export default {
  name: 'MetadataTable',
  mixins: [
    EntryMixin
  ],
  components: {
    BTable
  },
  computed: {
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
          sortable: col.sortable
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
  }
}
</script>

<style>
#stac-browser .metadata-table .table thead th {
  vertical-align: middle;
}
</style>