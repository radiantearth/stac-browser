<template>
  <section class="mb-4">
    <l-map class="map" :class="stac.type" ref="leaflet" @ready="init()">
      <l-control-fullscreen />
      <l-tile-layer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" :options="mapOptions" />
      <!-- ToDo: Replace with STAC Leaflet plugin; use minimap plugin? -->
      <l-geo-json v-if="isGeoJSON" ref="bounds" @ready="fitBounds" :geojson="stac" />
      <l-rectangle v-else-if="bbox" ref="bounds" @ready="fitBounds" :bounds="bbox" />
    </l-map>
  </section>
</template>

<script>
// import L from 'leaflet';
import { LMap, LGeoJson, LRectangle, LTileLayer } from 'vue2-leaflet';
import LControlFullscreen from 'vue2-leaflet-fullscreen';
import 'leaflet/dist/leaflet.css';

export default {
  name: 'Map',
  components: {
    LControlFullscreen,
    LGeoJson,
    LMap,
    LRectangle,
    LTileLayer
  },
  data() {
    return {
      map: null,
      boundsLayer: null,
      mapOptions: {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> contributors.'
      }
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
      if (this.stac.isCollection() && this.stac.extent.spatial.bbox.length > 0) {
        let bbox = this.stac.extent.spatial.bbox[0];
        return [[bbox[1], bbox[2]], [bbox[3], bbox[0]]];
      }
      return null;
    }
  },
  methods: {
    init() {
      this.map = this.$refs.leaflet.mapObject;
    },
    fitBounds() {
      this.boundsLayer = this.$refs.bounds.mapObject;
      this.map.fitBounds(this.boundsLayer.getBounds(), { padding: [90, 90] });
    }
  }
}
</script>