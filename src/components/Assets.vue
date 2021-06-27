<template>
  <section class="assets">
    <h2>Assets</h2>
    <b-card-group columns>
      <Asset v-for="asset in assets" :asset="asset" :key="asset.href" />
    </b-card-group>
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
    }
  }
}
</script>