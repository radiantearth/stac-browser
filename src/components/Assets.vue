<template>
  <section class="assets">
    <h2>Assets</h2>
    <div class="accordion" role="tablist">
      <Asset v-for="(asset, key) in assets" :asset="asset" :id="key" :key="key" />
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
      type: Object,
      required: true
    }
  }
}
</script>