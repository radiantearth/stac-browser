<template>
  <div class="search d-flex flex-column">
    <Loading v-if="!root" stretch />
    <b-alert v-else-if="!supportsSearch" variant="danger" show>Item Search is not supported by the API.</b-alert>
    <b-row v-else>
      <b-col class="left">
        <ItemFilter
          :stac="root" title="" :value="filters" v-bind="filterComponentProps"
          @input="setFilters"
        />
      </b-col>
      <b-col class="right">
        <Loading v-if="apiItemsLoading" fill top />
        <b-alert v-else-if="!hasItems && !hasFilters" variant="info" show>Please modify the search criteria.</b-alert>
        <b-alert v-else-if="!hasItems" variant="warning" show>No items found for the given filters.</b-alert>
        <template v-if="hasItems">
          <div id="search-map">
            <Map :stac="root" :stacLayerData="itemCollection" scrollWheelZoom popover />
          </div>
          <Items
            :stac="root" :items="apiItems" :api="true" :allowFilter="false"
            :pagination="itemPages" @paginate="paginateItems"
          />
        </template>
      </b-col>
    </b-row>
  </div>
</template>

<script>
import Items from '../components/Items.vue';
import { mapGetters } from "vuex";
import Utils from '../utils';
import ApiItemsMixin from '../components/ApiItemsMixin';
import SortCapabilitiesMixin from '../components/SortCapabilitiesMixin';
import ItemFilter from '../components/ItemFilter.vue';
import Loading from '../components/Loading.vue';

const pageTitle = 'Search';

export default {
  name: "Search",
  components: {
    ItemFilter,
    Items,
    Loading,
    Map: () => import('../components/Map.vue')
  },
  mixins: [
    ApiItemsMixin(true),
    SortCapabilitiesMixin(false)
  ],
  props: {
    loadRoot: {
      type: String,
      default: null
    }
  },
  data() {
    return {
      filters: {},
      selectedItem: null
    };
  },
  computed: {
    ...mapGetters(["root", "searchLink", 'supportsSearch', 'fromBrowserPath']),
    itemCollection() {
      return {
        type: 'FeatureCollection',
        features: this.apiItems,
        links: []
      };
    },
    hasFilters() {
      return Utils.size(this.filters) > 0;
    },
    hasItems() {
      return this.apiItems.length > 0;
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
  created() {
    if (this.loadRoot && !this.root) {
      let catalogUrl = this.fromBrowserPath(this.loadRoot);
      this.$store.commit("config", { catalogUrl });
    }
  },
  methods: {
    async setFilters(filters, reset = false) {
      this.filters = filters;
      if (reset) {
        this.resetApiItems();
      }
      else {
        await this.filterItems(filters);
      }
    },
    showPage() {
      this.$store.commit('showPage', {title: pageTitle});
      this.apiItemsLink = this.searchLink;
    },
    handleResponse(response) {
      if (response) {
        this.$store.commit('showPage', {title: pageTitle, url: response.config.url});
      }
    }
  }
};
</script>

<style lang="scss" scoped>
@import '~bootstrap/scss/mixins';
@import "../theme/variables.scss";

.search {
  min-height: 100%;

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