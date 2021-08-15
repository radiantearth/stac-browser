<template>
  <section class="catalogs mb-4">
    <h2>Catalogs</h2>
    <b-card-group columns>
      <Catalog v-for="catalog in catalogs" :catalog="catalog" :key="catalog.href" />
    </b-card-group>
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
    }
  }
};
</script>
