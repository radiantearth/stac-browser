<template>
  <b-card no-body :key="extension" :class="['metadata-card', `ext-${extension}`]">
    <b-card-title :id="groupId">
      <router-link v-if="groupId" :to="{ hash: '#' + groupId }">
        <span v-if="label" v-html="label" />
        <template v-else>{{ $t('metadata.general') }}</template>
      </router-link>
      <template v-else>
        <span v-if="label" v-html="label" />
        <template v-else>{{ $t('metadata.general') }}</template>
      </template>
    </b-card-title>
    <section class="border metadata-rows">
      <MetadataEntry v-for="(entry, key) in properties" :field="key" :key="key" v-bind="entry" />
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
    },
    // Prefix for the stable anchor id of the group title, e.g. "metadata-".
    // Without it the title renders without an anchor.
    anchorPrefix: {
      type: String,
      default: null
    }
  },
  computed: {
    groupId() {
      if (!this.anchorPrefix) {
        return null;
      }
      return `${this.anchorPrefix}${this.extension || 'general'}`;
    }
  }
};
</script>

<style lang="scss">
#stac-browser .metadata-card {
  .card-title {
    a {
      color: inherit;
      text-decoration: none;

      &:hover::after {
        content: " #";
        opacity: 0.5;
      }
    }
  }
}
</style>
