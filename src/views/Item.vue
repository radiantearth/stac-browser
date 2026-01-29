<template>
  <div class="item" :key="data.id">
    
    <!-- Viewport Section: Map + Primary Info -->
    <section class="viewport-section mb-4">
      <div class="map-wrapper">
        <Map :stac="data" :stacLayerData="selectedAsset" @dataChanged="dataChanged" scrollWheelZoom />
      </div>
      <div class="viewport-info">
        <!-- <h6 class="text-uppercase small font-weight-bold text-muted mb-3">Title</h6> -->
        <h5 class="font-weight-bold mb-3 item-title-text">
          {{ data.properties.title || data.id }}
        </h5>
        
        <div class="status-badges mb-3">
          <DeprecationNotice v-if="data.properties.deprecated" :data="data" />
          <AnonymizedNotice v-if="data.properties['anon:warning']" :warning="data.properties['anon:warning']" />
        </div>

        <h6 class="text-uppercase small font-weight-bold text-muted mb-2">Description</h6>
        <div class="description-text small text-muted">
          <ReadMore v-if="data.properties.description" :lines="10" :text="$t('read.more')" :text-less="$t('read.less')">
            <Description :description="data.properties.description" />
          </ReadMore>
        </div>
        
        <Keywords v-if="Array.isArray(data.properties.keywords) && data.properties.keywords.length > 0" :keywords="data.properties.keywords" class="mt-3" />
      </div>
    </section>

    <b-row>
      <!-- Left Column: Assets & Links -->
      <b-col lg="8" class="left">
        <h5 class="text-uppercase small font-weight-bold text-muted mb-3">Data Assets</h5>
        <Assets v-if="hasAssets" :assets="assets" :context="data" :shown="shownAssets" @showAsset="showAsset" />
        
        <div v-if="additionalLinks.length > 0" class="mt-4">
           <Links :title="$t('additionalResources')" :links="additionalLinks" :context="data" />
        </div>
        
        <!-- Collection Hierarchy Link -->
        <div v-if="collectionLink" class="mt-4">
           <h5 class="text-uppercase small font-weight-bold text-muted mb-3">Hierarchy</h5>
           <CollectionLink :link="collectionLink" />
        </div>
      </b-col>

      <!-- Right Column: Technical Specs & Metadata -->
      <b-col lg="4" class="right">
        
        <!-- Tech Card: Geospatial Scope -->
        <div class="tech-card">
          <div class="tech-card-header">
            <h4>Geospatial Scope</h4>
          </div>
          <div class="data-grid">
            <div class="data-row" v-if="data.properties.datetime">
              <span class="data-label">Temporal</span>
              <span class="data-value">{{ formatTime(data.properties.datetime) }}</span>
            </div>
            <div class="data-row" v-if="data.bbox">
              <span class="data-label">Bounding Box</span>
              <span class="data-value">
                [{{ formatCoord(data.bbox[0]) }}, {{ formatCoord(data.bbox[1]) }}, 
                 {{ formatCoord(data.bbox[2]) }}, {{ formatCoord(data.bbox[3]) }}]
              </span>
            </div>
            <div class="data-row" v-if="data.id">
              <span class="data-label">ID</span>
              <span class="data-value">{{ data.id }}</span>
            </div>
          </div>
        </div>

        <!-- Providers -->
        <Providers v-if="data.properties.providers" :providers="data.properties.providers" class="mb-4" />

        <!-- Additional Metadata -->
        <Metadata :data="data" type="Item" :ignoreFields="ignoredMetadataFields" />
      </b-col>
    </b-row>
  </div>
</template>

<script>
import { mapState, mapGetters } from 'vuex';
import Description from '../components/Description.vue';
import ReadMore from "vue-read-more-smooth";
import ShowAssetMixin from '../components/ShowAssetMixin';
import { BTabs, BTab, BRow, BCol, BCard } from 'bootstrap-vue';
import { addSchemaToDocument, createItemSchema } from '../schema-org';

