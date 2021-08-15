<template>
  <section class="providers mb-4">
    <h2>Providers</h2>
    <div class="accordion" role="tablist">
      <Provider v-for="(provider, key) in providers" :key="key" :id="String(key)" :provider="provider" />
    </div>
  </section>
</template>

<script>
import Provider from './Provider.vue';

export default {
  name: 'Providers',
  components: {
    Provider
  },
  props: {
    providers: {
      type: Array,
      required: true
    }
  }
}
</script>