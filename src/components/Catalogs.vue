<template>
  <section class="catalogs mb-4">
    <header>
      <h2 class="title me-2">{{ displayTitle }}</h2>
      <b-badge v-if="!hideCount && catalogCount !== null" pill variant="secondary" class="me-4">{{ catalogCount }}</b-badge>
      <ViewButtons v-if="!enforceView" class="me-2" v-model="view" />
      <!-- Cal-Adapt: resets the pill filters below -->
      <b-button v-if="hasPillSelection" size="sm" variant="link" class="p-0 ms-2" @click="clearPillFilters">{{ $t('catalogFilters.clear') }}</b-button>
    </header>
    <section v-if="showControls && ((isComplete && catalogs.length > 1) || canSearchFreeText)" class="catalog-filter mb-2">
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
      </template>
      <!-- Cal-Adapt: Topic (keyword) and collection field filters (src/caladapt/collectionFilters.js)
           as labelled rows of toggle pill buttons with counts, shown with API free-text search too
           (upstream shows a keyword multi-select dropdown, and only without free-text search) -->
      <div v-if="isComplete && allKeywords.length > 0" class="pill-filter" role="group" :aria-label="$t('catalogFilters.topic')">
        <span class="pill-filter-label">{{ $t('catalogFilters.topic') }}</span>
        <div class="pill-filter-options">
          <b-button
            v-for="keyword in allKeywords" :key="keyword"
            size="sm" variant="outline-primary" class="rounded-pill"
            :pressed="selectedKeywords.includes(keyword)"
            @click="selectKeyword(keyword)"
          >
            {{ keyword }} <span class="pill-count">{{ keywordCounts[keyword] }}</span>
          </b-button>
        </div>
      </div>
      <template v-if="isComplete">
        <div v-for="filter in fieldFilters" :key="filter.field" class="pill-filter" role="group" :aria-label="$t(`catalogFilters.${filter.key}.label`)">
          <span class="pill-filter-label">{{ $t(`catalogFilters.${filter.key}.label`) }}</span>
          <div class="pill-filter-options">
            <b-button
              v-for="option in filter.options" :key="option.value"
              size="sm" variant="outline-primary" class="rounded-pill"
              :pressed="selectedFieldValues[filter.field].includes(option.value)"
              @click="selectFieldValue(filter.field, option.value)"
            >
              {{ $t(`catalogFilters.${filter.key}.${option.value}`) }} <span class="pill-count">{{ option.count }}</span>
            </b-button>
          </div>
        </div>
      </template>
    </section>
    <Pagination v-if="showPagination" ref="topPagination" class="mb-3" :pagination="pagination" placement="top" @paginate="paginate" />
    <b-alert v-if="hasSearchCritera && catalogView.length === 0" variant="warning" class="mt-2" show>{{ $t('catalogs.noMatches') }}</b-alert>
    <section class="list">
      <Loading v-if="loading && !loadingMore" fill top />
      <div :class="view === 'list' ? 'card-list' : 'card-grid'">
        <Catalog v-for="catalog in catalogView" :catalog="catalog" :viewMode="view" :key="catalog.href">
          <template v-if="$slots.footer" #footer="slot">
            <slot name="footer" v-bind="slot" />
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
import ViewMixin from './ViewMixin';
import { sortStac } from '../models/stac';
import { orderCollections } from '../caladapt/collectionOrder';
import { COLLECTION_FILTERS } from '../caladapt/collectionFilters';
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
    ViewButtons
  },
  mixins: [ViewMixin],
  props: {
    catalogs: {
      type: Array,
      required: true
    },
    collectionsOnly: {
      type: Boolean,
      required: false
    },
    showControls: {
      type: Boolean,
      default: false
    },
    hideCount: {
      type: Boolean,
      default: false
    },
    title: {
      type: String,
      default: null
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
      default: null,
      validator: value => value === null || value >= 0
    }
  },
  emits: ['loadMore', 'paginate', 'search'],
  data() {
    return {
      searchTerm: '',
      sort: Utils.parseApiSortParameter(), // get empty sort object
      selectedKeywords: [],
      // Selected values per collection field, e.g. { 'caladapt:source': ['wrf'] }
      selectedFieldValues: Object.fromEntries(COLLECTION_FILTERS.map(filter => [filter.field, []])),
      selectedSearchTerms: [],
    };
  },
  computed: {
    ...mapState(['data', 'defaultCollectionSort', 'uiLanguage', 'collectionOrder', 'stateQueryParameters']),
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
      return this.apiSearch && this.supportsConformance(TYPES.Collections.FreeText, this.data);
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
    displayTitle() {
      if (this.title !== null) {
        return this.title;
      }
      let key = (this.collectionsOnly || this.allCatalogs.every(catalog => catalog.isCollection)) ? 'stacCollection' : 'stacCatalog';
      return this.$t(key, this.allCatalogs.length );
    },
    isComplete() {
      if (this.hasMore || this.showPagination) {
        return false;
      }
      return this.allCatalogs.every(obj => obj.isSTAC);
    },
    allowSorting() {
      return this.showControls && this.isComplete && this.catalogs.length > 1;
    },
    filterPlaceholder() {
      return this.isComplete ? this.$t('catalogs.filterByTitleAndMore') : this.$t('catalogs.filterByTitle');
    },
    showPagination() {
      // Check whether any pagination links are available
      return Object.values(this.pagination).some(link => Boolean(link));
    },
    allCatalogs() {
      return this.catalogs.map(catalog => {
        const stac = this.getStac(catalog);
        return stac ? stac : catalog;
      });
    },
    hasPillSelection() {
      return this.selectedKeywords.length > 0 || Object.values(this.selectedFieldValues).some(values => values.length > 0);
    },
    hasSearchCritera() {
      return this.searchTerm || this.hasPillSelection || this.selectedSearchTerms.length > 0;
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
            // Cal-Adapt: match any selected keyword (upstream requires every one)
            let hasKeywords = this.selectedKeywords.some(keyword => catalog.keywords.includes(keyword));
            if (!hasKeywords) {
              return false;
            }
          }
          // Cal-Adapt: in each field filter (data type, source), match any selected value
          for (const [field, values] of Object.entries(this.selectedFieldValues)) {
            if (values.length > 0 && !values.includes(catalog[field])) {
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
      if (this.allowSorting && !this.apiFilters.sortby && this.sort.direction !== 0) {
        catalogs = sortStac(catalogs, this.sort, this.uiLanguage);
      }
      // Cal-Adapt: the collections in config.collectionOrder come first
      return orderCollections(catalogs, this.collectionOrder);
    },
    // Cal-Adapt: number of collections per keyword, shown on the Topic pills
    keywordCounts() {
      const counts = {};
      if (!this.isComplete) {
        return counts;
      }
      for (const catalog of this.allCatalogs) {
        if (catalog instanceof STAC && Array.isArray(catalog.keywords)) {
          for (const keyword of catalog.keywords) {
            counts[keyword] = (counts[keyword] || 0) + 1;
          }
        }
      }
      return counts;
    },
    allKeywords() {
      return Object.keys(this.keywordCounts).sort();
    },
    // Cal-Adapt: the field filter rows with the number of collections per value;
    // values no collection has are left out, and so are rows with no values
    fieldFilters() {
      return COLLECTION_FILTERS
        .map(filter => ({
          ...filter,
          options: filter.values
            .map(value => ({ value, count: this.allCatalogs.filter(catalog => catalog[filter.field] === value).length }))
            .filter(option => option.count > 0)
        }))
        .filter(filter => filter.options.length > 0);
    }
  },
  watch: {
    selectedSearchTerms: {
      handler(searchTerms) {
        this.$emit('search', searchTerms);
      },
      deep: 1
    },
    // Cal-Adapt: keep the selected pills in the URL (e.g. ?.topic=energy,wind&.source=wrf)
    // so a filtered list survives a reload and can be shared
    selectedKeywords(keywords) {
      this.updatePillState('topic', keywords);
    },
    selectedFieldValues: {
      handler(selected) {
        for (const filter of COLLECTION_FILTERS) {
          this.updatePillState(filter.key, selected[filter.field]);
        }
      },
      deep: true
    }
  },
  created() {
    this.sort = Utils.parseApiSortParameter(this.defaultCollectionSort);
    if (this.showControls) {
      this.selectedKeywords = this.pillState('topic');
      for (const filter of COLLECTION_FILTERS) {
        this.selectedFieldValues[filter.field] = this.pillState(filter.key);
      }
    }
  },
  methods: {
    addSearchTerm(term) {
      if (!hasText(term)) {
        return;
      }
      this.selectedSearchTerms.push(term);
    },
    selectKeyword(keyword) {
      // Toggle a keyword on or off; collections with any selected keyword are shown
      this.selectedKeywords = this.selectedKeywords.includes(keyword)
        ? this.selectedKeywords.filter(k => k !== keyword)
        : [...this.selectedKeywords, keyword];
    },
    pillState(key) {
      // A value read from the URL is a comma-separated string
      const value = this.stateQueryParameters[key];
      if (Array.isArray(value)) {
        return value;
      }
      return hasText(value) ? value.split(',') : [];
    },
    updatePillState(key, values) {
      if (this.showControls) {
        this.$store.commit('updateState', { type: key, value: values.length > 0 ? values : null });
      }
    },
    clearPillFilters() {
      this.selectedKeywords = [];
      for (const field of Object.keys(this.selectedFieldValues)) {
        this.selectedFieldValues[field] = [];
      }
    },
    selectFieldValue(field, value) {
      const selected = this.selectedFieldValues[field];
      this.selectedFieldValues[field] = selected.includes(value)
        ? selected.filter(v => v !== value)
        : [...selected, value];
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

  > .pill-filter {
    flex-basis: 100%;
    display: flex;
    align-items: baseline;
    gap: 0.5rem;

    > .pill-filter-label {
      flex: 0 0 6rem;
      font-weight: 600;
    }

    > .pill-filter-options {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
    }

    .pill-count {
      opacity: 0.7;
      font-size: 0.85em;
    }

    // On phones, put the label above its pills so they get the full width
    @media (max-width: 575.98px) {
      flex-direction: column;
      align-items: flex-start;

      > .pill-filter-label {
        flex: none;
      }
    }
  }

  > .additional-filter-link {
    flex-grow: 0;
    white-space: nowrap;
    display: flex;
    align-items: center;
    justify-content: center;
  }
}
</style>
