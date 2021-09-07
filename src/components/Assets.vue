<template>
  <section class="assets mb-4">
    <h2>{{ title }}</h2>
    <div class="accordion" role="tablist">
      <Asset v-for="(asset, key) in assets" :asset="asset" :expand="expand" :context="context" :shown="shown.includes(key)" :id="String(key)" :key="key" @show="show" />
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
    }
  },
  computed: {
    title() {
      return this.definition ? 'Assets in Items' : 'Assets';
    },
    expand() {
      if (this.definition) {
        return false; // Don't expand assets for Item Asset Definitions
      }
      else if (Utils.size(this.assets) === 1) {
        return true; // Expand asset if it's the only asset available
      }
      else if (Object.values(this.assets).filter(asset => Array.isArray(asset.roles) && asset.roles.includes('data')).length > 3) {
        return false; // Expand assets with role asset only if there are 3 of them max
      }
      return null; // Let asset decide (e.g. depending on roles)
    }
  },
  methods: {
    show(asset, id, isThumbnail) {
      this.$emit('showAsset', asset, id, isThumbnail);
    }
  }
}
</script>