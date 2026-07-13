<template>
  <main class="search d-flex flex-column">
    <Loading v-if="!parent" stretch />
    <ErrorAlert v-else-if="!supportsSearch" :description="$t('search.notSupported')" />
    <b-row v-else>
      <b-col class="left">
        <WidgetHook id="view-search-filters-start" />
        <b-tabs v-model="activeSearch">
          <b-tab v-if="collectionSearch" :title="$t('search.tabs.collections')" :id="tabIds.collections">
            <WidgetHook id="view-search-filters-collections-start" />
            <SearchFilter
              :parent="parent" title="" :value="collectionFilters" type="Collections"
              @input="setFilters"
            />
            <WidgetHook id="view-search-filters-collections-end" />
          </b-tab>
          <b-tab v-if="itemSearch" :title="$t('search.tabs.items')" :id="tabIds.items">
            <WidgetHook id="view-search-filters-items-start" />
            <SearchFilter
              :parent="parent" title="" :value="itemFilters" type="Global"
              :searchLink="itemSearch"
              @input="setFilters"
            />
            <WidgetHook id="view-search-filters-items-end" />
          </b-tab>
        </b-tabs>
        <WidgetHook id="view-search-filters-end" />
      </b-col>
      <b-col class="right">
        <Loading v-if="loading" fill top />
        <ErrorAlert v-else-if="error" :description="error" :id="errorId" />
        <b-alert v-else-if="data === null" variant="secondary" show>{{ $t('search.modifyCriteria') }}</b-alert>
        <b-alert v-else-if="results.length === 0 && noFurtherItems" variant="secondary" show>{{ $t('search.noFurtherItemsFound') }}</b-alert>
        <b-alert v-else-if="results.length === 0" variant="warning" show>{{ $t('search.noItemsFound') }}</b-alert>
        <template v-else>
          <WidgetHook id="view-search-results-start" />
          <div id="search-map" v-if="data">
            <MapView :stac="parent" :children="data" onfocusOnly popover />
          </div>
          <Catalogs
            v-if="isCollectionSearch" :catalogs="results" collectionsOnly
            :pagination="pagination" :loading="loading" @paginate="loadResults"
            :count="totalCount" :apiFilters="collectionFilters"
          >
            <template #catalogFooter="slot">
              <b-button-group v-if="itemSearch || canFilterItems(slot.data)" vertical size="sm">
                <b-button v-if="itemSearch" variant="outline-primary" :pressed="selectedCollections[slot.data.id]" @click="selectForItemSearch(slot.data)">
                  <b-icon-check-square v-if="selectedCollections[slot.data.id]" />
                  <b-icon-square v-else />
                  <span class="ms-2">{{ $t('search.selectForItemSearch') }}</span>
                </b-button>
                <StacLink :button="{variant: 'outline-primary', disabled: !canFilterItems(slot.data)}" :data="slot.data" :title="$t('search.filterCollection')" :state="{itemFilterOpen: 1}" />
              </b-button-group>
            </template>
          </Catalogs>
          <Items
            v-else
            :stac="parent" :items="results" :api="true" :allowFilter="false"
            :pagination="pagination" :loading="loading" @paginate="loadResults"
            :count="totalCount" :apiFilters="itemFilters"
          />
          <WidgetHook id="view-search-results-end" />
        </template>
      </b-col>
    </b-row>
    <b-button
      v-if="selectedCollectionCount> 0" @click="openItemSearch"
      variant="primary" size="lg" class="selected-collections-action"
    >
      {{ $t('search.useInItemSearch', selectedCollectionCount, {count: selectedCollectionCount}) }}
    </b-button>
  </main>
</template>

<script>
import Utils from '../utils';
import { isObject, size } from 'stac-js/src/utils.js';
import SearchFilter from '../components/SearchFilter.vue';
import Loading from '../components/Loading.vue';
import ErrorAlert from '../components/ErrorAlert.vue';
import { getDisplayTitle, createSTAC } from '../models/stac';
import { STAC } from 'stac-js';
import { defineComponent, defineAsyncComponent } from 'vue';
import { getErrorCode, getErrorMessage } from '../store/utils';
import { mapGetters, mapState } from "vuex";
import { BTab, BTabs } from 'bootstrap-vue-next';

