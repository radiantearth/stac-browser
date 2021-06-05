<template>
  <b-row>
    <b-col md="8">
      <b-row>
        <b-col md="10">
          <h1>{{ title }}</h1>
        </b-col>
        <b-col md="2" class="text-sm-right">
          <Share :title="title" :stacUrl="url" :stacVersion="data.stac_version" />
        </b-col>
      </b-row>
      <Description v-if="data.properties.description" :description="data.properties.description" />

      <b-tabs v-model="tabIndex">
        <b-tab v-if="thumbnails.length > 0" title="Previews">
          <a v-for="thumbnail in thumbnails" :key="thumbnail.href" :href="thumbnail.href">
            <img align="center" :src="thumbnail.href" /><!-- ToDo: Show on Leaflet map instead -->
          </a>
        </b-tab>
        <b-tab v-if="additionalLinks.length > 0" title="Links" key="links">
          <Links :links="additionalLinks" />
        </b-tab>
      </b-tabs>
    </b-col>
    <b-col md="4">
      <div class="metadata">
        <b-card header="Metadata">
          <table class="table">
            <tr v-if="data.license">
              <td>License</td>
              <td>Apache</td>
            </tr>
          </table>
        </b-card>
        <Metadata :metadata="data" />
      </div>
    </b-col>
  </b-row>
</template>

<script>
import { mapState, mapGetters } from 'vuex';
import Description from '../components/Description.vue';
import Links from '../components/Links.vue';
import Metadata from '../components/Metadata.vue';

export default {
  name: "Item",
  components: {
    Description,
    Links,
    Share: () => import('../components/Share.vue'),
    Metadata
  },
  data() {
    return {
      tabIndex: 0
    };
  },
  computed: {
    ...mapState(['data', 'url']),
    ...mapGetters(['additionalLinks', 'thumbnails', 'title'])
  }
};
</script>
