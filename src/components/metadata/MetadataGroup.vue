<template>
  <b-card no-body :key="extension" :class="['metadata-card', `ext-${extension}`]">
    <b-card-title>
      <span v-if="label" v-html="label" />
      <template v-else>{{ $t('metadata.general') }}</template>
    </b-card-title>
    <section class="border metadata-rows">
      <MetadataEntry v-for="(entry, key) in orderedProperties" :field="key" :key="key" v-bind="entry" />
    </section>
  </b-card>
</template>

<script>
import MetadataEntry from './MetadataEntry.vue';
import { BCard, BCardTitle } from 'bootstrap-vue-next';

export default {
  name: "MetadataGroup",
  components: {
    MetadataEntry,
    BCard,
    BCardTitle
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
  },
  computed: {
    orderedProperties() {
      if (this.extension !== 'mlm') {
        return this.properties;
      }

      const entries = Object.entries(this.properties);
      const lastFields = ['mlm:input', 'mlm:output', 'mlm:hyperparameters'];
      const firstFields = entries.filter(([field]) => field === 'mlm:name');
      const middleFields = entries.filter(([field]) => field !== 'mlm:name' && !lastFields.includes(field));
      const last = lastFields
        .map(field => entries.find(([key]) => key === field))
        .filter(Boolean);

      return Object.fromEntries([...firstFields, ...middleFields, ...last]);
    }
  }
};
</script>
