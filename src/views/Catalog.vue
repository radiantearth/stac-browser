<template>
  <b-row>
    <b-col>
      <Description v-if="data.description" :description="data.description" />
      <Keywords v-if="Array.isArray(data.keywords) && data.keywords.length > 0" :keywords="data.keywords" />
      <!-- ToDo: Show on Leaflet map instead -->
      <!-- <h2 v-if="thumbnails.length > 0">Preview</h2>
      <a v-for="thumbnail in thumbnails" :key="thumbnail.href" :href="thumbnail.href">
        <img align="center" :src="thumbnail.href" />
      </a> -->
      <Catalogs v-if="catalogs.length > 0" :catalogs="catalogs" />
      <Items v-if="items.length > 0" :items="items" />
      <Assets v-if="assets.length > 0" :assets="assets" />
    </b-col>
    <b-col>
      <Map v-if="data.isCollection()" :stac="data" />
      <Metadata :metadata="data" />
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
  computed: {
    ...mapState(['data', 'url']),
    ...mapGetters(['additionalLinks', 'catalogs', 'isCollection', 'items', 'thumbnails', 'assets']),
    formattedMetadata() {
      return this.$fields.formatItemProperties();
    }
  }
};
</script>
