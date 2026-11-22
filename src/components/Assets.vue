<template>
  <section class="assets mb-4">
    <SectionHeading v-if="displayTitle" :id="id">{{ displayTitle }}</SectionHeading>
    <b-accordion>
      <Asset
        v-for="asset in assets" :asset="asset" :expand="expand"
        :definition="definition" :key="asset.getKey()"
      />
    </b-accordion>
  </section>
</template>

<script>
import { defineAsyncComponent } from 'vue';
import { BAccordion } from 'bootstrap-vue-next';
import SectionHeading from './SectionHeading.vue';

export default {
  name: 'Assets',
  components: {
    Asset: defineAsyncComponent(() => import('./Asset.vue')),
    BAccordion,
    SectionHeading
  },
  props: {
    assets: {
      type: Array,
      required: true
    },
    definition: {
      type: Boolean,
      default: false
    },
    title: {
      type: String,
      default: null
    },
    autoExpand: {
      type: Boolean,
      default: false
    },
    // Stable anchor id for the heading, e.g. "assets".
    // Leave empty where the component renders more than once per page.
    id: {
      type: String,
      default: null
    }
  },
  computed: {
    displayTitle() {
      if (this.title === null) {
        let langKey = this.definition ? 'assets.inItems' : 'stacAssets';
        return this.$t(langKey, this.assets.length);
      }
      else {
        return this.title;
      }
    },
    expand() {
      if (this.definition) {
        return false; // Don't expand assets for Item Asset Definitions
      }
      else if (this.assets.length === 1 && this.autoExpand) {
        return true; // Expand asset if it's the only asset available and it is in an Item
      }
      return null; // Let asset decide (e.g. depending on roles)
    }
  }
};
</script>
