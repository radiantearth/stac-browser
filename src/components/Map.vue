<template>
  <section class="mb-4">
    <l-map class="map" :class="stac.type" ref="leaflet" @ready="init()" :options="mapOptions">
      <LControlFullscreen />
      <template v-if="baseMaps.length > 0">
        <component :is="baseMap.component" v-for="baseMap in baseMaps" :key="baseMap.name" v-bind="baseMap" :layers="baseMap.name" layer-type="base" />
      </template>
      <LTileLayer v-else url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" :options="osmOptions" />
      <!-- ToDo: Replace with STAC Leaflet plugin; use minimap plugin? -->
      <LGeoJson v-if="isGeoJSON" ref="bounds" @ready="fitBounds" :geojson="stac" />
      <LRectangle v-else-if="bbox" ref="bounds" @ready="fitBounds" :bounds="bbox" />
    </l-map>
  </section>
</template>

<script>
import { CRS } from "leaflet";
import { LMap, LGeoJson, LRectangle, LTileLayer, LWMSTileLayer } from 'vue2-leaflet';
import LControlFullscreen from 'vue2-leaflet-fullscreen';
import 'leaflet/dist/leaflet.css';
import Utils from '../utils';
import '@lweller/leaflet-areaselect';

export default {
  name: 'Map',
  components: {
    LControlFullscreen,
    LGeoJson,
    LMap,
    LRectangle,
    LTileLayer,
    LWMSTileLayer
  },
  data() {
    return {
      map: null,
      boundsLayer: null,
      areaSelect: null,
      mapOptions: {
        scrollWheelZoom: !this.selectBounds
      },
      osmOptions: {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> contributors.'
      }
    };
  },
  props: {
    stac: {
      type: Object,
      required: true
    },
    selectBounds: {
      type: Boolean,
      required: false
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
    baseMaps() {
      let targets = [];
      if (this.stac.isCollection() && Utils.isObject(this.stac.summaries) && Array.isArray(this.stac.summaries['ssys:targets'])) {
        targets = this.stac.summaries['ssys:targets'];
      }
      else if (this.stac.isCollection() && Array.isArray(this.stac['ssys:targets'])) {
        targets = this.stac['ssys:targets'];
      }
      else if (this.stac.isItem() && Array.isArray(this.stac.properties['ssys:targets'])) {
        targets = this.stac.properties['ssys:targets'];
      }

      const baseMaps = {
        europa: {
          baseUrl: "https://planetarymaps.usgs.gov/cgi-bin/mapserv?map=/maps/jupiter/europa_simp_cyl.map",
          name: "GALILEO_VOYAGER"
        },
        mars: {
          baseUrl: "https://planetarymaps.usgs.gov/cgi-bin/mapserv?map=/maps/mars/mars_simp_cyl.map",
          name: "MDIM21"
        },
        moon: {
          baseUrl: "https://planetarymaps.usgs.gov/cgi-bin/mapserv?map=/maps/earth/moon_simp_cyl.map",
          name: "LROC_WAC"
        }
      };

      return targets.map(target => {
        target = target.toLowerCase();
        if (baseMaps[target]) {
          return Object.assign({
              component: "LWMSTileLayer",
              crs: CRS.EPSG4326,
              attribution: "USGS Astrogeology",
              format: "image/png"
            }, baseMaps[target]);
        }
      });
    }        
  },
  methods: {
    init() {
      this.map = this.$refs.leaflet.mapObject;
    },
    fitBounds() {
      this.boundsLayer = this.$refs.bounds.mapObject;
      let fitOptions = this.selectBounds ? {} : { padding: [90, 90] };
      this.map.fitBounds(this.boundsLayer.getBounds(), fitOptions);

      if (this.selectBounds) {
        this.areaSelect = L.areaSelect({ // eslint-disable-line 
          width: 300,
          height: 200,
          minWidth: 20,
          minHeight: 20,
          minHorizontalSpacing: 20,
          minVerticalSpacing: 20
        });
        this.areaSelect.addTo(this.map);
        this.areaSelect.on("change", () => this.emitBounds());
        this.emitBounds();
      }
    },
    emitBounds() {
      this.$emit('bounds', this.areaSelect.getBounds());
    }
  }
}
</script>

<style lang="scss">
  @import '~@lweller/leaflet-areaselect/src/leaflet-areaselect.css'
</style>