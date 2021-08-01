<template>
  <div class="item">
    <!-- ToDo: Link to Collection - add to StacHeader? -->
    <b-row>
      <b-col>
        <Description v-if="data.properties.description" :description="data.properties.description" />
        <Keywords v-if="Array.isArray(data.properties.keywords) && data.properties.keywords.length > 0" :keywords="data.properties.keywords" />
        <Assets v-if="hasAssets" :assets="assets" :context="data" />
        <Links v-if="additionalLinks.length > 0" title="Additional resources" :links="additionalLinks" />
      </b-col>
      <b-col>
        <h2>Preview</h2>
        <b-tabs>
          <b-tab title="Map">
            <Map :stac="data" />
          </b-tab>
          <b-tab v-if="thumbnails.length > 0" title="Preview" class="previews">
            <a v-for="thumbnail in thumbnails" :key="thumbnail.href" :href="thumbnail.href">
              <img class="thumbnail" :src="thumbnail.href" />
            </a>
          </b-tab>
        </b-tabs>
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
import { BTabs, BTab } from 'bootstrap-vue';

export default {
  name: "Item",
  components: {
    Assets,
    BTabs,
    BTab,
    Description,
    Links,
    Map: () => import('../components/Map.vue'),
    Metadata
  },
  computed: {
    ...mapState(['data', 'url']),
    ...mapGetters(['additionalLinks', 'thumbnails', 'hasAssets', 'assets'])
  }
};
</script>

<style lang="scss">
@import '~bootstrap/scss/bootstrap.scss';

.item {
  .properties {
    .metadata {
      .card-columns {
        @include media-breakpoint-only(xl) {
          column-count: 3;
        }
        @include media-breakpoint-only(lg) {
          column-count: 3;
        }
        @include media-breakpoint-only(md) {
          column-count: 2;
        }
        @include media-breakpoint-only(sm) {
          column-count: 1;
        }
      }
    }
  }
}

.previews {
  text-align: center;
}

.thumbnail {
  max-width: 100%;
  max-height: 400px;
}
</style>