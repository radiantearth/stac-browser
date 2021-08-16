<template>
  <section class="catalogs mb-4">
    <h2>Catalogs ({{ catalogs.length }})</h2>
    <b-card-group columns>
      <Catalog v-for="catalog in catalogs" :catalog="catalog" :key="catalog.href" />
    </b-card-group>
    <b-button v-if="hasMore" @click="loadMore" variant="primary" v-b-visible.200="loadMore">Load more...</b-button>
  </section>
</template>

<script>
import Catalog from './Catalog.vue';

export default {
  name: "Catalogs",
  components: {
    Catalog
  },
  props: {
    catalogs: {
      type: Array,
      required: true
    },
    hasMore: {
      type: Boolean,
      default: false
    }
  },
  methods: {
    loadMore(visible = true) {
      if (visible) {
        this.$emit('loadMore');
      }
    }
  }
};
</script>
