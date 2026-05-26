<template>
  <b-table :items="items" :fields="fields" small bordered sticky-header="250px" />
</template>

<script>
import { BTable } from 'bootstrap-vue';
export default {
  name: 'LabelTable',
  components: { BTable },
  props: {
    items: { type: Array, required: true },
    nameLabel: { type: String, default: 'Name' }
  },
  computed: {
    fields() {
      return [
        { key: 'label', label: this.nameLabel },
        { key: 'id', label: 'ID' }
      ];
    }
  }
};
</script>
