<template>
  <div :class="{cc: true, [cssStacType]: true, empty: !hasCatalogs && !hasItems}" :key="data.id">
    <b-row>
      <b-col class="meta">
        <section class="intro">
          <h2>{{ $t('description') }}</h2>
          <DeprecationNotice v-if="showDeprecation" :data="data" />
          <AnonymizedNotice v-if="data['anon:warning']" :warning="data['anon:warning']" />
          <ReadMore v-if="data.description" :lines="10" :text="$t('read.more')" :text-less="$t('read.less')">
            <Description :description="data.description" />
          </ReadMore>
          <Keywords v-if="Array.isArray(data.keywords) && data.keywords.length > 0" :keywords="data.keywords" class="mb-3" />
          <CollectionLink v-if="collectionLink" :link="collectionLink" />
          <section v-if="isCollection" class="metadata mb-4">
            <b-row v-if="licenses">
              <b-col md="4" class="label">{{ $t('catalog.license') }}</b-col>
              <b-col md="8" class="value"><span v-html="licenses" /></b-col>
            </b-row>
            <b-row v-if="temporalExtents">
              <b-col md="4" class="label">{{ $t('catalog.temporalExtent') }}</b-col>
              <b-col md="8" class="value"><span v-html="temporalExtents" /></b-col>
            </b-row>
          </section>
          <Links v-if="linkPosition === 'left'" :title="$t('additionalResources')" :links="additionalLinks" :context="data" />
        </section>
        <section v-if="isCollection || hasThumbnails" class="mb-4">
          <b-card no-body class="maps-preview">
            <b-tabs v-model="tab" ref="tabs" pills card vertical end>
              <b-tab v-if="isCollection" :title="$t('map')" no-body>
                <Map :stac="data" v-bind="mapData" @changed="dataChanged" @empty="handleEmptyMap" onfocusOnly popover />
              </b-tab>
              <b-tab v-if="hasThumbnails" :title="$t('thumbnails')" no-body>
                <Thumbnails :thumbnails="thumbnails" />
              </b-tab>
            </b-tabs>
          </b-card>
        </section>
        <Assets v-if="hasAssets" :assets="assets" :context="data" :shown="selectedReferences" @showAsset="showAsset" />
        <Assets v-if="hasItemAssets && !hasItems" :assets="itemAssets" :context="data" :definition="true" />
        <Providers v-if="providers" :providers="providers" />
        <Metadata class="mb-4" :type="data.type" :data="data" :ignoreFields="ignoredMetadataFields" />
        <Links v-if="linkPosition === 'right'" :title="$t('additionalResources')" :links="additionalLinks" :context="data" />
      </b-col>
      <b-col class="catalogs-container" v-if="hasCatalogs">
        <Catalogs :catalogs="catalogs" :hasMore="!!nextCollectionsLink" @loadMore="loadMoreCollections" />
      </b-col>
      <b-col class="items-container" v-if="hasItems || hasItemAssets">
        <Items
          :stac="data" :items="items" :api="isApi"
          :showFilters="showFilters" :apiFilters="filters"
          :pagination="itemPages" :loading="apiItemsLoading"
          :count="apiItemsNumberMatched"
          @paginate="paginateItems" @filterItems="filterItems"
          @filtersShown="filtersShown"
        />
        <Assets v-if="hasItemAssets" :assets="itemAssets" :context="data" :definition="true" />
      </b-col>
    </b-row>
  </div>
</template>

<script>
import { mapState, mapGetters } from 'vuex';
import Catalogs from '../components/Catalogs.vue';
import Description from '../components/Description.vue';
import Items from '../components/Items.vue';
import ReadMore from "vue-read-more-smooth";
import ShowAssetLinkMixin from '../components/ShowAssetLinkMixin';
import StacFieldsMixin from '../components/StacFieldsMixin';
import { formatLicense, formatTemporalExtents } from '@radiantearth/stac-fields/formatters';
import { BTabs, BTab } from 'bootstrap-vue';
import Utils from '../utils';
import { addSchemaToDocument, createCatalogSchema } from '../schema-org';
import { ItemCollection } from '../models/stac.js';
import DeprecationMixin from '../components/DeprecationMixin.js';

