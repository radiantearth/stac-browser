<template>
  <section class="items mb-4">
    <h2>
      Items
      <template v-if="!api">({{ items.length }})</template>
    </h2>
    <Pagination ref="topPagination" v-if="api" :pagination="pagination" placement="top" @paginate="paginate" />
    <b-button v-if="api" v-b-toggle.itemFilter class="mb-4 mt-2 ml-3" variant="outline-primary">
      <b-icon-search /> Filter
    </b-button>
    <b-collapse id="itemFilter">
      <ItemFilter :stac="stac" v-model="filters" />
    </b-collapse>
    <b-card-group v-if="chunkedItems.length > 0" columns>
      <Item v-for="item in chunkedItems" :item="item" :key="item.href" />
    </b-card-group>
    <p v-else>Sorry, no items found.</p>
    <Pagination v-if="api" :pagination="pagination" placement="bottom" @paginate="paginate" />
    <b-button v-else-if="hasMore" @click="showMore" variant="primary" v-b-visible.200="showMore">Show more...</b-button>
  </section>
</template>

<script>
import Item from './Item.vue';
import Pagination from './Pagination.vue';
import { BCollapse, BIconSearch } from "bootstrap-vue";

export default {
  name: "Items",
  components: {
    BCollapse,
    BIconSearch,
    Item,
    ItemFilter: () => import('./ItemFilter.vue'),
    Pagination
  },
  props: {
    items: {
      type: Array,
      required: true
    },
    stac: {
      type: Object,
      required: true
    },
    api: {
      type: Boolean,
      default: false
    },
    apiFilters: {
      type: Object,
      default: () => ({})
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
      shownItems: this.chunkSize,
      filters: this.apiFilters
    };
  },
  computed: {
    hasMore() {
      return this.items.length > this.shownItems;
    },
    chunkedItems() {
      if (!this.api && this.items.length > this.chunkSize) {
        return this.items.slice(0, this.shownItems);
      }
      else {
        return this.items;
      }
    }
  },
  watch: {
    filters: {
      deep: true,
      handler(value) {
        this.$emit('filterItems', value);
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
