<template>
  <ul>
    <li v-for="catalog in catalogs" :key="catalog.href">
      <StacLink :link="catalog" />
    </li>
  </ul>
</template>

<script>
import StacLink from './StacLink.vue';

export default {
  name: "Catalogs",
  components: {
    StacLink
  },
  props: {
    catalogs: {
      type: Array,
      default: () => ([])
    }
  }
};
</script>
