<template>
  <div class="item">
    <b-row>
      <b-col>
        <Description v-if="data.properties.description" :description="data.properties.description" />
        <Keywords v-if="Array.isArray(data.properties.keywords) && data.properties.keywords.length > 0" :keywords="data.properties.keywords" />
        <Assets v-if="hasAssets" :assets="assets" :context="data" />
        <Links v-if="additionalLinks.length > 0" title="Additional resources" :links="additionalLinks" />
      </b-col>
      <b-col>
        <h2>Preview</h2>
        <b-tabs v-if="thumbnails.length > 0">
          <b-tab title="Map">
            <Map :stac="data" @mapClicked="mapClicked" />
          </b-tab>
          <b-tab title="Preview">
            <Thumbnails :thumbnails="thumbnails" />
          </b-tab>
        </b-tabs>
        <Map v-else :stac="data" />
      </b-col>
    </b-row>
    <b-row>
      <b-col class="properties">
        <Metadata :data="data" type="Item" />
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
import Thumbnails from '../components/Thumbnails.vue';
import { BTabs, BTab } from 'bootstrap-vue';
import Utils from '../utils';

export default {
  name: "Item",
  components: {
    Assets,
    BTabs,
    BTab,
    Description,
    Links,
    Map: () => import('../components/Map.vue'),
    Metadata,
    Thumbnails
  },
  computed: {
    ...mapState(['data', 'url']),
    ...mapGetters(['additionalLinks', 'collectionLink', 'thumbnails', 'hasAssets', 'assets'])
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
        @include media-breakpoint-only(sm) {
          column-count: 1;
        }
        @include media-breakpoint-only(md) {
          column-count: 2;
        }
        @include media-breakpoint-only(lg) {
          column-count: 3;
        }
        @include media-breakpoint-only(xl) {
          column-count: 3;
        }
        @include media-breakpoint-only(xxl) {
          column-count: 4;
        }
        @include media-breakpoint-up(xxxl) {
          column-count: 5;
        }
      }
    }
  }
}
</style>