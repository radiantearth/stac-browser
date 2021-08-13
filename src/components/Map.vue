<template>
  <section class="mb-4">
    <l-map class="map" :class="stac.type" ref="leaflet" @ready="init()">
      <l-control-fullscreen />
      <l-wms-tile-layer
          :key="getBaseMap.name"
          :base-url="getBaseMap.baseUrl"
          :crs="getBaseMap.crs"
          :name="getBaseMap.name"
          :attribution="getBaseMap.attribution"
          :layers="getBaseMap.name"
          :format="getBaseMap.format"
          layer-type="base"/>
      <!-- ToDo: Replace with STAC Leaflet plugin; use minimap plugin? -->
      <l-geo-json v-if="isGeoJSON" ref="bounds" @ready="fitBounds" :geojson="stac" />
      <l-rectangle v-else-if="bbox" ref="bounds" @ready="fitBounds" :bounds="bbox" />
    </l-map>
  </section>
</template>

<script>
// import L from 'leaflet';
import { CRS } from "leaflet";
import { LMap, LGeoJson, LRectangle, LWMSTileLayer } from 'vue2-leaflet';
import LControlFullscreen from 'vue2-leaflet-fullscreen';
import 'leaflet/dist/leaflet.css';

export default {
  name: 'Map',
  components: {
    LControlFullscreen,
    LGeoJson,
    LMap,
    LRectangle,
    'l-wms-tile-layer': LWMSTileLayer
  },
  data() {
    return {
      map: null,
      boundsLayer: null
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
    getBaseMap() {
      if ('summaries' in this.stac) {
        if ('ssys:targets' in this.stac.summaries){
          var target = this.stac.summaries['ssys:targets'][0]
          switch (target.normalize()) {
            case "moon":
                return {"name":"LROC_WAC",
                    "baseUrl":"https://planetarymaps.usgs.gov/cgi-bin/mapserv?map=/maps/earth/moon_simp_cyl.map",
                    "crs":CRS.EPSG4326,
                    "attribution":"USGS Astrogeology",
                    "format":"image/png"
                    }
          }

        }
      }
      // Our items still need the ssys:targets implemented, so this just hard codes to the moon for now. Will
      // check for ssys:targets in properties at some point in the future.
      if ('properties' in this.stac) {
          return {"name":"LROC_WAC",
                  "baseUrl":"https://planetarymaps.usgs.gov/cgi-bin/mapserv?map=/maps/earth/moon_simp_cyl.map",
                  "crs":CRS.EPSG4326,
                  "attribution":"USGS Astrogeology",
                  "format":"image/png"
                  }
        
      }
    return {}
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

