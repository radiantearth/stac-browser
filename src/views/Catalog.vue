<template>
  <b-row class="catalog">
    <b-col class="left">
      <h2>Introduction</h2>
      <Description v-if="data.description" :description="data.description" />
      <Keywords v-if="Array.isArray(data.keywords) && data.keywords.length > 0" :keywords="data.keywords" />
      <section v-if="isCollection" class="metadata mb-4">
        <b-row v-if="temporalExtents">
          <b-col md="4" class="label">Temporal Extents</b-col>
          <b-col md="8" class="value" v-html="temporalExtents" />
        </b-row>
        <b-row v-if="licenses">
          <b-col md="4" class="label">Licenses</b-col>
          <b-col md="8" class="value" v-html="licenses" />
        </b-row>
      </section>
      <Map v-if="isCollection" :stac="data" />
      <!-- ToDo: Show on Leaflet map instead -->
      <!-- <h2 v-if="thumbnails.length > 0">Preview</h2>
      <a v-for="thumbnail in thumbnails" :key="thumbnail.href" :href="thumbnail.href">
        <img align="center" :src="thumbnail.href" />
      </a> -->
      <!-- ToDo: Merge Metadata with summaries? -->
      <Metadata title="Metadata" type="Collection" :data="data" :ignoreFields="collectionCoreFields" />
      <Metadata v-if="isCollection" title="Collection Summary" type="Summaries" :data="data" />
    </b-col>
    <b-col class="right">
      <section v-if="providers">
        <h2>Providers</h2>
        <div v-html="providers" />
      </section>
      <Catalogs v-if="catalogs.length > 0" :catalogs="catalogs" />
      <Items v-if="items.length > 0" :items="items" />
      <Assets v-if="hasAssets" :assets="assets" />
      <Links v-if="additionalLinks.length > 0" title="Additional resources" :links="additionalLinks" />
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
import { Formatters } from '@radiantearth/stac-fields';

export default {
  name: "Catalog",
  components: {
    Assets,
    Catalogs,
    Description,
    Items,
    Keywords,
    Links,
    Map: () => import('../components/Map.vue'),
    Metadata
  },
  data() {
    return {
      collectionCoreFields: [
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
        'assets'
      ]
    };
  },
  computed: {
    ...mapState(['data', 'url']),
    ...mapGetters(['additionalLinks', 'catalogs', 'isCollection', 'items', 'thumbnails', 'hasAssets', 'assets']),
    licenses() {
      if (this.isCollection && this.data.license) {
        return Formatters.formatLicense(this.data.license, null, null, this.data);
      }
      return null;
    },
    providers() {
      if (this.isCollection && Array.isArray(this.data.providers) && this.data.providers.length > 0) {
        return Formatters.formatProviders(this.data.providers);
      }
      return null;
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
    }
  }
};
</script>

<style lang="scss">
@import '~bootstrap/scss/bootstrap.scss';

.catalog {
  .left {
    min-width: 400px;
  }
  .metadata {
    .card-columns {
      @include media-breakpoint-only(xl) {
        column-count: 2;
      }
      @include media-breakpoint-only(lg) {
        column-count: 1;
      }
      @include media-breakpoint-only(md) {
        column-count: 1;
      }
      @include media-breakpoint-only(sm) {
        column-count: 1;
      }
    }
  }
  .items {
    .card-columns {
      @include media-breakpoint-only(xl) {
        column-count: 3;
      }
      @include media-breakpoint-only(lg) {
        column-count: 2;
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
</style>