<template>
  <section class="assets mb-4">
    <h2>Assets</h2>
    <div class="accordion" role="tablist">
      <Asset v-for="(asset, key) in assets" :asset="asset" :expand="expand" :context="context" :id="key" :key="key" />
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
    context: {
        type: Object,
        default: null
    }
  },
  computed: {
    expand() {
      return Utils.size(this.assets) === 1;
    }
  }
}
</script>