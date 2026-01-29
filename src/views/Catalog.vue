<template>
  <div class="catalog" :key="data.id">
    <!-- Main Header (for non-root catalogs) -->
    <div class="main-header" v-if="!isRoot">
      <div class="container">
        <div class="breadcrumb-tech">
          <span>CATALOG</span> / <span class="accent">{{ title }}</span>
        </div>
        <div class="d-md-flex justify-content-between align-items-end">
          <div>
            <h1 class="item-title">{{ title }}</h1>
            <div class="d-flex align-items-center gap-2">
              <span class="badge badge-tech badge-status">{{ data.type || 'CATALOG' }}</span>
              <span class="text-muted small">ID: {{ data.id }}</span>
            </div>
          </div>
          <div class="mt-3 mt-md-0">
            <div class="btn-group shadow-sm">
              <a class="btn btn-tech btn-tech-outline" :href="url" target="_blank">JSON Source</a>
              <StacLink v-if="parentLink" :data="parentLink" class="btn btn-tech btn-tech-outline">Up</StacLink>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="ground-layer">
      <!-- Viewport Section: Description -->
      <section class="viewport-section mb-4" v-if="data.description">
        <div class="viewport-info w-100">
          <h6 class="text-uppercase small font-weight-bold text-muted mb-3">Description</h6>
          <DeprecationNotice v-if="data.deprecated" :data="data" />
          <AnonymizedNotice v-if="data['anon:warning']" :warning="data['anon:warning']" />
          <div class="description-text text-muted">
            <ReadMore :lines="5" :text="$t('read.more')" :text-less="$t('read.less')">
              <Description :description="data.description" />
            </ReadMore>
          </div>
        </div>
      </section>

      <!-- Map/Thumbnails Section for Collections -->
      <section v-if="isCollection || hasThumbnails" class="mb-4">
        <b-card no-body class="maps-preview">
          <b-tabs v-model="tab" ref="tabs" pills card vertical end>
            <b-tab v-if="isCollection" :title="$t('map')" no-body>
              <Map :stac="data" :stacLayerData="mapData" @dataChanged="dataChanged" fitBoundsOnce popover />
            </b-tab>
            <b-tab v-if="hasThumbnails" :title="$t('thumbnails')" no-body>
              <Thumbnails :thumbnails="thumbnails" />
            </b-tab>
          </b-tabs>
        </b-card>
      </section>

      <b-row>
        <!-- Left Column: Catalogs & Items -->
        <b-col lg="8" class="left">
          <div v-if="hasCatalogs" class="section-block">
            <h5 class="text-uppercase small font-weight-bold text-muted mb-3">Sub-Catalogs</h5>
            <Catalogs :catalogs="catalogs" :hasMore="!!nextCollectionsLink" @loadMore="loadMoreCollections" />
          </div>

          <div v-if="hasItems" class="section-block">
            <h5 class="text-uppercase small font-weight-bold text-muted mb-3">Items</h5>
            <Items
              :stac="data" :items="items" :api="isApi"
              :showFilters="showFilters" :apiFilters="filters"
              :pagination="itemPages" :loading="apiItemsLoading"
              @paginate="paginateItems" @filterItems="filterItems"
              @filtersShown="filtersShown"
            />
          </div>

          <div v-if="hasAssets" class="section-block">
            <h5 class="text-uppercase small font-weight-bold text-muted mb-3">Assets</h5>
            <Assets :assets="assets" :context="data" :shown="shownAssets" @showAsset="showAsset" />
          </div>

          <div v-if="hasItemAssets && !hasItems" class="section-block">
            <h5 class="text-uppercase small font-weight-bold text-muted mb-3">Item Asset Definitions</h5>
            <Assets :assets="data.item_assets" :context="data" :definition="true" />
          </div>

          <div v-if="additionalLinks.length > 0" class="section-block">
            <Links :title="$t('additionalResources')" :links="additionalLinks" :context="data" />
          </div>
        </b-col>

        <!-- Right Column: Metadata & Tech Cards -->
        <b-col lg="4" class="right">
          <!-- Tech Card: Keywords -->
          <div class="tech-card" v-if="Array.isArray(data.keywords) && data.keywords.length > 0">
            <div class="tech-card-header">
              <h4>Keywords</h4>
            </div>
            <div class="p-3">
              <Keywords :keywords="data.keywords" />
            </div>
          </div>

          <!-- Tech Card: License & Temporal (for Collections) -->
          <div class="tech-card" v-if="isCollection && (licenses || temporalExtents)">
            <div class="tech-card-header">
              <h4>Collection Info</h4>
            </div>
            <div class="data-grid">
              <div class="data-row" v-if="licenses">
                <span class="data-label">License</span>
                <span class="data-value" v-html="licenses"></span>
              </div>
              <div class="data-row" v-if="temporalExtents">
                <span class="data-label">Temporal Extent</span>
                <span class="data-value" v-html="temporalExtents"></span>
              </div>
            </div>
          </div>

          <!-- Tech Card: Providers -->
          <div class="tech-card" v-if="providers && providers.length">
            <div class="tech-card-header">
              <h4>Providers</h4>
            </div>
            <div class="p-3">
              <Providers :providers="providers" />
            </div>
          </div>

          <!-- Collection Link -->
          <CollectionLink v-if="collectionLink" :link="collectionLink" class="mb-4" />

          <!-- Additional Metadata -->
          <Metadata :data="data" :type="data.type" :ignoreFields="ignoredMetadataFields" />
        </b-col>
      </b-row>
    </div>
  </div>
