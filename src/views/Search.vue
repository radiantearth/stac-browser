<template>
  <div class="search">
    <div v-if="!root" class="loading text-center">
      <b-spinner label="Loading..."></b-spinner>
    </div>
    <b-alert v-else-if="!supportsSearch" variant="danger" show>Item Search (with 'GET') is not supported by the API.</b-alert>
    <b-row v-else>
      <b-col class="left">
        <ItemFilter :stac="root" title="" :value="filters" :sort="canSort" @input="setFilters" />
      </b-col>
      <b-col class="right">
        <b-alert v-if="loading === null" variant="light" show>Please modify the search criteria.</b-alert>
        <div v-else-if="loading === true" class="loading text-center">
          <b-spinner label="Loading..."></b-spinner>
        </div>
        <b-alert v-else-if="apiItems.length === 0" variant="info" show>Sorry, no items match the given criteria.</b-alert>
        <template v-else>
          <Map :stac="root" :stacLayerData="itemCollection" @mapClicked="mapClicked" />
          <Items :stac="root" :items="apiItems" :api="true" :allowFilter="false" :selected="selected" :pagination="itemPages" @paginate="paginateItems" />
        </template>
      </b-col>
    </b-row>
  </div>
</template>

<script>
import Items from '../components/Items.vue';
import { mapGetters, mapState } from "vuex";
import Utils from '../utils';
import { ITEMSEARCH_SORT } from '../api';

const pageTitle = 'Search';

export default {
  name: "Search",
  components: {
    ItemFilter: () => import('../components/ItemFilter.vue'),
    Items,
    Map: () => import('../components/Map.vue')
  },
  data() {
    return {
      loading: null,
      filters: {},
      selected: []
    };
  },
  props: {
    loadRoot: {
      type: String,
      default: null
    }
  },
  created() {
    if (this.loadRoot && !this.root) {
      let catalogUrl = this.fromBrowserPath(this.loadRoot);
      this.$store.commit("config", { catalogUrl });
    }
  },
  computed: {
    ...mapState(['apiItems', 'apiItemsLink', 'apiItemsPagination', 'apiItemsFilter']),
    ...mapGetters(["root", "searchLink", 'supportsSearch', 'supportsConformance', 'fromBrowserPath']),
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
        pages.first = Utils.addFiltersToLink(this.apiItemsLink, this.apiItemsFilter);
      }
      return pages;
    },
    canSort() {
      return this.supportsConformance(ITEMSEARCH_SORT);
    }
  },
  watch:{
    supportsSearch: {
      immediate: true,
      handler() {
        if (this.supportsSearch) {
          this.showPage();
        }
      }
    }
  },
  methods: {
    async setFilters(filters, reset = false) {
      this.filters = filters;
      if (reset) {
        this.$store.commit('resetApiItems');
        this.loading = null;
      }
      else {
        await this.filterItems(filters);
      }
    },
    showPage() {
      this.$store.commit('showPage', {title: pageTitle});
      this.$store.commit('setApiItemsLink', this.searchLink);
    },
    async paginateItems(link) {
      try {
        let response = await this.$store.dispatch('loadApiItems', {link, show: true});
        this.handleResponse(response);
      } catch (error) {
        this.$root.$emit('error', error, 'Sorry, loading the list of STAC Items failed.');
      }
    },
    async filterItems(filters) {
      this.loading = true;
      try {
        let response = await this.$store.dispatch('loadApiItems', { link: this.searchLink, show: true, filters });
        this.handleResponse(response);
      } catch(error) {
        this.$root.$emit('error', error, 'Sorry, loading a filtered list of STAC Items failed.');
      } finally {
        this.loading = false;
      }
    },
    handleResponse(response) {
      if (response) {
        this.$store.commit('showPage', {title: pageTitle, url: response.config.url});
      }
    },
    mapClicked(event) {
      if (event.type !== 'Feature') {
        return;
      }

      // ToDo: Implement something more useful
      this.selected = [event.data];

/* Doesn't work right now, scrolls to incorrect blocks?!
      let selected = document.querySelectorAll('.item-card.border-danger');
      if (selected.length === 1) {
        Utils.scrollTo(selected[0]);
      } */
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