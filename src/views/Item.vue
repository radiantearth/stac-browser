<template>
  <b-row>
    <b-col>
      <Description v-if="data.properties.description" :description="data.properties.description" />
      <Keywords v-if="Array.isArray(data.properties.keywords) && data.properties.keywords.length > 0" :keywords="data.properties.keywords" />
      <!-- ToDo: Show on Leaflet map instead -->
      <!-- <h2 v-if="thumbnails.length > 0">Preview</h2>
      <a v-for="thumbnail in thumbnails" :key="thumbnail.href" :href="thumbnail.href">
        <img align="center" :src="thumbnail.href" />
      </a> -->
      <Assets v-if="assets.length > 0" :assets="assets" />
    </b-col>
    <b-col>
      <Map :stac="data" />
      <Metadata :metadata="data" />
      <Links v-if="additionalLinks.length > 0" title="Additional resources" :links="additionalLinks" />
    </b-col>
  </b-row>
</template>

<script>
import { mapState, mapGetters } from 'vuex';
import Assets from '../components/Assets.vue';
import Description from '../components/Description.vue';
import Links from '../components/Links.vue';
import Metadata from '../components/Metadata.vue';

export default {
  name: "Item",
  components: {
    Assets,
    Description,
    Links,
    Map: () => import('../components/Map.vue'),
    Metadata
  },
  computed: {
    ...mapState(['data', 'url']),
    ...mapGetters(['additionalLinks', 'thumbnails', 'assets'])
  }
};
</script>