export default {
  name: "Catalog",
  components: {
    AnonymizedNotice: () => import('../components/AnonymizedNotice.vue'),
    Assets: () => import('../components/Assets.vue'),
    BTabs,
    BTab,
    Catalogs,
    CollectionLink: () => import('../components/CollectionLink.vue'),
    DeprecationNotice: () => import('../components/DeprecationNotice.vue'),
    Description,
    Items,
    Keywords: () => import('../components/Keywords.vue'),
    Links: () => import('../components/Links.vue'),
    Map: () => import('../components/Map.vue'),
    Metadata: () => import('../components/Metadata.vue'),
    Providers: () => import('../components/Providers.vue'),
    ReadMore,
    Thumbnails: () => import('../components/Thumbnails.vue')
  },
  mixins: [
    ShowAssetLinkMixin,
    StacFieldsMixin({ formatLicense, formatTemporalExtents }),
    DeprecationMixin
  ],
  data() {
    return {
      filters: {},
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
        // Don't show these complex lists of coordinates: https://github.com/radiantearth/stac-browser/issues/141
        'proj:bbox',
        'proj:geometry',
        // API landing page, not very useful to display, but https://github.com/radiantearth/stac-browser/issues/136
        'conformsTo',
        // Will be rendered with a custom rendered
        'deprecated',
        // Special handling for the warning of the anonymized-location extension
        'anon:warning',
        // Special handling for the stats extension
        'stats:catalogs',
        'stats:collections',
        'stats:items',
        // Special handling for auth
        'auth:schemes',
        // Special handling for the STAC Browser config
        'stac_browser'
      ]
    };
  },
  computed: {
    ...mapState(['data', 'url', 'apiItems', 'apiItemsLink', 'apiItemsPagination', 'apiItemsNumberMatched', 'nextCollectionsLink', 'stateQueryParameters']),
    ...mapGetters(['catalogs', 'collectionLink', 'isCollection', 'items', 'getApiItemsLoading', 'parentLink', 'rootLink']),
    cssStacType() {
      if (Utils.hasText(this.data?.type)) {
        return this.data?.type.toLowerCase();
      }
      return null;
    },
    showFilters() {
      return Boolean(this.stateQueryParameters['itemFilterOpen']);
    },
    linkPosition() {
      if (this.additionalLinks.length === 0) {
        return null;
      }
      if (this.isCollection || !this.hasThumbnails) {
        return "right";
      }
      else {
        return "left";
      }
    },
    apiItemsLoading() {
      return this.getApiItemsLoading(this.data);
    },
    licenses() {
      if (this.data.license) {
        return this.formatLicense(this.data.license, null, null, this.data);
      }
      return null;
    },
    providers() {
      let providers = [];
      if (Array.isArray(this.data.providers) && this.data.providers.length > 0) {
        providers = this.data.providers;
      }
      else if (this.isCollection && Utils.isObject(this.data.summaries) && Array.isArray(this.data.summaries.providers)) {
        providers = this.data.summaries.providers;
      }
      return providers.length > 0 ? providers : null;
    },
    temporalExtents() {
      if (this.isCollection && this.data.extent.temporal.interval.length > 0) {
        let extents = this.data.extent.temporal.interval;
        if (extents.length > 1) {
            // Remove union temporal extent in favor of more concrete extents
            extents = extents.slice(1);
        }
        return this.formatTemporalExtents(extents);
      }
      return null;
    },
    hasItemAssets() {
      return this.itemAssets.length > 0;
    },
    itemAssets() {
      if (!this.data || !Utils.isObject(this.data.item_assets)) {
        return [];
      }
      return Object.values(this.data.item_assets);
    },
    itemPages() {
      let pages = Object.assign({}, this.apiItemsPagination);
      // If first link is not available, add the items link as first link
      if (!pages.first && this.data && this.apiItemsLink && this.apiItemsLink.rel !== 'items') {
        pages.first = Utils.addFiltersToLink(this.data.getApiItemsLink(), this.filters);
      }
      return pages;
    },
    isApi() {
      return Boolean(this.apiItemsLink);
    },
    hasItems() {
      return this.items.length > 0 || this.isApi;
    },
    hasCatalogs() {
      return this.catalogs.length > 0;
    },
    mapData() {
      const data = {};
      if (this.selectedAssets.length > 0) {
        data.assets = this.selectedAssets;
      }
      else {
        const items = this.items.filter(item => item.type === 'Feature');
        if (items.length > 0) {
          data.children = new ItemCollection({
            type: 'FeatureCollection',
            features: items
          });
        }
      }
      return data;
    }
  },
  watch: {
    data: {
      immediate: true,
      handler(data) {
        try {
          let schema = createCatalogSchema(data, [this.parentLink, this.rootLink], this.$store);
          addSchemaToDocument(document, schema);
        } catch (error) {
          console.error(error);
        }
      }
    }
  },
  methods: {
    filtersShown(show) {
        this.$store.commit('updateState', {type: 'itemFilterOpen', value: show ? 1 : null});
    },
    loadMoreCollections() {
      this.$store.dispatch('loadNextApiCollections', {show: true});
    },
    async paginateItems(link) {
      try {
        await this.$store.dispatch('loadApiItems', {link, show: true, filters: this.filters});
      } catch (error) {
        this.$root.$emit('error', error, this.$t('errors.loadItems'));
      }
    },
    async filterItems(filters, reset) {
      this.filters = filters;
      if (reset) {
        this.$store.commit('resetApiItems', this.data.getApiItemsLink());
      }
      try {
        await this.$store.dispatch('loadApiItems', {link: this.data.getApiItemsLink(), show: true, filters});
      } catch (error) {
        let msg = reset ? this.$t('errors.loadItems') : this.$t('errors.loadFilteredItems');
        this.$root.$emit('error', error, msg);
      }
    }
  }
};
</script>

<style lang="scss">
@import '~bootstrap/scss/mixins';
@import "../theme/variables.scss";

#stac-browser .cc {
  .meta {
    min-width: 100%;
    margin-bottom: $block-margin;
  }
  &.collection .meta {
    min-width: 33%;
    margin-bottom: 0;
  }

  @include media-breakpoint-up(lg) {
    &.collection.empty .meta {
      column-count: 2;

      > section {
        break-inside: avoid;
      }
    }
  }

  @include media-breakpoint-up(xl) {
    &.catalog .meta {
      display: flex;
      flex-direction: row;
      flex-wrap: wrap;
      gap: 30px;

      > section {
        flex-basis: 0;
        flex-grow: 1;
        max-width: 100%;
        min-width: 40%;
      }
    }
  }

  @include media-breakpoint-down(md) {
    > .row {
      > .meta,
      > .items-container,
      > .catalogs-container {
        min-width: 100%;
      }

      > .meta {
        order: 1;
        margin-bottom: $block-margin;
      }
      > .items-container {
        order: 2;
      }
      > .catalogs-container {
        order: 3;
      }
    }
  }

  .metadata .card-columns {
    column-count: 1;

    &:not(.count-1) {
      @include media-breakpoint-up(xxxl) {
        column-count: 2;
      }
    }
  }
}
</style>