</template>

<script>
import { mapState, mapGetters } from 'vuex';
import Catalogs from '../components/Catalogs.vue';
import Description from '../components/Description.vue';
import Items from '../components/Items.vue';
import ReadMore from "vue-read-more-smooth";
import ShowAssetMixin from '../components/ShowAssetMixin';
import StacFieldsMixin from '../components/StacFieldsMixin';
import { formatLicense, formatTemporalExtents } from '@radiantearth/stac-fields/formatters';
import { BTabs, BTab, BRow, BCol } from 'bootstrap-vue';
import Utils from '../utils';
import { addSchemaToDocument, createCatalogSchema } from '../schema-org';

export default {
  name: "Catalog",
  components: {
    AnonymizedNotice: () => import('../components/AnonymizedNotice.vue'),
    Assets: () => import('../components/Assets.vue'),
    BTabs,
    BTab,
    BRow,
    BCol,
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
    StacLink: () => import('../components/StacLink.vue'),
    Thumbnails: () => import('../components/Thumbnails.vue')
  },
  mixins: [
    ShowAssetMixin,
    StacFieldsMixin({ formatLicense, formatTemporalExtents })
  ],
  data() {
    return {
      filters: {},
      ignoredMetadataFields: [
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
        'proj:bbox',
        'proj:geometry',
        'conformsTo',
        'deprecated',
        'anon:warning',
        'stats:catalogs',
        'stats:collections',
        'stats:items',
        'auth:schemes',
        'stac_browser'
      ]
    };
  },
  computed: {
    ...mapState(['data', 'url', 'apiItems', 'apiItemsLink', 'apiItemsPagination', 'nextCollectionsLink', 'stateQueryParameters']),
    ...mapGetters(['additionalLinks', 'catalogs', 'collectionLink', 'isCollection', 'isRoot', 'items', 'getApiItemsLoading', 'parentLink', 'rootLink']),
    title() {
      return this.data.title || this.data.id;
    },
    showFilters() {
      return Boolean(this.stateQueryParameters['itemFilterOpen']);
    },
    hasThumbnails() {
      return this.thumbnails.length > 0;
    },
    apiItemsLoading() {
      return this.getApiItemsLoading(this.data);
    },
    licenses() {
      if (this.isCollection && this.data.license) {
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
      if (this.isCollection && this.data.extent?.temporal?.interval?.length > 0) {
        let extents = this.data.extent.temporal.interval;
        if (extents.length > 1) {
          extents = extents.slice(1);
        }
        return this.formatTemporalExtents(extents);
      }
      return null;
    },
    hasItemAssets() {
      return Utils.size(this.data?.item_assets) > 0;
    },
    itemPages() {
      let pages = Object.assign({}, this.apiItemsPagination);
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
      if (this.selectedAsset) {
        return this.selectedAsset;
      }
      else {
        return {
          type: 'FeatureCollection',
          features: this.items
        };
      }
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

#stac-browser .catalog {
  // Main Header
  .main-header {
    background: $white;
    border-bottom: 1px solid $border-color;
    padding: 2rem 0;
    margin-bottom: 1.5rem;
    margin-left: -1.5rem;
    margin-right: -1.5rem;
    padding-left: 1.5rem;
    padding-right: 1.5rem;
  }

  .item-title {
    font-size: 2rem;
    font-weight: 800;
    color: $body-color;
    letter-spacing: -0.02em;
    margin-bottom: 0.75rem;
  }

  .breadcrumb-tech {
    font-size: 0.75rem;
    text-transform: uppercase;
    font-weight: 600;
    color: $gray-500;
    margin-bottom: 0.5rem;
    letter-spacing: 0.05em;

    .accent {
      color: $primary;
    }
  }

  // Viewport Section
  .viewport-section {
    background: $white;
    border: 1px solid $border-color;
    border-radius: $border-radius;
    overflow: hidden;

    .viewport-info {
      padding: 1.5rem;
      background: #fafafa;
    }
  }

  // Section blocks
  .section-block {
    margin-bottom: 2rem;

    &:last-child {
      margin-bottom: 0;
    }
  }

  // Tech Cards
  .tech-card {
    background: $white;
    border: 1px solid $border-color;
    border-radius: $border-radius;
    margin-bottom: 1.5rem;
    overflow: hidden;

    .tech-card-header {
      background: $gray-100;
      padding: 0.75rem 1rem;
      border-bottom: 1px solid $border-color;

      h4 {
        font-family: $font-family-sans-serif;
        font-size: 0.8rem;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        margin: 0;
        color: $gray-600;
        font-weight: 700;
      }
    }

    .data-grid {
      .data-row {
        display: flex;
        justify-content: space-between;
        padding: 0.75rem 1rem;
        border-bottom: 1px solid $gray-100;
        font-size: 0.85rem;

        &:last-child {
          border-bottom: none;
        }

        .data-label {
          color: $gray-500;
          font-weight: 500;
        }

        .data-value {
          color: $body-color;
          font-weight: 500;
          text-align: right;
        }
      }
    }
  }

  // Badge styles
  .badge-tech {
    font-family: $font-family-monospace;
    font-size: 0.7rem;
    padding: 0.3em 0.6em;
    border-radius: 4px;
    font-weight: 500;

    &.badge-status {
      background: lighten($success, 45%);
      color: darken($success, 15%);
      border: 1px solid lighten($success, 30%);
    }
  }

  // Tech Buttons
  .btn-tech {
    font-weight: 600;
    font-size: 0.8rem;
    text-transform: uppercase;
    letter-spacing: 0.025em;
    padding: 0.5rem 1.25rem;
    border-radius: $border-radius;
    text-decoration: none;

    &:hover {
      text-decoration: none;
    }
  }

  .btn-tech-outline {
    border: 1px solid $border-color;
    background: white;
    color: $secondary;

    &:hover {
      background: $gray-100;
      color: $secondary;
    }
  }

  // Map preview
  .maps-preview {
    border-radius: $border-radius;
    overflow: hidden;

    .map {
      height: 350px;
    }
  }

  // Layout columns
  .left, .right {
    @include media-breakpoint-down(md) {
      max-width: 100%;
      min-width: 100%;
    }
  }

  // Utility
  .gap-2 {
    gap: 0.5rem;
  }
}
</style>
