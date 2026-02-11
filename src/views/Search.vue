<template>
  <main class="search d-flex flex-column">
    <Loading v-if="!parent" stretch />
    <ErrorAlert v-else-if="!searchLink" :description="$t('search.notSupported')" />
    <b-row v-else>
      <b-col class="left">
        <b-tabs v-model="activeSearch">
          <b-tab v-if="collectionSearch" :title="$t('search.tabs.collections')" id="search-collections-tab">
            <SearchFilter
              :parent="parent" title="" :value="collectionFilters" type="Collections"
              @input="setFilters"
            />
          </b-tab>
          <b-tab v-if="itemSearch" :title="$t('search.tabs.items')" id="search-items-tab">
            <SearchFilter
              :parent="parent" title="" :value="itemFilters" type="Global"
              @input="setFilters"
            />
          </b-tab>
        </b-tabs>
      </b-col>
      <b-col class="right">
        <Loading v-if="loading" fill top />
        <ErrorAlert v-else-if="error" :description="error" :id="errorId" />
        <b-alert v-else-if="data === null" variant="info" show>{{ $t('search.modifyCriteria') }}</b-alert>
        <b-alert v-else-if="results.length === 0 && noFurtherItems" variant="info" show>{{ $t('search.noFurtherItemsFound') }}</b-alert>
        <b-alert v-else-if="results.length === 0" variant="warning" show>{{ $t('search.noItemsFound') }}</b-alert>
        <template v-else>
          <div id="search-map" v-if="resultCollection">
            <MapView :stac="parent" :children="resultCollection" onfocusOnly popover />
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
        </template>
      </b-col>
    </b-row>
    <b-alert v-if="selectedCollectionCount > 0" show variant="dark" class="selected-collections-action">
      <b-button @click="openItemSearch" variant="primary" size="lg">
        {{ $t('search.useInItemSearch', selectedCollectionCount, {count: selectedCollectionCount}) }}
      </b-button>
    </b-alert>
  </main>
</template>

<script>
import Utils from '../utils';
import SearchFilter from '../components/SearchFilter.vue';
import Loading from '../components/Loading.vue';
import ErrorAlert from '../components/ErrorAlert.vue';
import { getDisplayTitle, createSTAC, CollectionCollection, ItemCollection } from '../models/stac';
import { STAC } from 'stac-js';
import { defineComponent, defineAsyncComponent } from 'vue';
import { getErrorCode, getErrorMessage, processSTAC, stacRequest } from '../store/utils';
import { mapGetters, mapState } from "vuex";
import { BTab, BTabs } from 'bootstrap-vue-next';

export default defineComponent({
  name: "Search",
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
      selectedCollections: {}
    };
  },
  computed: {
    ...mapState(['catalogUrl', 'catalogTitle', 'searchResultsPerPage', 'itemsPerPage', 'collectionsPerPage']),
    ...mapGetters(['canSearchItems', 'canSearchCollections', 'getStac', 'root', 'collectionLink', 'parentLink', 'fromBrowserPath', 'toBrowserPath']),
    selectedCollectionCount() {
      return Utils.size(this.selectedCollections);
    },
    totalCount() {
      if (typeof this.data.numberMatched === 'number') {
        return this.data.numberMatched;
      }
      return null;
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
    resultCollection() {
      if (this.isCollectionSearch) {
        return new CollectionCollection({
          collections: this.results,
          links: []
        });
      }
      else {
        return new ItemCollection({
          type: 'FeatureCollection',
          features: this.results,
          links: []
        });
      }
    },
    results() {
      if (Utils.size(this.data) === 0) {
        return [];
      }
      let list = this.isCollectionSearch ? this.data.collections : this.data.features;
      let type = this.isCollectionSearch ? 'Collection' : 'Feature';
      if (!Array.isArray(list)) {
        return [];
      }
      // todo: use itemcollection class
      return list
        .map(obj => {
          try {
            if (!Utils.isObject(obj) || obj.type !== type) {
              return null;
            }
            let selfLink = Utils.getLinkWithRel(obj.links, 'self');
            let url;
            if (selfLink?.href) {
              url = Utils.toAbsolute(selfLink.href, this.link.href);
            }
            let stac = createSTAC(obj, url, this.toBrowserPath(url));
            stac = processSTAC(this.$store.state, stac);
            return stac;
          } catch (error) {
            console.error(error);
            return null;
          }
        })
        .filter(obj => obj instanceof STAC);
    },
    pagination() {
      return Utils.getPaginationLinks(this.data);
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
    activeSearch() {
      this.data = null;
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
  },
  methods: {
    openItemSearch() {
      this.itemFilters.collections = Object.keys(this.selectedCollections);
      this.activeSearch = 'search-items-tab';
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

        let key = this.isCollectionSearch ? 'collections' : 'features';
        let response = await stacRequest(this.$store, this.link);
        if (response) {
          this.showPage(response.config.url);
        }
        if (!Utils.isObject(response.data) || !Array.isArray(response.data[key])) {
          this.data = {};
          this.error = this.$t(this.isCollectionSearch ? 'errors.invalidStacCollections' : 'errors.invalidStacItems');
        }
        else {
          this.data = response.data;
        }
      } catch (error) {
        this.data = {};
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
      else {
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
  margin-bottom: $block-margin;
}

#stac-browser .search {
  .selected-collections-action {
    position: fixed;
    bottom: 0;
    right: 0;
    z-index: 5000;
    margin: 1rem;
    box-shadow: 2px 2px 4px 0px rgba(0, 0, 0, 0.25);
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
