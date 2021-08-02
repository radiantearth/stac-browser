<template>
  <section class="mb-4">
    <l-map class="map" :class="stac.type" ref="leaflet" @ready="init()">
      <l-control-fullscreen />
      <l-tile-layer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" :options="mapOptions" />
    </l-map>
  </section>
</template>

<script>
// import L from 'leaflet';
import { LMap, LTileLayer } from 'vue2-leaflet';
import LControlFullscreen from 'vue2-leaflet-fullscreen';
import 'leaflet/dist/leaflet.css';
import stacLayer from 'stac-layer';

export default {
  name: 'Map',
  components: {
    LControlFullscreen,
    LMap,
    LTileLayer
  },
  data() {
    return {
      map: null,
      boundsLayer: null,
      stacLayer: null,
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
  methods: {
    async init() {
      this.map = this.$refs.leaflet.mapObject;

      try {
        let options = {
          resolution: 256
        };
        this.stacLayer = await stacLayer(this.stac, options);
        if (this.stacLayer) {
          // Fit bounds before adding the layer to the map to avoid a race condition(?) between Tiff loading and fitBounds
          this.map.fitBounds(this.stacLayer.getBounds(), { padding: [90, 90] });
          this.stacLayer.addTo(this.map);
        }
      } catch (error) {
        console.log(error);
      }
    }
  }
}
</script>