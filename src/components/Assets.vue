<template>
  <section class="assets mb-4">
    <h2 v-if="displayTitle">{{ displayTitle }}</h2>
    <div class="accordion" role="tablist">
      <Asset
        v-for="(asset, key) in assets" :asset="asset" :expand="expand" :context="context"
        :definition="definition" :shown="shown.includes(key)"
        :id="key" :key="key" @show="show"
      />
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
    count() {
      return Utils.size(this.assets);
    },
    displayTitle() {
      if (this.title === null) {
        let langKey = this.definition ? 'assets.inItems' : 'stacAssets';
        return this.$tc(langKey, this.count);
      }
      else {
        return this.title;
      }
    },
    expand() {
      if (this.definition) {
        return false; // Don't expand assets for Item Asset Definitions
      }
      else if (this.count === 1 && this.stac && this.stac.isItem()) {
        return true; // Expand asset if it's the only asset available and it is in an Item
      }
      return null; // Let asset decide (e.g. depending on roles)
    }
  },
  methods: {
    show(asset, id, isThumbnail) {
      this.$emit('showAsset', asset, id, isThumbnail);
    }
  }
};
</script>
