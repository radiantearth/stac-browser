<template>
  <section class="catalogs mb-4">
    <h2>
      <span class="title">{{ $tc('stacCatalog', catalogs.length ) }}</span>
      <b-badge v-if="hasMultiple" pill variant="secondary ml-2">
        <template v-if="catalogs.length !== catalogView.length">{{ catalogView.length }}/</template>{{ catalogs.length }}
      </b-badge>
      <ViewButtons class="ml-4" v-model="view" />
      <SortButtons v-if="hasMultiple" class="ml-2" v-model="sort" />
    </h2>
    <SearchBox v-if="hasMultiple" class="mt-3 mb-2" v-model="searchTerm" :placeholder="$t('catalogs.filterByTitle')" />
    <Pagination ref="topPagination" v-if="showPagination" :pagination="pagination" placement="top" @paginate="paginate" />
    <b-alert v-if="searchTerm && catalogView.length === 0" variant="warning" show>{{ $t('catalogs.noMatches') }}</b-alert>
    <section class="list">
      <Loading v-if="loading" fill top />
      <component :is="cardsComponent" v-bind="cardsComponentProps">
        <Catalog v-for="catalog in catalogView" :catalog="catalog" :key="catalog.href" />
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
    hasMultiple() {
      return !this.hasMore && !this.showPagination && this.catalogs.length > 1;
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

<style lang="scss" scoped>
.catalogs {

  .list {
    position: relative;
  }

  > h2 {
    .title, .badge {
      vertical-align: middle;
    }
  }
}
</style>