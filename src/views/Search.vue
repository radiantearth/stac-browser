<template>
  <main class="search d-flex flex-column">
    <Loading v-if="!parent" stretch />
    <b-alert v-else-if="!searchLink" variant="danger" show>{{ $t('search.notSupported') }}</b-alert>
    <b-row v-else>
      <b-col class="left">
        <ItemFilter
          :stac="parent" title="" :value="filters" v-bind="filterComponentProps"
          @input="setFilters"
        />
      </b-col>
      <b-col class="right">
        <Loading v-if="loading" fill top />
        <b-alert v-else-if="!hasItems && !hasFilters" variant="info" show>{{ $t('search.modifyCriteria') }}</b-alert>
        <b-alert v-else-if="!hasItems" variant="warning" show>{{ $t('search.noItemsFound') }}</b-alert>
        <template v-if="hasItems">
          <div id="search-map">
            <Map :stac="parent" :stacLayerData="itemCollection" scrollWheelZoom popover />
          </div>
          <Items
            :stac="parent" :items="apiItems" :api="true" :allowFilter="false"
            :pagination="itemPages" @paginate="paginateItems"
          />
        </template>
      </b-col>
    </b-row>
  </main>
</template>

<script>
import Items from '../components/Items.vue';
import { mapGetters, mapMutations, mapState } from "vuex";
import Utils from '../utils';
import apiCapabilitiesMixinGenerator from '../components/ApiCapabilitiesMixin';
import ItemFilter from '../components/ItemFilter.vue';
import Loading from '../components/Loading.vue';
import STAC from '../models/stac';

const searchId = '__search__';

export default {
  name: "Search",
  components: {
    ItemFilter,
    Items,
    Loading,
    Map: () => import('../components/Map.vue')
  },
  mixins: [
    apiCapabilitiesMixinGenerator(false)
  ],
  props: {
    loadParent: {
      type: String,
      default: null
    }
  },
  data() {
    return {
      parent: null,
      filters: {},
      selectedItem: null
    };
  },
  computed: {
    ...mapState(['apiItems', 'apiItemsLink', 'apiItemsPagination', 'catalogUrl', 'catalogTitle']),
    ...mapGetters(['getStac', 'root', 'collectionLink', 'parentLink', 'fromBrowserPath', 'getApiItemsLoading']),
    pageTitle() {
      return this.$t('search.title');
    },
    loading() {
      return this.getApiItemsLoading(searchId);
    },
    searchLink() {
      return this.parent instanceof STAC && this.parent.getSearchLink();
    },
    itemCollection() {
      return {
        type: 'FeatureCollection',
        features: this.apiItems,
        links: []
      };
    },
    itemPages() {
      let pages = Object.assign({}, this.apiItemsPagination);
      // If first link is not available, add the items link as first link
      if (!pages.first && this.data && this.apiItemsLink) {
        pages.first = Utils.addFiltersToLink(this.apiItemsLink, this.filters);
      }
      return pages;
    },
    hasFilters() {
      return Utils.size(this.filters) > 0;
    },
    hasItems() {
      return this.apiItems.length > 0;
    },
    pageDescription() {
      let title = STAC.getDisplayTitle([this.collectionLink, this.parentLink, this.root], this.catalogTitle);
      return this.$t('search.metaDescription', {title});
    }
  },
  watch:{
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
    }
  },
  methods: {
    ...mapMutations(['toggleApiItemsLoading']),
    async setFilters(filters, reset = false) {
      this.filters = filters;
      if (reset) {
        this.$store.commit('resetApiItems');
      }
      else {
        await this.filterItems(filters);
      }
    },
    showPage() {
      this.$store.commit('showPage', {
        title: this.pageTitle,
        description: this.pageDescription
      });
      this.$store.commit('setApiItemsLink', this.searchLink);
    },
    async paginateItems(link) {
      this.toggleApiItemsLoading(searchId);
      try {
        let response = await this.$store.dispatch('loadApiItems', {link, show: true, filters: this.filters});
        this.handleResponse(response);
      } catch (error) {
        this.$root.$emit('error', error, this.$t('errors.loadItems'));
      } finally {
        this.toggleApiItemsLoading(searchId);
      }
    },
    async filterItems(filters) {
      this.toggleApiItemsLoading(searchId);
      try {
        let response = await this.$store.dispatch('loadApiItems', {link: this.searchLink, show: true, filters});
        this.handleResponse(response);
      } catch(error) {
        this.$root.$emit('error', error, this.$t('errors.loadFilteredItems'));
      } finally {
        this.toggleApiItemsLoading(searchId);
      }
    },
    handleResponse(response) {
      if (response) {
        this.$store.commit('showPage', {
          title: this.pageTitle,
          url: response.config.url,
          description: this.pageDescription
        });
      }
    }
  }
};
</script>

<style lang="scss" scoped>
@import '~bootstrap/scss/mixins';
@import "../theme/variables.scss";

.search {
  .left {
    min-width: 200px;
    flex-basis: 40%;
  }
  .right {
    min-width: 300px;
    flex-basis: 60%;
    position: relative !important;
  }
  .items {
    .card-columns {
      @include media-breakpoint-only(sm) {
        column-count: 1;
      }
      @include media-breakpoint-only(md) {
        column-count: 1;
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