<template>
  <main class="search d-flex flex-column">
    <Loading v-if="!parent" stretch />
    <b-alert v-else-if="!canSearch" variant="danger" show>{{ $t('search.notSupported') }}</b-alert>
    <b-row v-else>
      <b-col class="left">
        <b-tabs v-model="activeSearch">
          <b-tab v-if="canSearchCollections" :title="$t('search.tabs.collections')">
            <SearchFilter
              :parent="parent" title="" :value="collectionFilters" type="Collections"
              @input="setFilters"
            />
          </b-tab>
          <b-tab v-if="canSearchItems" :title="$t('search.tabs.items')">
            <SearchFilter
              :parent="parent" title="" :value="itemFilters" type="Global"
              @input="setFilters"
            />
          </b-tab>
        </b-tabs>
      </b-col>
      <b-col class="right">
        <b-alert v-if="error" variant="error" show>{{ error }}</b-alert>
        <Loading v-else-if="!data && loading" fill top />
        <b-alert v-else-if="data === null" variant="info" show>{{ $t('search.modifyCriteria') }}</b-alert>
        <b-alert v-else-if="results.length === 0" variant="warning" show>{{ $t('search.noItemsFound') }}</b-alert>
        <template v-else>
          <div id="search-map" v-if="itemCollection">
            <Map :stac="stac" :stacLayerData="itemCollection" scrollWheelZoom popover />
          </div>
          <Catalogs
            v-if="isCollectionSearch" :catalogs="results" collectionsOnly
            :pagination="pagination" :loading="loading" @paginate="loadResults"
            :count="totalCount"
          >
            <template #catalogFooter="slot">
              <b-button-group v-if="canSearchItems || canFilterItems(slot.data)" vertical size="sm">
                <b-button v-if="canSearchItems" variant="outline-primary" :pressed="selectedCollections[slot.data.id]" @click="selectForItemSearch(slot.data)">
                  <b-icon-check-square v-if="selectedCollections[slot.data.id]" />
                  <b-icon-square v-else />
                  <span class="ml-2">{{ $t('search.selectForItemSearch') }}</span>
                </b-button>
                <StacLink :button="{variant: 'outline-primary', disabled: !canFilterItems(slot.data)}" :data="slot.data" :title="$t('search.filterCollection')" :state="{itemFilterOpen: 1}" />
              </b-button-group>
            </template>
          </Catalogs>
          <Items
            v-else
            :stac="stac" :items="results" :api="true" :allowFilter="false"
            :pagination="pagination" :loading="loading" @paginate="loadResults"
            :count="totalCount"
          />
        </template>
      </b-col>
    </b-row>
    <b-alert v-if="selectedCollectionCount > 0" show variant="dark" class="selected-collections-action">
      <b-button @click="openItemSearch" variant="primary" size="lg">
        {{ $tc('search.useInItemSearch', selectedCollectionCount, {count: selectedCollectionCount}) }}
      </b-button>
    </b-alert>
  </main>
</template>

<script>
import { mapGetters, mapState } from "vuex";
import Utils from '../utils';
import SearchFilter from '../components/SearchFilter.vue';
import Loading from '../components/Loading.vue';
import STAC from '../models/stac';
import { BIconCheckSquare, BIconSquare, BTabs, BTab } from 'bootstrap-vue';
import { processSTAC, stacRequest } from '../store/utils';

export default {
  name: "Search",
  components: {
    BIconCheckSquare,
    BIconSquare,
    BTab,
    BTabs,
    Catalogs: () => import('../components/Catalogs.vue'),
    Loading,
    Items: () => import('../components/Items.vue'),
    Map: () => import('../components/Map.vue'),
    SearchFilter,
    StacLink: () => import('../components/StacLink.vue')
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
      link: null,
      loading: false,
      data: null,

      itemFilters: {},
      collectionFilters: {},
      activeSearch: 0,
      selectedCollections: {}
    };
  },
  computed: {
    ...mapState(['catalogUrl', 'catalogTitle', 'itemsPerPage']),
    ...mapGetters(['canSearch', 'canSearchItems', 'canSearchCollections', 'getStac', 'root', 'collectionLink', 'parentLink', 'fromBrowserPath', 'toBrowserPath']),
    selectedCollectionCount() {
      return Utils.size(this.selectedCollections);
    },
    totalCount() {
      if (typeof this.data.numberMatched === 'number') {
        return this.data.numberMatched;
      }
      return null;
    },
    stac() {
      if (this.parent instanceof STAC) {
        return this.parent;
      }
      return null;
    },
    searchLink() {
      return this.isCollectionSearch ? this.collectionSearchLink : this.itemSearchLink;
    },
    collectionSearchLink() {
      return this.parent instanceof STAC && this.parent.getApiCollectionsLink();
    },
    itemSearchLink() {
      return this.parent instanceof STAC && this.parent.getSearchLink();
    },
    itemCollection() {
      if (this.isCollectionSearch) {
        return null; // wait for stac-js to convert bboxes to geojson
      }
      return {
        type: 'FeatureCollection',
        features: this.results,
        links: []
      };
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
            let stac = new STAC(obj, url, this.toBrowserPath(url));
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
      return this.canSearchCollections && this.activeSearch === 0;
    },
    pageDescription() {
      let title = STAC.getDisplayTitle([this.collectionLink, this.parentLink, this.root], this.catalogTitle);
      return this.$t('search.metaDescription', {title});
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
        this.$store.commit("config", { catalogUrl: url });
      }
      this.parent = this.getStac(url);
      this.showPage();
    }
  },
  methods: {
    openItemSearch() {
      this.$set(this.itemFilters, 'collections', Object.keys(this.selectedCollections));
      this.activeSearch = 1;
      this.selectedCollections = {};
    },
    selectForItemSearch(collection) {
      if (this.selectedCollections[collection.id]) {
        this.$delete(this.selectedCollections, collection.id);
      }
      else {
        this.$set(this.selectedCollections, collection.id, true);
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
      this.loading = true;
      try {
        this.link = Utils.addFiltersToLink(link, this.filters, this.itemsPerPage);

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
        this.error = error.message;
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
        title: this.$t('search.title'),
        description: this.pageDescription,
        url
      });
    }
  }
};
</script>

<style lang="scss">
@import '~bootstrap/scss/mixins';
@import "../theme/variables.scss";

#stac-browser {
  .search .left .tabs .tab-content .filter .card {
    border-top: 0;
    border-top-left-radius: 0;
    border-top-right-radius: 0;
  }
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
    min-width: 350px;
    flex-basis: 40%;
  }
  .right {
    min-width: 250px;
    flex-basis: 60%;
    position: relative !important;
  }
  .items, .catalogs {
    .card-columns {
      @include media-breakpoint-only(sm) {
        column-count: 1;
      }
      @include media-breakpoint-only(md) {
        column-count: 2;
      }
      @include media-breakpoint-only(lg) {
        column-count: 2;
      }
      @include media-breakpoint-only(xl) {
        column-count: 2;
      }
      @include media-breakpoint-only(xxl) {
        column-count: 3;
      }
      @include media-breakpoint-up(xxxl) {
        column-count: 4;
      }
    }
  }
}
</style>
