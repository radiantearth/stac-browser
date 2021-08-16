<template>
  <section class="mb-4">
    <l-map class="map" :class="stac.type" ref="leaflet" @ready="init()">
      <l-control-fullscreen />
      <l-wms-tile-layer v-if="hasSsys"
          :key="baseMap.name"
          :base-url="baseMap.baseUrl"
          :crs="baseMap.crs"
          :name="baseMap.name"
          :attribution="baseMap.attribution"
          :layers="baseMap.name"
          :format="baseMap.format"
          layer-type="base"
          @ready="fitBounds" :bounds="bbox"/>
      <l-tile-layer v-else url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" :options="mapOptions" />

      <!-- ToDo: Replace with STAC Leaflet plugin; use minimap plugin? -->
      <l-geo-json v-if="isGeoJSON" ref="bounds" @ready="fitBounds" :geojson="stac" />
      <l-rectangle v-else-if="bbox" ref="bounds" @ready="fitBounds" :bounds="bbox" />
    </l-map>
  </section>
</template>

<script>
// import L from 'leaflet';
import { CRS } from "leaflet";
import { LMap, LGeoJson, LRectangle, LTileLayer, LWMSTileLayer } from 'vue2-leaflet';
import LControlFullscreen from 'vue2-leaflet-fullscreen';
import 'leaflet/dist/leaflet.css';

export default {
  name: 'Map',
  components: {
    LControlFullscreen,
    LGeoJson,
    LMap,
    LRectangle,
    LTileLayer,
    "l-wms-tile-layer" : LWMSTileLayer
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
    },
    hasSsys() {
      if ('summaries' in this.stac) {
        if ('ssys:targets' in this.stac.summaries){
          return true
        }
      } else if ('ssys:targets' in this.stac.properties) {
        return true
      }
      return false
    },
    baseMap() {
      var target = ''
      if ('summaries' in this.stac){
        target = this.stac.summaries['ssys:targets'][0].toLowerCase()
      } else if ('properties' in this.stac){
        target = this.stac.properties['ssys:targets'][0].toLowerCase()
      }
      var baseLookUp = {
            "europa": {"url":"/maps/jupiter/europa_simp_cyl.map", "name":"GALILEO_VOYAGER"},
            "mars": {"url": "/maps/mars/mars_simp_cyl.map", "name":"MDIM21"},
            "moon": {"url": "/maps/earth/moon_simp_cyl.map", "name":"LROC_WAC"},
          }
      return { "name": baseLookUp[target].name,
                "baseUrl": "https://planetarymaps.usgs.gov/cgi-bin/mapserv?map=" + baseLookUp[target].url,
                "crs":CRS.EPSG4326,
                "attribution":"USGS Astrogeology",
                "format":"image/png"
              }
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
