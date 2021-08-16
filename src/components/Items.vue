<template>
  <section class="items mb-4">
    <h2>Items</h2>
    <b-card-group columns>
      <Item v-for="item in items" :item="item" :key="item.href" />
    </b-card-group>
    <b-button-group v-if="api">
      <b-button @click="paginate(pagination.first)" :disabled="!pagination.first" variant="primary">« First</b-button>
      <b-button @click="paginate(pagination.prev)" :disabled="!pagination.prev" variant="primary">‹ Previous</b-button>
      <b-button @click="paginate(pagination.next)" :disabled="!pagination.next" variant="primary">Next ›</b-button>
      <b-button v-if="pagination.last" @click="paginate(pagination.last)" variant="primary">Last »</b-button>
    </b-button-group>
  </section>
</template>

<script>
import Item from './Item.vue';

export default {
  name: "Items",
  components: {
    Item
  },
  props: {
    items: {
      type: Array,
      required: true
    },
    api: {
      type: Boolean,
      default: false
    },
    pagination: {
      type: Object,
      default: () => ({})
    }
  },
  methods: {
    paginate(link) {
      this.$emit('paginate', link);
    }
  }
};
</script>
