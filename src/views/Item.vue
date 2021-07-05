<template>
  <div>
    <b-row>
      <b-col>
        <Description v-if="data.properties.description" :description="data.properties.description" />
        <Keywords v-if="Array.isArray(data.properties.keywords) && data.properties.keywords.length > 0" :keywords="data.properties.keywords" />
        <Links v-if="additionalLinks.length > 0" title="Additional resources" :links="additionalLinks" />
        <Assets v-if="hasAssets" :assets="assets" />
      </b-col>
      <b-col>
        <Map :stac="data" />
        <!-- ToDo: Show on Leaflet map instead -->
        <!-- <h2 v-if="thumbnails.length > 0">Preview</h2>
        <a v-for="thumbnail in thumbnails" :key="thumbnail.href" :href="thumbnail.href">
          <img align="center" :src="thumbnail.href" />
        </a> -->
      </b-col>
    </b-row>
    <b-row>
      <b-col>
        <Metadata :data="data" />
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
    ...mapGetters(['additionalLinks', 'thumbnails', 'hasAssets', 'assets'])
  }
};
</script>