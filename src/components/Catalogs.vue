<template>
  <section class="catalogs mb-4">
    <header>
      <h2 class="title mr-2">{{ title }}</h2>
      <b-badge v-if="catalogCount !== null" pill variant="secondary" class="mr-4">{{ catalogCount }}</b-badge>
      <ViewButtons class="mr-2" v-model="view" />
      <SortButtons v-if="isComplete && catalogs.length > 1" v-model="sort" />
    </header>
    <SearchBox v-if="isComplete && catalogs.length > 1" class="mt-1 mb-1" v-model="searchTerm" :placeholder="$t('catalogs.filterByTitle')" />
    <Pagination ref="topPagination" v-if="showPagination" :pagination="pagination" placement="top" @paginate="paginate" />
    <b-alert v-if="searchTerm && catalogView.length === 0" variant="warning" show>{{ $t('catalogs.noMatches') }}</b-alert>
    <section class="list">
      <Loading v-if="loading" fill top />
      <component :is="cardsComponent" v-bind="cardsComponentProps">
        <Catalog v-for="catalog in catalogView" :catalog="catalog" :key="catalog.href">
          <template #footer="{data}">
            <slot name="catalogFooter" :data="data" />
          </template>
        </Catalog>
      </component>
    </section>
    <Pagination v-if="showPagination" :pagination="pagination" @paginate="paginate" />
    <b-button v-else-if="hasMore" @click="loadMore" variant="primary" v-b-visible.300="loadMore">{{ $t('catalogs.loadMore') }}</b-button>
  </section>
</template>

<script>
import { mapGetters, mapState } from 'vuex';
import Catalog from './Catalog.vue';
import Loading from './Loading.vue';
import STAC from '../models/stac';
import ViewMixin from './ViewMixin';
import Utils from '../utils';

export default {
  name: "Catalogs",
  components: {
    Catalog,
    Loading,
    Pagination: () => import('./Pagination.vue'),
    SearchBox: () => import('./SearchBox.vue'),
    SortButtons: () => import('./SortButtons.vue')
  },
  mixins: [
    ViewMixin
  ],
  props: {
    catalogs: {
      type: Array,
      required: true
    },
    collectionsOnly: {
      type: Boolean,
      required: false
    },
    loading: {
      type: Boolean,
      default: false
    },
    hasMore: {
      type: Boolean,
      default: false
    },
    pagination: {
      type: Object,
      default: () => ({})
    },
    count: {
      type: Number,
      default: null
    }
  },
  data() {
    return {
      searchTerm: '',
      sort: 0
    };
  },
  computed: {
    ...mapState(['cardViewSort', 'uiLanguage']),
    ...mapGetters(['getStac']),
    catalogCount() {
      if (this.catalogs.length !== this.catalogView.length) {
        return this.catalogView.length + '/' + this.catalogs.length;
      }
      else if (this.count !== null) {
        return this.count;
      }
      else if (this.isComplete) {
        return this.catalogs.length;
      }
      return null;
    },
    title() {
      if (this.collectionsOnly) {
        return this.$tc('stacCollection', this.catalogs.length );
      }
      else {
        return this.$tc('stacCatalog', this.catalogs.length );
      }
    },
    isComplete() {
      return !this.hasMore && !this.showPagination;
    },
    showPagination() {
      // Check whether any pagination links are available
      return Object.values(this.pagination).some(link => !!link);
    },
    catalogView() {
      if (this.hasMore) {
        return this.catalogs;
      }
      let catalogs = this.catalogs.map(catalog => {
          let stac = this.getStac(catalog);
          return stac ? stac : catalog;
      });
      // Filter
      if (this.searchTerm) {
        catalogs = catalogs.filter(catalog => {
          let haystack = [ catalog.title ];
          if (catalog instanceof STAC) {
            haystack.push(catalog.id);
            if (Array.isArray(catalog.keywords)) {
              haystack = haystack.concat(catalog.keywords);
            }
          }
          else {
            haystack.push(catalog.href);
          }
          return Utils.search(this.searchTerm, haystack);
        });
      }
      // Sort
      if (!this.hasMore && this.sort !== 0) {
        catalogs = catalogs.slice(0).sort((a,b) => STAC.getDisplayTitle(a).localeCompare(STAC.getDisplayTitle(b), this.uiLanguage));
        if (this.sort === -1) {
          catalogs = catalogs.reverse();
        }
      }
      return catalogs;
    }
  },
  created() {
    this.sort = this.cardViewSort;
  },
  methods: {
    loadMore(visible = true) {
      if (visible) {
        // Disable sorting if pagination is/was active as otherwise the order of elements
        // may change unexpectedly after the last page has been loaded.
        this.sort = 0;
        this.$emit('loadMore');
      }
    },
    paginate(link, placement) {
      if (placement === 'bottom' && this.$refs.topPagination) {
        Utils.scrollTo(this.$refs.topPagination.$el);
      }
      this.$emit('paginate', link);
    }
  }
};
</script>
