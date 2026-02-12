<template>
  <section class="items mb-4">
    <header>
      <h2 class="title me-2">{{ $t('stacItem', items.length ) }}</h2>
      <b-badge v-if="itemCount !== null" pill variant="secondary" class="me-4">{{ itemCount }}</b-badge>
      <SortButtons v-if="!api && items.length > 1" v-model="sort" />
    </header>

    <Pagination
      v-if="showPagination" ref="topPagination" class="mb-3" :class="{'me-3': allowFilter}"
      :pagination="pagination" placement="top" @paginate="paginate"
    />
    <template v-if="allowFilter">
      <b-button v-if="api" class="mb-3" v-b-toggle.itemFilter :variant="hasFilters && !filtersOpen ? 'primary' : 'outline-primary'">
        <b-icon-filter />
        {{ filtersOpen ? $t('items.hideFilter') : $t('items.showFilter') }}
        <b-badge v-if="hasFilters && !filtersOpen" variant="dark">{{ filterCount }}</b-badge>
      </b-button>
      <b-collapse id="itemFilter" v-model="filtersOpen">
        <SearchFilter
          type="Items"
          :title="$t('items.filter')" :parent="stac"
          :value="apiFilters" @input="emitFilter"
        />
      </b-collapse>
    </template>

    <section class="list">
      <Loading v-if="loading" fill top />
      <div v-if="chunkedItems.length > 0" class="card-grid">
        <Item v-for="item in chunkedItems" :item="item" :key="item.href" />
      </div>
      <b-alert v-else :variant="hasFilters ? 'warning' : 'info'" show>
        <template v-if="hasFilters">{{ $t('search.noItemsFound') }}</template>
        <template v-else>{{ $t('items.noneAvailableForCollection') }}</template>
      </b-alert>
    </section>

    <Pagination v-if="showPagination" class="mb-3" :pagination="pagination" @paginate="paginate" />
    <b-button v-else-if="hasMore" @click="showMore" variant="primary" v-visible.300="showMore">{{ $t('showMore') }}</b-button>
  </section>
</template>

<script>
import { mapState } from 'vuex';
import { BCollapse } from 'bootstrap-vue-next';
import { defineComponent, defineAsyncComponent } from 'vue';

import Utils from '../utils';
import Item from './Item.vue';
import Loading from './Loading.vue';
import { getDisplayTitle } from '../models/stac';

export default defineComponent({
  name: "Items",
  components: {
    Item,
    SearchFilter: defineAsyncComponent(() => import('./SearchFilter.vue')),
    Loading,
    Pagination: defineAsyncComponent(() => import('./Pagination.vue')),
    BCollapse,
    SortButtons: defineAsyncComponent(() => import('./SortButtons.vue'))
  },
  props: {
    items: {
      type: Array,
      required: true
    },
    loading: {
      type: Boolean,
      default: false
    },
    stac: {
      type: Object,
      required: true
    },
    api: {
      type: Boolean,
      default: false
    },
    allowFilter: {
      type: Boolean,
      default: true
    },
    showFilters: {
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
    },
    count: {
      type: Number,
      default: null
    }
  },
  emits: ['filtersShown', 'filterItems', 'paginate'],
  data() {
    return {
      shownItems: this.chunkSize,
      filtersOpen: this.showFilters,
      sort: 0
    };
  },
  computed: {
    ...mapState(['cardViewSort', 'uiLanguage']),
    itemCount() {
      if (this.count !== null) {
        return this.count;
      }
      else if (!this.api && this.items.length > 0) {
        return this.items.length;
      }
      return null;
    },
    hasMore() {
      return this.items.length > this.shownItems;
    },
    filterCount() {
      return Object.values(this.apiFilters).filter(filter => !(filter === null || Utils.size(filter) === 0)).length;
    },
    hasFilters() {
      return this.filterCount > 0;
    },
    chunkedItems() {
      let items = this.items;
      if (!this.apiFilters.sortby && this.sort !== 0) {
        const collator = new Intl.Collator(this.uiLanguage);
        items = items.slice(0).sort((a,b) => collator.compare(getDisplayTitle(a), getDisplayTitle(b)));
        if (this.sort === -1) {
          items = items.reverse();
        }
      }
      if (!this.api && this.items.length > this.chunkSize) {
        return items.slice(0, this.shownItems);
      }
      else {
        return items;
      }
    },
    showPagination() {
      if (this.api) {
        if (this.hasFilters) {
          return true;
        }
        else if (this.items.length > 0) {
          // Check whether any pagination links are available
          return Object.values(this.pagination).some(link => !!link);
        }
      }
      return false;
    }
  },
  watch: {
    showFilters() {
      this.filter = this.showFilters;
    },
    filtersOpen() {
      this.$emit('filtersShown', this.filtersOpen);
    }
  },
  created() {
    this.sort = Utils.convertHumanizedSortOrder(this.cardViewSort);
  },
  mounted() {
    if (this.showFilters) {
      setTimeout(() => Utils.scrollTo(this.$el), 250);
    }
  },
  methods: {
    emitFilter(value, reset) {
      this.$emit('filterItems', value, reset);
    },
    showMore() {
      this.shownItems += this.chunkSize;
    },
    paginate(link, placement) {
      if (placement === 'bottom' && this.$refs.topPagination) {
        Utils.scrollTo(this.$refs.topPagination.$el);
      }
      this.$emit('paginate', link);
    }
  }
});
</script>
