<template>
  <b-card no-body :key="extension" :class="['metadata-card', extension]">
      <b-card-title>
          <span v-if="label" v-html="label" />
          <template v-else>General</template>
      </b-card-title>
      <MetadataEntry v-for="(entry, key) in properties" v-bind="entry" :field="key" :key="key" />
  </b-card>
</template>

<script>
import MetadataEntry from './MetadataEntry.vue';

export default {
  name: "MetadataGroup",
  components: {
    MetadataEntry
  },
  props: {
      label: {
        type: String,
        default: ''
      },
      extension: {
        type: String,
        default: ''
      },
      properties: {
        type: Object,
        required: true
      }
  }
};
</script>