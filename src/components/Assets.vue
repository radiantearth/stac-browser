<template>
  <section class="assets mb-4">
    <h2 v-if="displayTitle">{{ displayTitle }}</h2>
    <div class="accordion" role="tablist">
      <Asset
        v-for="asset in assets" :asset="asset" :expand="expand" :context="context"
        :definition="definition" :shown="shownKeys.includes(asset.getKey())"
        :key="asset.getKey()" @show="show"
      />
    </div>
  </section>
</template>

<script>
import Asset from './Asset.vue';

export default {
  name: 'Assets',
  components: {
    Asset
  },
  props: {
    assets: {
      type: Array,
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
    shownKeys() {
      return this.shown
        .filter(asset => asset.isAsset())
        .map(asset => asset.getKey());
    },
    displayTitle() {
      if (this.title === null) {
        let langKey = this.definition ? 'assets.inItems' : 'stacAssets';
        return this.$tc(langKey, this.assets.length);
      }
      else {
        return this.title;
      }
    },
    expand() {
      if (this.definition) {
        return false; // Don't expand assets for Item Asset Definitions
      }
      else if (this.assets.length === 1 && this.context && this.context.isItem()) {
        return true; // Expand asset if it's the only asset available and it is in an Item
      }
      return null; // Let asset decide (e.g. depending on roles)
    }
  },
  methods: {
    show() {
      this.$emit('showAsset', ...arguments);
    }
  }
};
</script>
