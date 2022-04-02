<template>
  <b-row>
      <b-col md="3" class="label" :title="field" v-html="label" />
      <b-col v-if="itemOrder.length" md="12" class="value mt-2">
        <MetadataTable v-bind="$props" />
      </b-col>
      <b-col v-else md="9" class="value" v-html="formatted" />
  </b-row>
</template>

<script>
import EntryMixin from './EntryMixin';

export default {
  name: "MetadataEntry",
  mixins: [
    EntryMixin
  ],
  components: {
    MetadataTable: () => import('./MetadataTable.vue')
  }
};
</script>