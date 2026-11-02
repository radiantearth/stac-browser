<template>
  <nav class="site-tabs" aria-label="Views">
    <router-link to="/" aria-current="page">Catalog</router-link>
    <a :href="mapHref">Map</a>
  </nav>
</template>

<script>
import { mapGetters, mapState } from 'vuex';

// Header widget: Map and Catalog tabs shared with caladapt-stac-map, so the
// map and the catalog read as one site. The Map tab opens the dataset being
// viewed here, if any (the map reads ?dataset=<collection id>).
export default {
  name: 'SiteTabs',
  props: {
    mapUrl: {
      type: String,
      required: true
    }
  },
  computed: {
    ...mapState(['data']),
    ...mapGetters(['isCollection', 'isItem']),
    collectionId() {
      if (this.isCollection) {
        return this.data.id;
      }
      if (this.isItem) {
        return this.data.collection || null;
      }
      return null;
    },
    mapHref() {
      if (!this.collectionId) {
        return this.mapUrl;
      }
      const url = new URL(this.mapUrl, window.location.href);
      url.searchParams.set('dataset', this.collectionId);
      return url.toString();
    }
  }
};
</script>
