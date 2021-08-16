<template>
  <section class="items mb-4">
    <h2>Items ({{ items.length }})</h2>
    <b-card-group columns>
      <Item v-for="item in chunkedItems" :item="item" :key="item.href" />
    </b-card-group>
    <b-button-group v-if="api">
      <b-button @click="paginate(pagination.first)" :disabled="!pagination.first" variant="primary">« First</b-button>
      <b-button @click="paginate(pagination.prev)" :disabled="!pagination.prev" variant="primary">‹ Previous</b-button>
      <b-button @click="paginate(pagination.next)" :disabled="!pagination.next" variant="primary">Next ›</b-button>
      <b-button v-if="pagination.last" @click="paginate(pagination.last)" variant="primary">Last »</b-button>
    </b-button-group>
    <b-button v-else-if="hasMore" @click="showMore" variant="primary" v-b-visible.200="showMore">Show more...</b-button>
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
    },
    chunkSize: {
      type: Number,
      default: 90
    }
  },
  data() {
    return {
      shownItems: this.chunkSize
    };
  },
  computed: {
    hasMore() {
      return this.items.length > this.shownItems;
    },
    chunkedItems() {
      console.log(!this.api, this.items.length, this.chunkSize);
      if (!this.api && this.items.length > this.chunkSize) {
        return this.items.slice(0, this.shownItems);
      }
      else {
        return this.items;
      }
    }
  },
  methods: {
    showMore() {
      this.shownItems += this.chunkSize;
    },
    paginate(link) {
      this.$emit('paginate', link);
    }
  }
};
</script>
