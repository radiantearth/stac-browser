<template>
  <section class="items mb-4">
    <h2>
      Items
      <template v-if="!api">({{ items.length }})</template>
    </h2>
    <Pagination ref="topPagination" v-if="api" :pagination="pagination" placement="top" @paginate="paginate" />
    <b-card-group columns>
      <Item v-for="item in chunkedItems" :item="item" :key="item.href" />
    </b-card-group>
    <Pagination v-if="api" :pagination="pagination" placement="bottom" @paginate="paginate" />
    <b-button v-else-if="hasMore" @click="showMore" variant="primary" v-b-visible.200="showMore">Show more...</b-button>
  </section>
</template>

<script>
import Item from './Item.vue';
import Pagination from './Pagination.vue';

export default {
  name: "Items",
  components: {
    Item,
    Pagination
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
    paginate(link, placement) {
      if (placement === 'bottom' && this.$refs.topPagination) {
        this.$refs.topPagination.$el.scrollIntoView({
          behavior: "smooth",
          block: "start"
      });
      }
      this.$emit('paginate', link);
    }
  }
};
</script>
