<template>
  <section class="assets mb-4">
    <h2 v-if="displayTitle">{{ displayTitle }}</h2>
    <div class="accordion" role="tablist">
      <Asset v-for="(asset, key) in assets" :asset="asset" :expand="expand" :context="context" :definition="definition" :shown="shown.includes(key)" :id="key" :key="getId(key)" @show="show" />
    </div>
  </section>
</template>

<script>
import Asset from './Asset.vue';
import Utils from '../utils';

export default {
  name: 'Assets',
  components: {
    Asset
  },
  props: {
    assets: {
      type: Object,
      required: true
    },
    shown: {
      type: Array,
      default: () => ([])
    },
    context: {
      type: Object,
      default: null
    },
    definition: {
      type: Boolean,
      default: false
    },
    title: {
      type: String,
      default: null
    }
  },
  computed: {
    displayTitle() {
      if (this.title === null) {
        return this.definition ? 'Assets in Items' : 'Assets';
      }
      else {
        return this.title;
      }
    },
    expand() {
      if (this.definition) {
        return false; // Don't expand assets for Item Asset Definitions
      }
      else if (Utils.size(this.assets) === 1 && this.stac && this.stac.isItem()) {
        return true; // Expand asset if it's the only asset available and it is in an Item
      }
      return null; // Let asset decide (e.g. depending on roles)
    }
  },
  methods: {
    getId(key) {
      return (this.definition ? 'item-def-' : 'asset-') + String(key);
    },
    show(asset, id, isThumbnail) {
      this.$emit('showAsset', asset, id, isThumbnail);
    }
  }
}
</script>