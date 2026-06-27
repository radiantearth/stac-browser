<template>
  <section class="catalogs mb-4">
    <header>
      <h2 class="title me-2">{{ title }}</h2>
      <b-badge v-if="catalogCount !== null" pill variant="secondary" class="me-4">{{ catalogCount }}</b-badge>
      <ViewButtons v-if="!hideControls" class="me-2" v-model="view" />
      <SortButtons v-if="!hideControls && isComplete && catalogs.length > 1" v-model="sort.direction" />
    </header>
    <section v-if="!hideControls && ((isComplete && catalogs.length > 1) || canSearchFreeText)" class="catalog-filter mb-2">
      <template v-if="canSearchFreeText">
        <multiselect
          multiple taggable @tag="addSearchTerm"
          id="catalogFreeText" v-model="selectedSearchTerms" :options="selectedSearchTerms"
          :placeholder="$t('search.enterSearchTerms')" :tag-placeholder="$t('search.addSearchTerm')" :no-options="$t('search.addSearchTerm')"
        >
          <template #noOptions>{{ $t('search.noOptions') }}</template>
        </multiselect>
        <b-button v-if="advancedSearchLink" variant="primary" :to="advancedSearchLink" class="additional-filter-link">
          {{ $t('search.additionalFilters') }}
        </b-button>
      </template>
      <template v-else>
        <SearchBox v-model="searchTerm" :placeholder="filterPlaceholder" />
        <multiselect
          v-if="isComplete && allKeywords.length > 0"
          v-model="selectedKeywords"
          :options="allKeywords"
          multiple
          :placeholder="$t('multiselect.keywordsPlaceholder')"
          :select-label="$t('multiselect.selectLabel')"
          :selected-label="$t('multiselect.selectedLabel')"
          :deselect-label="$t('multiselect.deselectLabel')"
          :limit-text="limitText"
        />
      </template>
    </section>
    <Pagination v-if="showPagination" ref="topPagination" class="mb-3" :pagination="pagination" placement="top" @paginate="paginate" />
    <b-alert v-if="hasSearchCritera && catalogView.length === 0" variant="warning" class="mt-2" show>{{ $t('catalogs.noMatches') }}</b-alert>
    <section class="list">
      <Loading v-if="loading && !loadingMore" fill top />
      <div :class="view === 'list' ? 'card-list' : 'card-grid'">
        <Catalog v-for="catalog in catalogView" :catalog="catalog" :key="catalog.href">
          <template #footer="{data}">
            <slot name="catalogFooter" :data="data" />
          </template>
        </Catalog>
      </div>
    </section>
    <Pagination v-if="showPagination" class="mb-3" :pagination="pagination" @paginate="paginate" />
    <b-button v-else-if="hasMore" @click="loadMore" variant="primary" v-visible.300="loadMore">
      <b-spinner v-if="loading && loadingMore" small />
      {{ $t('catalogs.loadMore') }}
    </b-button>
  </section>
</template>

<script>
import { mapGetters, mapState } from 'vuex';
import { defineComponent, defineAsyncComponent } from 'vue';

import Catalog from './Catalog.vue';
import Loading from './Loading.vue';
import { STAC } from 'stac-js';
import ViewButtons from './ViewButtons.vue';
import Utils from '../utils';
import { sortStac } from '../models/stac';
import { TYPES } from './ApiCapabilitiesMixin.js';
import { hasText, URI } from 'stac-js/src/utils.js';

export default defineComponent({
  name: "Catalogs",
  components: {
    Catalog,
    Loading,
    Multiselect: defineAsyncComponent(() => import('vue-multiselect')),
    Pagination: defineAsyncComponent(() => import('./Pagination.vue')),
    SearchBox: defineAsyncComponent(() => import('./SearchBox.vue')),
    SortButtons: defineAsyncComponent(() => import('./SortButtons.vue')),
    ViewButtons
  },
  props: {
    catalogs: {
      type: Array,
      required: true
    },
    collectionsOnly: {
      type: Boolean,
      required: false
    },
    enforceCards: {
      type: Boolean,
      default: false
    },
    hideControls: {
      type: Boolean,
      default: false
    },
    loading: {
      type: Boolean,
      default: false
    },
    loadingMore: {
      type: Boolean,
      default: false
    },
    hasMore: {
      type: Boolean,
      default: false
    },
    apiFilters: {
      type: Object,
      default: () => ({})
    },
    apiSearch: {
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
  emits: ['loadMore', 'paginate', 'search'],
  data() {
    return {
      searchTerm: '',
      sort: Utils.parseApiSortParameter(), // get empty sort object
      selectedKeywords: [],
      selectedSearchTerms: [],
    };
  },
  computed: {
    ...mapState(['defaultCollectionSort', 'uiLanguage']),
    ...mapGetters(['searchBrowserLink', 'supportsConformance']),
    ...mapGetters(['getStac']),
    advancedSearchLink() {
      if (!this.canSearchFreeText || !this.searchBrowserLink) {
        return null;
      }
      const query = Utils.stateQueryParametersToObject({
        'searchtype': 'collections',
        'q': this.selectedSearchTerms,
      });
      return URI(this.searchBrowserLink).query(query).toString();
    },
    canSearchFreeText() {
      return this.apiSearch && this.supportsConformance(TYPES.Collections.FreeText);
    },
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
        return this.$t('stacCollection', this.catalogs.length );
      }
      else {
        return this.$t('stacCatalog', this.catalogs.length );
      }
    },
    isComplete() {
      if (this.hasMore || this.showPagination) {
        return false;
      }
      return this.allCatalogs.every(obj => obj.isSTAC);
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
        const stac = this.getStac(catalog);
        return stac ? stac : catalog;
      });
    },
    hasSearchCritera() {
      return this.searchTerm || this.selectedKeywords.length > 0 || this.selectedSearchTerms.length > 0;
    },
    catalogView() {
      if (this.hasMore) {
        return this.catalogs;
      }
      if (!this.isComplete) {
        return this.allCatalogs;
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
      if (!this.hasMore && !this.apiFilters.sortby && this.sort.direction !== 0) {
        catalogs = sortStac(catalogs, this.sort, this.uiLanguage);
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
    },
    view: {
      get() {
        if (this.enforceCards) {
          return 'cards';
        }
        return this.$store.state.cardViewMode;
      },
      async set(cardViewMode) {
        if (this.enforceCards) {
          return;
        }
        await this.$store.dispatch('config', { cardViewMode });
      }
    }
  },
  created() {
    this.sort = Utils.parseApiSortParameter(this.defaultCollectionSort);
  },
  watch: {
    selectedSearchTerms: {
      handler(searchTerms) {
        this.$emit('search', searchTerms);
      },
      deep: 1
    }
  },
  methods: {
    addSearchTerm(term) {
      if (!hasText(term)) {
        return;
      }
      this.selectedSearchTerms.push(term);
    },
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
    },
    limitText(count) {
      return this.$t("multiselect.andMore", {count});
    }
  }
});
</script>

<style lang="scss" scoped>
.catalog-filter {
  display: flex;
  flex-wrap: wrap;
  margin-top: 0.25rem;
  margin-bottom: 0.25rem;
  gap: 1rem;
  align-items: stretch;

  > * {
    flex-grow: 1;
    flex-basis: 300px;
    min-width: 300px;
  }

  > .additional-filter-link {
    flex-grow: 0;
    align-self: center;
    white-space: nowrap;
  }
}
</style>