export default {
  name: "Item",
  components: {
    AnonymizedNotice: () => import('../components/AnonymizedNotice.vue'),
    Assets: () => import('../components/Assets.vue'),
    BRow,
    BCol,
    BTabs,
    BTab,
    BCard,
    CollectionLink: () => import('../components/CollectionLink.vue'),
    Description,
    DeprecationNotice: () => import('../components/DeprecationNotice.vue'),
    Keywords: () => import('../components/Keywords.vue'),
    Links: () => import('../components/Links.vue'),
    Map: () => import('../components/Map.vue'),
    Metadata: () => import('../components/Metadata.vue'),
    Providers: () => import('../components/Providers.vue'),
    ReadMore,
    Thumbnails: () => import('../components/Thumbnails.vue')
  },
  mixins: [ShowAssetMixin],
  data() {
    return {
      ignoredMetadataFields: [
        'description',
        'keywords',
        'providers',
        'title',
        'deprecated',
        'proj:bbox',
        'proj:geometry',
        'auth:schemes',
        'anon:warning',
        'datetime' // Ignored in generic metadata because it is in the Tech Card now
      ]
    };
  },
  computed: {
    ...mapState(['data', 'url']),
    ...mapGetters(['additionalLinks', 'collectionLink', 'parentLink'])
  },
  methods: {
    formatCoord(num) {
      return typeof num === 'number' ? num.toFixed(4) : num;
    },
    formatTime(str) {
      if (!str) return 'N/A';
      return str.replace('T', ' ').replace('Z', '');
    }
  },
  watch: {
    data: {
      immediate: true,
      handler(data) {
        try {
          let schema = createItemSchema(data, [this.collectionLink, this.parentLink], this.$store);
          addSchemaToDocument(document, schema);
        } catch (error) {
          console.error(error);
        }
      }
    }
  }
};
</script>

<style lang="scss">
@import '~bootstrap/scss/mixins';
@import "../theme/variables.scss";

// Font imports handled in global CSS or index.html usually, 
// ensuring we have access to JetBrains Mono here.

#stac-browser .item {
  font-family: 'Inter', -apple-system, sans-serif;

  // Viewport Section Styling
  .viewport-section {
    display: grid;
    grid-template-columns: 1fr 350px;
    gap: 1.5rem;
    background: $white;
    border: 1px solid $border-color;
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);

    @include media-breakpoint-down(md) {
      grid-template-columns: 1fr;
    }

    .map-wrapper {
      height: 450px;
      width: 100%;
      position: relative;
      z-index: 1;

      // Map container and map need to fill the wrapper
      .map-container {
        height: 100%;
        width: 100%;
      }

      // Override the global .map height
      .map {
        height: 100% !important;
        width: 100%;
        border-radius: 0;
      }
    }

    .viewport-info {
      padding: 1.5rem;
      background: #fafafa;
      border-left: 1px solid $border-color;
      display: flex;
      flex-direction: column;

      @include media-breakpoint-down(md) {
        border-left: none;
        border-top: 1px solid $border-color;
      }

      .item-title-text {
        color: $gray-900;
        line-height: 1.3;
      }
    }
  }

  // Technical Card Styling
  .tech-card {
    background: $white;
    border: 1px solid $border-color;
    border-radius: 8px;
    margin-bottom: 1.5rem;
    overflow: hidden;

    .tech-card-header {
      background: $gray-100;
      padding: 0.75rem 1rem;
      border-bottom: 1px solid $border-color;
      
      h4 {
        font-family: $font-family-sans-serif;
        font-size: 0.85rem;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        margin: 0;
        color: $gray-600;
        font-weight: 700;
      }
    }

    .data-grid {
      display: flex;
      flex-direction: column;

      .data-row {
        display: grid;
        grid-template-columns: 140px 1fr;
        padding: 0.75rem 1rem;
        border-bottom: 1px solid $gray-100;
        font-size: 0.9rem;

        &:last-child {
          border-bottom: none;
        }

        .data-label {
          font-weight: 600;
          color: $gray-500;
        }

        .data-value {
          font-family: 'JetBrains Mono', monospace;
          color: $gray-800;
          font-size: 0.85rem;
          word-break: break-word;
        }
      }
    }
  }

  // Asset Styling Overrides
  .assets {
    .card {
        border: 1px solid $border-color;
        border-radius: 8px;
        margin-bottom: 1rem;
        transition: all 0.2s ease;
        box-shadow: none;
        
        &:hover {
            border-color: $primary;
            box-shadow: 0 4px 12px rgba(0,0,0,0.05);
        }
    }
  }

  // Layout Columns
  .left, .right {
    max-width: 100%;
    @include media-breakpoint-down(sm) {
      max-width: 100%;
      min-width: 100%;
    }
  }
}
</style>