<template>
  <b-row class="catalog">
    <b-col class="left">
      <h2>Introduction</h2>
      <DeprecationNotice v-if="data.deprecated" :type="data.type" />
      <AnonymizedNotice v-if="data['anon:warning']" :warning="data['anon:warning']" />
      <ReadMore v-if="data.description" :lines="10">
        <Description :description="data.description" />
      </ReadMore>
      <Keywords v-if="Array.isArray(data.keywords) && data.keywords.length > 0" :keywords="data.keywords" />
      <section v-if="isCollection" class="metadata mb-4">
        <b-row v-if="licenses">
          <b-col md="4" class="label">Licenses</b-col>
          <b-col md="8" class="value" v-html="licenses" />
        </b-row>
        <b-row v-if="temporalExtents">
          <b-col md="4" class="label">Temporal Extents</b-col>
          <b-col md="8" class="value" v-html="temporalExtents" />
        </b-row>
      </section>
      <section class="mb-4">
        <b-tabs v-if="isCollection && thumbnails.length > 0" v-model="tab" ref="tabs">
          <b-tab title="Map">
            <Map :stac="data" :stacLayerData="selectedAsset" @mapClicked="mapClicked" @mapChanged="mapChanged" />
          </b-tab>
          <b-tab title="Preview">
            <Thumbnails :thumbnails="thumbnails" />
          </b-tab>
        </b-tabs>
        <Map v-else-if="isCollection" :stac="data" :stacLayerData="selectedAsset" @mapClicked="mapClicked" @mapChanged="mapChanged" />
        <Thumbnails v-else-if="thumbnails.length > 0" :thumbnails="thumbnails" />
      </section>
      <Links v-if="additionalLinks.length > 0" title="Additional resources" :links="additionalLinks" />
      <Metadata title="Metadata" class="mb-4" :type="data.type" :data="data" :ignoreFields="ignoredMetadataFields" />
    </b-col>
    <b-col class="right">
      <Providers v-if="hasProviders" :providers="data.providers" />
      <Catalogs v-if="catalogs.length > 0" :catalogs="catalogs" :hasMore="hasMoreCollections" @loadMore="loadMoreCollections" />
      <Items v-if="hasItems" :stac="data" :items="items" :api="isApi" :apiFilters="apiItemsFilter" :pagination="itemPages"
        @paginate="paginateItems" @filterItems="filterItems" />
      <Assets v-if="hasAssets" :assets="assets" :shown="shownAssets" @showAsset="showAsset" />
      <Assets v-if="hasItemAssets" :assets="data.item_assets" :definition="true" />
    </b-col>
  </b-row>
</template>

<script>
import { mapState, mapGetters } from 'vuex';
import Assets from '../components/Assets.vue';
import Catalogs from '../components/Catalogs.vue';
import Description from '../components/Description.vue';
import Items from '../components/Items.vue';
import Keywords from '../components/Keywords.vue';
import Links from '../components/Links.vue';
import Metadata from '../components/Metadata.vue';
import Providers from '../components/Providers.vue';
import ReadMore from "vue-read-more-smooth";
import Thumbnails from '../components/Thumbnails.vue';
import ShowAssetMixin from '../components/ShowAssetMixin';
import { Formatters } from '@radiantearth/stac-fields';
import { BTabs, BTab } from 'bootstrap-vue';
import Utils from '../utils';

export default {
  name: "Catalog",
  mixins: [ShowAssetMixin],
  components: {
    AnonymizedNotice: () => import('../components/AnonymizedNotice.vue'),
    Assets,
    BTabs,
    BTab,
    Catalogs,
    DeprecationNotice: () => import('../components/DeprecationNotice.vue'),
    Description,
    Items,
    Keywords,
    Links,
    Map: () => import('../components/Map.vue'),
    Metadata,
    Providers,
    ReadMore,
    Thumbnails
  },
  data() {
    return {
      ignoredMetadataFields: [
        // Catalog and Collection fields that are handled directly
        'stac_version',
        'stac_extensions',
        'id',
        'type',
        'title',
        'description',
        'keywords',
        'providers',
        'license',
        'extent',
        'summaries',
        'links',
        'assets',
        'item_assets',
        // API landing page, not very useful to display
        'conformsTo',
        // Will be rendered with a custom rendered
        'deprecated',
        // Special handling for the warning of the anonymized-location extension
        'anon:warning'
      ]
    };
  },
  computed: {
    ...mapState(['data', 'url', 'apiItems', 'apiItemsLink', 'apiItemsPagination', 'apiItemsFilter']),
    ...mapGetters(['additionalLinks', 'catalogs', 'isCollection', 'items', 'hasMoreCollections']),
    licenses() {
      if (this.isCollection && this.data.license) {
        return Formatters.formatLicense(this.data.license, null, null, this.data);
      }
      return null;
    },
    hasProviders() {
      return (this.isCollection && Array.isArray(this.data.providers) && this.data.providers.length > 0);
    },
    temporalExtents() {
      if (this.data && this.data.isCollection() && this.data.extent.temporal.interval.length > 0) {
        let extents = this.data.extent.temporal.interval;
        if (extents.length > 1) {
            // Remove union temporal extent in favor of more concrete extents
            extents = extents.slice(1);
        }
        return Formatters.formatTemporalExtents(extents);
      }
      return null;
    },
    hasItemAssets() {
      return Utils.size(this.data?.item_assets) > 0;
    },
    itemPages() {
      let pages = Object.assign({}, this.apiItemsPagination);
      // If first link is not available, add the items link as first link
      if (!pages.first && this.data && this.apiItemsLink && this.apiItemsLink.rel !== 'items') {
        pages.first = Utils.addFiltersToLink(this.data.getApiItemsLink(), this.apiItemsFilter);
      }
      return pages;
    },
    isApi() {
      return Boolean(this.apiItemsLink);
    },
    hasItems() {
      return this.items.length > 0 || this.isApi;
    }
  },
  methods: {
    loadMoreCollections() {
      this.$store.dispatch('loadNextApiCollections', {show: true});
    },
    async paginateItems(link) {
      try {
        await this.$store.dispatch('loadApiItems', {link, show: true});
      } catch (error) {
        this.$root.$emit('error', error, 'Sorry, loading the list of STAC Items failed.');
      }
    },
    async filterItems(filters) {
      try {
        await this.$store.dispatch('loadApiItems', {link: this.apiItemsLink, show: true, filters});
      } catch (error) {
        this.$root.$emit('error', error, 'Sorry, loading a filtered list of STAC Items failed.');
      }
    },
    mapClicked(stac) {
      console.log(stac); // todo
    }
  }
};
</script>

<style lang="scss">
@import '~bootstrap/scss/mixins';
@import "../theme/variables.scss";

.catalog {
  .left {
    min-width: 300px;
  }
  .right {
    min-width: 250px;
  }
  .metadata {
    .card-columns {
      column-count: 1;

      &:not(.count-1) {
        @include media-breakpoint-up(xxl) {
          column-count: 2;
        }
        @include media-breakpoint-up(xxxl) {
          column-count: 3;
        }
      }
    }
  }
  .items, .catalogs {
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