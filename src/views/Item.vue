<template>
  <div class="item" :key="data.id">
    <section class="hero-map">
      <b-card no-body class="maps-preview">
        <b-tabs v-model="tab" ref="tabs" card pills vertical end>
          <b-tab :title="$t('map')" :id="tabIds.map" no-body>
            <MapView ref="mapView" :stac="data" :assets="selectedAssets" @changed="dataChanged" @empty="handleEmptyMap" />
          </b-tab>
          <b-tab v-if="hasThumbnails" :id="tabIds.thumbnails" :title="$t('thumbnails')" no-body>
            <Thumbnails :thumbnails="thumbnails" />
          </b-tab>
        </b-tabs>
      </b-card>
    </section>
    <b-row>
      <b-col class="left">
        <WidgetHook id="view-item-primary-start" />
        <Assets v-if="hasAssets" :assets="assets" :shown="selectedReferences" @show-asset="showAsset" autoExpand />
        <ParquetViewer v-if="hasAssets" :assets="assets" @zoom-to-bbox="zoomToBbox" @highlight-bbox="highlightBbox" />
        <LinkList v-if="additionalLinks.length > 0" :title="$t('additionalResources')" :links="additionalLinks" />
        <WidgetHook id="view-item-primary-end" />
      </b-col>
      <b-col class="right">
        <WidgetHook id="view-item-secondary-start" />
        <section class="intro">
          <h2 v-if="data.properties.description">{{ $t('description') }}</h2>
          <DeprecationNotice v-if="showDeprecation" :data="data" />
          <AnonymizedNotice v-if="data.properties['anon:warning']" :warning="data.properties['anon:warning']" />
          <ReadMore v-if="data.properties.description" :lines="10" :text="$t('read.more')" :text-less="$t('read.less')">
            <Description :description="data.properties.description" />
          </ReadMore>
          <Keywords v-if="Array.isArray(data.properties.keywords) && data.properties.keywords.length > 0" :keywords="data.properties.keywords" class="mb-3" />
        </section>
        <CollectionLink v-if="collectionLink" :link="collectionLink" />
        <Providers v-if="data.properties.providers" :providers="data.properties.providers" />
        <MetadataGroups :data="data" type="Item" :ignoreFields="ignoredMetadataFields" />
        <WidgetHook id="view-item-secondary-end" />
      </b-col>
    </b-row>
  </div>
</template>

<script>
import { defineComponent, defineAsyncComponent } from 'vue';
import { mapState, mapGetters } from 'vuex';
import { BTab, BTabs, BCard } from 'bootstrap-vue-next';
import Description from '../components/Description.vue';
import ReadMore from "../components/ReadMore.vue";
import ShowAssetLinkMixin from '../components/ShowAssetLinkMixin';
import DeprecationMixin from '../components/DeprecationMixin';
import { addSchemaToDocument, createItemSchema } from '../schema-org';
import { getIgnoredFields } from '../ignored-metadata.js';

export default defineComponent({
  name: "Item",
  components: {
    BTab,
    BTabs,
    BCard,
    AnonymizedNotice: defineAsyncComponent(() => import('../components/AnonymizedNotice.vue')),
    Assets: defineAsyncComponent(() => import('../components/Assets.vue')),
    CollectionLink: defineAsyncComponent(() => import('../components/CollectionLink.vue')),
    Description,
    DeprecationNotice: defineAsyncComponent(() => import('../components/DeprecationNotice.vue')),
    Keywords: defineAsyncComponent(() => import('../components/Keywords.vue')),
    LinkList: defineAsyncComponent(() => import('../components/LinkList.vue')),
    MapView: defineAsyncComponent(() => import('../components/MapView.vue')),
    MetadataGroups: defineAsyncComponent(() => import('../components/MetadataGroups.vue')),
    Providers: defineAsyncComponent(() => import('../components/Providers.vue')),
    ReadMore,
    Thumbnails: defineAsyncComponent(() => import('../components/Thumbnails.vue')),
    ParquetViewer: defineAsyncComponent(() => import('../components/ParquetViewer.vue'))
  },
  mixins: [
    ShowAssetLinkMixin,
    DeprecationMixin
  ],
  computed: {
    ...mapState(['data', 'url']),
    ...mapGetters(['collectionLink', 'parentLink']),
    ignoredMetadataFields() {
      return getIgnoredFields(this.data);
    }
  },
  methods: {
    zoomToBbox({ bbox, crs }) {
      if (this.$refs.mapView?.zoomToBbox) {
        this.$refs.mapView.zoomToBbox(bbox, crs);
      }
    },
    highlightBbox({ bbox, crs }) {
      if (this.$refs.mapView?.highlightBbox) {
        this.$refs.mapView.highlightBbox(bbox, crs);
      }
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
});
</script>

<style lang="scss">
@import 'bootstrap/scss/mixins';
@import "../theme/variables.scss";

#stac-browser .item {
  .hero-map {
    margin: -155px (-$block-margin) $block-margin;

    .map {
      height: 555px;
    }

    .maplibregl-ctrl-top-right {
      top: 150px;
    }

    // The hero map is pulled up underneath the site header (z-index 10),
    // which would otherwise cover the map/thumbnails tab pills and block
    // clicks on them. Push the pills below the header, mirroring the
    // offset applied to the MapLibre controls above.
    .tabs .card-header {
      padding-top: 150px;
    }
  }

  .left, .right {
    max-width: 50%;
    @include media-breakpoint-down(md) {
      max-width: 100%;
      min-width: 100%;
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
