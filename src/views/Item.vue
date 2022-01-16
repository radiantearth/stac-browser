<template>
  <div class="item">
    <b-row>
      <b-col>
        <DeprecationNotice v-if="data.properties.deprecated" :type="data.type" />
        <AnonymizedNotice v-if="data.properties['anon:warning']" :warning="data.properties['anon:warning']" />
        <ReadMore v-if="data.properties.description" :lines="10">
          <Description :description="data.properties.description" />
        </ReadMore>
        <Keywords v-if="Array.isArray(data.properties.keywords) && data.properties.keywords.length > 0" :keywords="data.properties.keywords" />
        <Assets v-if="hasAssets" :assets="assets" :context="data" :shown="shownAssets" @showAsset="showAsset" />
        <Links v-if="additionalLinks.length > 0" title="Additional resources" :links="additionalLinks" />
      </b-col>
      <b-col>
        <h2>Preview</h2>
        <b-tabs v-if="thumbnails.length > 0" v-model="tab" ref="tabs">
          <b-tab title="Map">
            <Map :stac="data" :stacLayerData="selectedAsset" @mapClicked="mapClicked" @mapChanged="mapChanged" />
          </b-tab>
          <b-tab title="Thumbnails">
            <Thumbnails :thumbnails="thumbnails" />
          </b-tab>
        </b-tabs>
        <Map v-else :stac="data" :stacLayerData="selectedAsset" @mapClicked="mapClicked" @mapChanged="mapChanged" />
      </b-col>
    </b-row>
    <b-row>
      <b-col class="properties">
        <Metadata :data="data" type="Item" :ignoreFields="ignoredMetadataFields" />
      </b-col>
    </b-row>
  </div>
</template>

<script>
import { mapState, mapGetters } from 'vuex';
import Assets from '../components/Assets.vue';
import Description from '../components/Description.vue';
import Links from '../components/Links.vue';
import Metadata from '../components/Metadata.vue';
import ReadMore from "vue-read-more-smooth";
import Thumbnails from '../components/Thumbnails.vue';
import ShowAssetMixin from '../components/ShowAssetMixin';
import { BTabs, BTab } from 'bootstrap-vue';
import Utils from '../utils';

export default {
  name: "Item",
  mixins: [ShowAssetMixin],
  components: {
    AnonymizedNotice: () => import('../components/AnonymizedNotice.vue'),
    Assets,
    BTabs,
    BTab,
    Description,
    DeprecationNotice: () => import('../components/DeprecationNotice.vue'),
    Links,
    Map: () => import('../components/Map.vue'),
    Metadata,
    ReadMore,
    Thumbnails
  },
  data() {
    return {
      ignoredMetadataFields: [
        'title',
        // Will be rendered with a custom rendered
        'deprecated',
        // Special handling for the warning of the anonymized-location extension
        'anon:warning'
      ]
    };
  },
  computed: {
    ...mapState(['data', 'url']),
    ...mapGetters(['additionalLinks', 'collectionLink'])
  },
  watch: {
    collectionLink: {
      immediate: true,
      handler(newLink) {
        if (Utils.isObject(newLink)) {
          this.$store.dispatch("load", { url: newLink.href });
        }
      }
    }
  },
  methods: {
    mapClicked(stac) {
      console.log(stac); // todo
    }
  }
};
</script>

<style lang="scss">
@import '~bootstrap/scss/mixins';
@import "../theme/variables.scss";

.item {
  .properties {
    .metadata {
      .card-columns {
        column-count: 1;

        &.count-2 {
          @include media-breakpoint-up(md) {
            column-count: 2 !important;
          }
        }
        &.count-3 {
          @include media-breakpoint-up(lg) {
            column-count: 3 !important;
          }
        }
        &.count-4 {
          @include media-breakpoint-up(xxl) {
            column-count: 4 !important;
          }
        }

        &:not(.count-1) {
          @include media-breakpoint-up(md) {
            column-count: 2;
          }
          @include media-breakpoint-up(lg) {
            column-count: 3;
          }
          @include media-breakpoint-up(xl) {
            column-count: 3;
          }
          @include media-breakpoint-up(xxl) {
            column-count: 4;
          }
          @include media-breakpoint-up(xxxl) {
            column-count: 5;
          }
        }
      }
    }
  }
}
</style>