<template>
  <section class="mb-4">
    <l-map class="map" v-if="show" :class="stac.type" @ready="init" :options="mapOptions">
      <LControlFullscreen />
      <template v-if="baseMaps.length > 0">
        <component :is="baseMap.component" v-for="baseMap in baseMaps" :key="baseMap.name" v-bind="baseMap" :layers="baseMap.name" layer-type="base" />
      </template>
      <LTileLayer v-else url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" :options="osmOptions" />
    </l-map>
  </section>
</template>

<script>
import stacLayer from 'stac-layer';
import { CRS } from "leaflet";
import { LMap, LTileLayer, LWMSTileLayer } from 'vue2-leaflet';
import LControlFullscreen from 'vue2-leaflet-fullscreen';
import Utils from '../utils';
import '@lweller/leaflet-areaselect';
import { mapState } from 'vuex';
import STAC from '../stac';

export default {
  name: 'Map',
  components: {
    LControlFullscreen,
    LMap,
    LTileLayer,
    LWMSTileLayer
  },
  data() {
    return {
      show: false,
      map: null,
      areaSelect: null,
      stacLayer: null,
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
    stacLayerData: {
      type: Object,
      default: null
    },
    selectBounds: {
      type: Boolean,
      required: false
    }
  },
  mounted() {
    // Workaround for https://github.com/radiantearth/stac-browser/issues/95
    // I have absolutely no clue yet why this is required, needs further investigation!
    setTimeout(() => this.show = true, 100);
  },
  computed: {
    ...mapState(['geoTiffResolution', 'tileSourceTemplate', 'buildTileUrlTemplate', 'useTileLayerAsFallback']),
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
  watch: {
    async stacLayerData() {
      await this.showStacLayer();
    }
  },
  methods: {
    async init(map) {
      this.map = map;

      await this.showStacLayer();

      if (this.selectBounds) {
        this.addBoundsSelector();
      }
    },
    async showStacLayer() {
      if (this.stacLayer) {
        this.map.removeLayer(this.stacLayer);
      }
      let data = this.stacLayerData || this.stac;
      if (data.type !== 'Catalog') {
        try {
          let options = {
            resolution: this.geoTiffResolution,
            useTileLayerAsFallback: this.useTileLayerAsFallback,
            tileUrlTemplate: this.tileSourceTemplate,
            buildTileUrlTemplate: this.buildTileUrlTemplate
          };
          if (this.stac instanceof STAC) {
            // gets the absolute path to the current stac item
            // and then basically remove the filename from it
            // so you essentially have the "parent directory"
            options.baseUrl = this.stac.getAbsoluteUrl().replace(/\/[^/]+$/,'');
          }
          if ('href' in data) {
            if (this.stac.type === 'Feature') {
              options.bbox = this.stac?.bbox;
            }
            else if (this.stac.type === 'Collection') {
              options.bbox = this.stac?.extent?.spatial?.bbox[0];
            }
          }
          this.stacLayer = await stacLayer(data, options);
          if (this.stacLayer) {
            this.$emit('mapChanged', this.stacLayer.stac);
            this.stacLayer.on('click', event => this.$emit('mapClicked', event.stac));
            this.stacLayer.on("fallback", event => this.$emit('mapChanged', event.stac));
            // Fit bounds before adding the layer to the map to avoid a race condition(?) between Tiff loading and fitBounds
            this.fitBounds();
            this.stacLayer.addTo(this.map);
          }
        } catch (error) {
          this.$root.$emit('error', error, 'Sorry, loading the map failed.');
        }
      }
    },
    fitBounds() {
      let fitOptions = this.selectBounds ? {} : { padding: [90, 90] };
      this.map.fitBounds(this.stacLayer.getBounds(), fitOptions);
    },
    addBoundsSelector() {
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
    },
    emitBounds() {
      this.$emit('bounds', this.areaSelect.getBounds());
    }
  }
}
</script>

<style lang="scss">
  @import '~leaflet/dist/leaflet.css';
  @import '~@lweller/leaflet-areaselect/src/leaflet-areaselect.css';
</style>