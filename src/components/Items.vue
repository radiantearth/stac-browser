<template>
  <ul>
    <li v-for="item in items" :key="item.href">
      <StacLink :link="item" />
    </li>
  </ul>
</template>

<script>
import StacLink from './StacLink.vue';

export default {
  name: "Items",
  components: {
    StacLink
  },
  props: {
    items: {
      type: Array,
      default: () => ([])
    }
  }
};
</script>
