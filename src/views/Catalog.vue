<template>
  <div :class="{cc: true, [data.type.toLowerCase()]: true, mixed: hasCatalogs && hasItems, empty: !hasCatalogs && !hasItems}">
    <b-row>
      <b-col class="meta">
        <section class="intro">
          <h2>Description</h2>
          <DeprecationNotice v-if="data.deprecated" :data="data" />
          <AnonymizedNotice v-if="data['anon:warning']" :warning="data['anon:warning']" />
          <ReadMore v-if="data.description" :lines="10">
            <Description :description="data.description" />
          </ReadMore>
          <Keywords v-if="Array.isArray(data.keywords) && data.keywords.length > 0" :keywords="data.keywords" />
          <section v-if="isCollection" class="metadata mb-4">
            <b-row v-if="licenses">
              <b-col md="4" class="label">License</b-col>
              <b-col md="8" class="value" v-html="licenses" />
            </b-row>
            <b-row v-if="temporalExtents">
              <b-col md="4" class="label">Temporal Extents</b-col>
              <b-col md="8" class="value" v-html="temporalExtents" />
            </b-row>
          </section>
        </section>
        <section v-if="isCollection || thumbnails.length > 0" class="mb-4">
          <b-card no-body class="maps-preview">
            <b-tabs v-model="tab" ref="tabs" pills card vertical end>
              <b-tab v-if="isCollection" title="Map" no-body>
                <Map :stac="data" :stacLayerData="selectedAsset" @mapClicked="mapClicked" @mapChanged="mapChanged" />
              </b-tab>
              <b-tab v-if="thumbnails.length > 0" title="Preview" no-body>
                <Thumbnails :thumbnails="thumbnails" />
              </b-tab>
            </b-tabs>
          </b-card>
        </section>
        <Assets v-if="hasAssets" :assets="assets" :context="data" :shown="shownAssets" @showAsset="showAsset" />
        <Assets v-if="hasItemAssets && !hasItems" :assets="data.item_assets" :definition="true" />
        <Providers v-if="hasProviders" :providers="data.providers" />
        <Metadata title="Metadata" class="mb-4" :type="data.type" :data="data" :ignoreFields="ignoredMetadataFields" />
        <Links v-if="additionalLinks.length > 0" title="Additional resources" :links="additionalLinks" />
      </b-col>
      <b-col class="catalogs-container" v-if="hasCatalogs">
        <Catalogs :catalogs="catalogs" :hasMore="hasMoreCollections" @loadMore="loadMoreCollections" />
      </b-col>
      <b-col class="items-container" v-if="hasItems">
        <Items :stac="data" :items="items" :api="isApi" :apiFilters="apiItemsFilter" :pagination="itemPages"
          @paginate="paginateItems" @filterItems="filterItems" />
        <Assets v-if="hasItemAssets" :assets="data.item_assets" :definition="true" />
      </b-col>
    </b-row>
  </div>
</template>

<script>
import { mapState, mapGetters } from 'vuex';
import Catalogs from '../components/Catalogs.vue';
import Description from '../components/Description.vue';
import Items from '../components/Items.vue';
import Links from '../components/Links.vue';
import Metadata from '../components/Metadata.vue';
import ReadMore from "vue-read-more-smooth";
import ShowAssetMixin from '../components/ShowAssetMixin';
import { Formatters } from '@radiantearth/stac-fields';
import { BTabs, BTab } from 'bootstrap-vue';
import Utils from '../utils';

export default {
  name: "Catalog",
  mixins: [ShowAssetMixin],
  components: {
    AnonymizedNotice: () => import('../components/AnonymizedNotice.vue'),
    Assets: () => import('../components/Assets.vue'),
    BTabs,
    BTab,
    Catalogs,
    DeprecationNotice: () => import('../components/DeprecationNotice.vue'),
    Description,
    Items,
    Keywords: () => import('../components/Keywords.vue'),
    Links,
    Map: () => import('../components/Map.vue'),
    Metadata,
    Providers: () => import('../components/Providers.vue'),
    ReadMore,
    Thumbnails: () => import('../components/Thumbnails.vue')
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
        // Don't show these complex lists of coordinates: https://github.com/radiantearth/stac-browser/issues/141
        'proj:bbox',
        'proj:geometry',
        // API landing page, not very useful to display, but https://github.com/radiantearth/stac-browser/issues/136
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
    },
    hasCatalogs() {
      return this.catalogs.length > 0;
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

#stac-browser .cc {
  .items-container, .catalogs-container {
    max-width: 50%;

    .card-list {
      flex-flow: column wrap;
    }

    .items, .catalogs {
      .card-columns {
        column-count: 1;

        .thumbnail {
          align-self: center;
        }
      }
    }
  }

  &.catalog { // Catalog has items or catalogs
    .items-container, .catalogs-container {
      max-width: 100%;
      
      .items, .catalogs {
        .card-columns {
          @include media-breakpoint-up(sm) {
            column-count: 2;
          }
          @include media-breakpoint-up(lg) {
            column-count: 3;
          }
          @include media-breakpoint-up(xxl) {
            column-count: 4;
          }
          @include media-breakpoint-up(xxxl) {
            column-count: 6;
          }
        }
      }
    }
  }

  &.collection { // Collection has items or catalogs
    .items-container, .catalogs-container {
      .items, .catalogs {
        .card-columns {
          @include media-breakpoint-only(md) {
            column-count: 2;
          }
          @include media-breakpoint-up(lg) {
            column-count: 1;
          }
          @include media-breakpoint-up(xxl) {
            column-count: 2;
          }
          @include media-breakpoint-up(xxxl) {
            column-count: 3;
          }
        }
      }
    }
  }

  &.catalog.mixed { // Catalog has items and catalogs
    .items-container, .catalogs-container {
      .items, .catalogs {
        .card-columns {
          @include media-breakpoint-up(lg) {
            column-count: 1;
          }
          @include media-breakpoint-up(xl) {
            column-count: 2;
          }
          @include media-breakpoint-up(xxl) {
            column-count: 3;
          }
        }
      }
    }
  }

  &.collection.mixed { // Collection has items and catalogs
    .items-container, .catalogs-container {
      max-width: 33%;

      
      .items, .catalogs {
        .card-columns {
          @include media-breakpoint-up(lg) {
            column-count: 1;
          }
          @include media-breakpoint-up(xxl) {
            column-count: 2;
          }
          @include media-breakpoint-up(xxxl) {
            column-count: 3;
          }
        }
      }
    }
  }

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