<template>
  <section class="catalogs mb-4">
    <header>
      <h2 class="title mr-2">{{ title }}</h2>
      <b-badge v-if="catalogCount !== null" pill variant="secondary" class="mr-4">{{ catalogCount }}</b-badge>
      <ViewButtons class="mr-2" v-model="view" />
      <SortButtons v-if="isComplete && catalogs.length > 1" v-model="sort" />
    </header>
    <section v-if="isComplete && catalogs.length > 1" class="catalog-filter mb-2">
      <SearchBox v-model="searchTerm" :placeholder="filterPlaceholder" />
      <multiselect
        v-if="allKeywords.length > 0" v-model="selectedKeywords" multiple :options="allKeywords"
        :placeholder="$t('multiselect.keywordsPlaceholder')"
        :selectLabel="$t('multiselect.selectLabel')"
        :selectedLabel="$t('multiselect.selectedLabel')"
        :deselectLabel="$t('multiselect.deselectLabel')"
        :limitText="limitText"
      />
    </section>
    <Pagination ref="topPagination" v-if="showPagination" :pagination="pagination" placement="top" @paginate="paginate" />
    <b-alert v-if="hasSearchCritera && catalogView.length === 0" variant="warning" class="mt-2" show>{{ $t('catalogs.noMatches') }}</b-alert>
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
    SortButtons: () => import('./SortButtons.vue'),
    Multiselect: () => import('vue-multiselect')
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
      sort: 0,
      selectedKeywords: []
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
    filterPlaceholder() {
      return this.isComplete ? this.$t('catalogs.filterByTitleAndMore') : this.$t('catalogs.filterByTitle');
    },
    showPagination() {
      // Check whether any pagination links are available
      return Object.values(this.pagination).some(link => !!link);
    },
    allCatalogs() {
      return this.catalogs.map(catalog => {
          let stac = this.getStac(catalog);
          return stac ? stac : catalog;
      });
    },
    hasSearchCritera() {
      return this.searchTerm || this.selectedKeywords.length > 0;
    },
    catalogView() {
      if (this.hasMore) {
        return this.catalogs;
      }
      // Filter
      let catalogs = this.allCatalogs;
      if (this.hasSearchCritera) {
        catalogs = catalogs.filter(catalog => {
          if (this.selectedKeywords.length > 0 && catalog instanceof STAC && Array.isArray(catalog.keywords)) {
            let hasKeywords = this.selectedKeywords.every(keyword => catalog.keywords.includes(keyword));
            if (!hasKeywords) {
              return false;
            }
          }
          if (this.searchTerm) {
            let haystack = [ catalog.title ];
            if (catalog instanceof STAC && this.isComplete) {
              haystack.push(catalog.id);
              if (Array.isArray(catalog.keywords)) {
                haystack = haystack.concat(catalog.keywords);
              }
            }
            return Utils.search(this.searchTerm, haystack);
          }
          return true;
        });
      }
      // Sort
      if (!this.hasMore && this.sort !== 0) {
        const collator = new Intl.Collator(this.uiLanguage);
        catalogs = catalogs.slice(0).sort((a,b) => collator.compare(STAC.getDisplayTitle(a), STAC.getDisplayTitle(b)));
        if (this.sort === -1) {
          catalogs = catalogs.reverse();
        }
      }
      return catalogs;
    },
    allKeywords() {
      if (!this.isComplete) {
        return [];
      }
      let keywords = [];
      for(let catalog of this.allCatalogs) {
        if (catalog instanceof STAC && Array.isArray(catalog.keywords)) {
          for(let keyword of catalog.keywords) {
            if (!keywords.includes(keyword)) {
              keywords.push(keyword);
            }
          }
        }
      }
      return keywords.sort();
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
    },
    limitText(count) {
      return this.$t("multiselect.andMore", {count});
    }
  }
};
</script>

<style lang="scss" scoped>
.catalog-filter {
  display: flex;
  margin-top: 0.25rem;
  margin-bottom: 0.25rem;
  gap: 1rem;
  align-items: stretch;

  > * {
    flex-grow: 1;
    min-width: 300px;
    width: 50%;
  }
}
</style>
