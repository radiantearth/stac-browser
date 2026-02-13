<template>
  <section class="features">
    <header>
      <h2 class="title me-2">{{ $t('features.title', count ) }}</h2>
      <b-badge pill variant="secondary" class="me-4">{{ count }}</b-badge>
    </header>
    <section class="list">
      <div v-if="count > 0" class="card-grid">
        <Feature v-for="(feature, i) in features" :key="feature.id || i" :feature="feature" />
      </div>
      <b-alert v-else variant="info" show>
        {{ $t('features.empty') }}
      </b-alert>
    </section>
  </section>
</template>

<script>
import Feature from './Feature.vue';

export default {
  name: "Features",
  components: {
    Feature
  },
  props: {
    features: {
      type: Array,
      required: true
    }
  },
  computed: {
    count() {
      return this.features.length;
    }
  }
};
</script>
