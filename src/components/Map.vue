<template>
  <l-map class="map main" ref="leaflet" @ready="init()">
    <l-control-fullscreen />
    <l-tile-layer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
    <!-- ToDo: Replace with STAC Leaflet plugin; use minimap plugin? -->
    <l-geo-json v-if="isGeoJSON" :geojson="stac" />
    <l-rectangle v-else-if="bbox" :bounds="bbox" />
  </l-map>
</template>

<script>
// import L from 'leaflet';
import { LMap, LGeoJson, LRectangle, LTileLayer } from 'vue2-leaflet';
import LControlFullscreen from 'vue2-leaflet-fullscreen';
import 'leaflet/dist/leaflet.css';

export default {
  name: 'Map',
  components: {
    LMap,
    LGeoJson,
    LRectangle,
    LTileLayer,
    LControlFullscreen
  },
  data() {
    return {
      map: null
    };
  },
  props: {
    stac: {
      type: Object,
      required: true
    }
  },
  computed: {
    isGeoJSON() {
      return this.stac.isItem();
    },
    bbox() {
      if (this.stac.isCollection()) {
        let bbox = this.stac.extent.spatial.bbox[0];
        return [[bbox[1], bbox[2]], [bbox[3], bbox[0]]];
      }
      return null;
    }
  },
  methods: {
    init() {
        this.map = this.$refs.leaflet.mapObject;
    }
  }
}
</script>