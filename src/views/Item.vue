<template>
  <div class="item" :key="data.id">
    <b-row>
      <b-col class="left">
        <section class="mb-4">
          <b-card no-body class="maps-preview">
            <b-tabs v-model="tab" ref="tabs" card pills vertical end>
              <b-tab :title="$t('map')" no-body>
                <Map :stac="data" :stacLayerData="selectedAsset" @dataChanged="dataChanged" scrollWheelZoom />
              </b-tab>
              <b-tab v-if="thumbnails.length > 0" :title="$t('thumbnails')" no-body>
                <Thumbnails :thumbnails="thumbnails" />
              </b-tab>
            </b-tabs>
          </b-card>
        </section>
        <Assets v-if="hasAssets" :assets="assets" :context="data" :shown="shownAssets" @showAsset="showAsset" />
        <Links v-if="additionalLinks.length > 0" :title="$t('additionalResources')" :links="additionalLinks" :context="data" />
      </b-col>
      <b-col class="right">
        <section class="intro">
          <h2 v-if="data.properties.description">{{ $t('description') }}</h2>
          <DeprecationNotice v-if="data.properties.deprecated" :data="data" />
          <AnonymizedNotice v-if="data.properties['anon:warning']" :warning="data.properties['anon:warning']" />
          <ReadMore v-if="data.properties.description" :lines="10" :text="$t('read.more')" :text-less="$t('read.less')">
            <Description :description="data.properties.description" />
          </ReadMore>
          <Keywords v-if="Array.isArray(data.properties.keywords) && data.properties.keywords.length > 0" :keywords="data.properties.keywords" class="mb-3" />
        </section>
        <CollectionLink v-if="collectionLink" :link="collectionLink" />
        <Providers v-if="data.properties.providers" :providers="data.properties.providers" />
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
import { BTabs, BTab } from 'bootstrap-vue';
import { addSchemaToDocument, createItemSchema } from '../schema-org';

export default {
  name: "Item",
  components: {
    AnonymizedNotice: () => import('../components/AnonymizedNotice.vue'),
    Assets: () => import('../components/Assets.vue'),
    BTabs,
    BTab,
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
        // Will be rendered with a custom rendered
        'deprecated',
        // Don't show these complex lists of coordinates: https://github.com/radiantearth/stac-browser/issues/141
        'proj:bbox',
        'proj:geometry',
        // Special handling for auth
        'auth:schemes',
        // Special handling for the warning of the anonymized-location extension
        'anon:warning'
      ]
    };
  },
  computed: {
    ...mapState(['data', 'url']),
    ...mapGetters(['additionalLinks', 'collectionLink', 'parentLink'])
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

#stac-browser .item {
  .left, .right {
    max-width: 50%;
    @include media-breakpoint-down(sm) {
      max-width: 100%;
      min-width: 100%;
    }
  }

  .card-columns .thumbnail {
    align-self: center;
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
