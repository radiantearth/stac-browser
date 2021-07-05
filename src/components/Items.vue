<template>
  <section class="items">
    <h2>Items</h2>
    <b-card-group columns>
      <Item v-for="item in items" :item="item" :key="item.href" />
    </b-card-group>
  </section>
</template>

<script>
import Item from './Item.vue';

export default {
  name: "Catalogs",
  components: {
    Item
  },
  props: {
    items: {
      type: Array,
      required: true
    }
  }
};
</script>