export default defineComponent({
  name: "ApiSearch",
  components: {
    Catalogs: defineAsyncComponent(() => import('../components/Catalogs.vue')),
    BTabs,
    BTab,
    ErrorAlert,
    Loading,
    SearchFilter,
    Items: defineAsyncComponent(() => import('../components/Items.vue')),
    MapView: defineAsyncComponent(() => import('../components/MapView.vue')),
    StacLink: defineAsyncComponent(() => import('../components/StacLink.vue'))
  },
  props: {
    loadParent: {
      type: String,
      default: null
    }
  },
  data() {
    return {
      parent: null,
      error: null,
      errorId: null,
      link: null,
      loading: false,
      data: null,
      itemFilters: {},
      collectionFilters: {},
      activeSearch: undefined,
      selectedCollections: {},
      tabIds: {
        collections: 'search-collections-tab',
        items: 'search-items-tab'
      }
    };
  },
  computed: {
    ...mapState(['catalogUrl', 'catalogTitle', 'searchResultsPerPage', 'stateQueryParameters']),
    ...mapGetters(['canSearchItems', 'canSearchCollections', 'getStac', 'root', 'collectionLink', 'parentLink', 'fromBrowserPath']),
    selectedCollectionCount() {
      return size(this.selectedCollections);
    },
    totalCount() {
      if (typeof this.data?.numberMatched === 'number') {
        return this.data.numberMatched;
      }
      return null;
    },
    supportsSearch() {
      return this.canSearchCollections || this.canSearchItems;
    },
    searchLink() {
      return this.isCollectionSearch ? this.collectionSearch : this.itemSearch;
    },
    collectionSearch() {
      return this.canSearchCollections && this.parent && this.parent.getApiCollectionsLink();
    },
    itemSearch() {
      return this.canSearchItems && this.parent && this.parent.getSearchLink();
    },
    results() {
      return this.data?.getAll() || [];
    },
    pagination() {
      return this.data?.getPaginationLinks() || {};
    },
    filters() {
      return this.isCollectionSearch ? this.collectionFilters : this.itemFilters;
    },
    isCollectionSearch() {
      return this.collectionSearch && this.activeSearch === 'search-collections-tab';
    },
    pageDescription() {
      let title = getDisplayTitle([this.collectionLink, this.parentLink, this.root], this.catalogTitle);
      return this.$t('search.metaDescription', {title});
    },
    noFurtherItems() {
      // Ideally this would be dertmined by the prev link, but it's not required
      // so we check whether our current link has a next rel type which indicates
      // that it's a subsequent page. On the first pages the link rel type would be
      // "search" (or "prev" or "first"). This only works for forward navigation.
      return this.link && this.link.rel === 'next';
    }
  },
  watch:{
    'stateQueryParameters.searchtype': {
      immediate: true,
      handler(searchType) {
        if (searchType && this.tabIds[searchType]) {
          this.activeSearch = this.tabIds[searchType];
        }
      }
    },
    'stateQueryParameters.q': {
      handler(q) {
        this.updateFreeText(q, true);
      }
    },
    activeSearch(tab) {
      // Reset search results when switching tabs
      this.data = null;
      // Update the search type (collections/items) in the URL
      const tabId = Object.entries(this.tabIds).find(([, value]) => value === tab);
      if (tabId) {
        this.$store.commit('updateState', {type: 'searchtype', value: tabId[0]});
      }
    },
    searchLink: {
      immediate: true,
      handler() {
        if (this.searchLink) {
          this.showPage();
        }
      }
    }
  },
  async created() {
    let url = this.catalogUrl;
    if (this.loadParent) {
      url = this.fromBrowserPath(this.loadParent);
      this.parent = this.getStac(url);
    }
    else {
      this.parent = this.root;
    }
    if (!this.parent) {
      await this.$store.dispatch('load', { url });
      if (!this.root) {
        await this.$store.dispatch("config", { catalogUrl: url });
      }
      this.parent = this.getStac(url);
      this.showPage();
    }

    // We had this initially in a watcher with immediate: true, but this was executed too early.
    // Thus we only apply it once when creating the component and then on any subsequent change.
    this.updateFreeText(this.stateQueryParameters.q);
  },
  methods: {
    updateFreeText(q, force = false) {
      if (Array.isArray(q) && (force || size(q) > 0)) {
        this.setFilters({ q });
      }
    },
    openItemSearch() {
      this.itemFilters.collections = Object.keys(this.selectedCollections);
      this.activeSearch = this.tabIds.items;
      this.selectedCollections = {};
    },
    selectForItemSearch(collection) {
      if (this.selectedCollections[collection.id]) {
        delete this.selectedCollections[collection.id];
      }
      else {
        this.selectedCollections[collection.id] = true;
      }
    },
    canFilterItems(data) {
      if (data instanceof STAC) {
        return Boolean(data.getApiItemsLink());
      }
      return false;
    },
    async loadResults(link) {
      this.error = null;
      this.errorId = null;
      this.loading = true;

      try {
        this.link = Utils.addFiltersToLink(link, this.filters, this.searchResultsPerPage);
      
        const response = await this.$store.dispatch('request', { link: this.link });
        if (response) {
          this.showPage(response.config.url);
        }

        const key = this.isCollectionSearch ? 'collections' : 'features';
        if (!isObject(response.data) || !Array.isArray(response.data[key])) {
          this.data = null;
          this.error = this.$t(this.isCollectionSearch ? 'errors.invalidStacCollections' : 'errors.invalidStacItems');
        }
        else {
          const url = this.link.getAbsoluteUrl();
          const data = createSTAC(response.data, url, this.$store);
          this.data = data;
        }
      } catch (error) {
        this.data = null;
        this.error = getErrorMessage(error);
        this.errorId = getErrorCode(error);
      } finally {
        this.loading = false;
      }
    },
    async setFilters(filters, reset = false) {
      if (this.isCollectionSearch) {
        this.collectionFilters = filters;
      }
      else {
        this.itemFilters = filters;
      }
      if (reset) {
        this.data = null;
      }
      else if (this.searchLink) {
        await this.loadResults(this.searchLink);
      }
    },
    showPage(url) {
      this.$store.commit('showPage', {
        url,
        page: () => ({
          title: this.$t('search.title'),
          description: this.pageDescription,
        })
      });
    }
  }
});
</script>

<style lang="scss">
@import 'bootstrap/scss/mixins';
@import "../theme/variables.scss";

#stac-browser {
  .search .left .tabs .tab-content .filter .card {
    border-top: 0;
    border-top-left-radius: 0;
    border-top-right-radius: 0;
  }
}

#search-map {
  margin-bottom: var(--sb-block-gap);
}

#stac-browser .search {
  .selected-collections-action {
    position: fixed;
    bottom: 2rem;
    right: 2rem;
    z-index: 5000;
    box-shadow: 0 6px 14px 0 rgba(0, 0, 0, 0.5);

    &:hover {
      box-shadow: 0 8px 16px 0 rgba(0, 0, 0, 0.6);
    }
  }

  .left {
    min-width: 420px;
    flex-basis: 40%;
  }
  .right {
    min-width: 250px;
    flex-basis: 60%;
    position: relative !important;
  }
}
</style>
