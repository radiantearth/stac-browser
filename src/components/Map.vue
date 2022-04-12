<template>
  <l-map class="map" v-if="show" :class="stac.type" @ready="init" :options="mapOptions">
    <LControlFullscreen />
    <template v-if="baseMaps.length > 0">
      <component v-for="baseMap in baseMaps" :key="baseMap.name" :is="baseMap.component" v-bind="baseMap" :layers="baseMap.name" layer-type="base" />
    </template>
    <LTileLayer v-else url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" :options="osmOptions" />
  </l-map>
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

// Fix missing icons: https://vue2-leaflet.netlify.app/quickstart/#marker-icons-are-missing
import { Icon } from 'leaflet';
delete Icon.Default.prototype._getIconUrl;
Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});


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
      mapOptions: {},
      osmOptions: {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> contributors.'
      },
      dblClickState: null
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
  created() {
    this.mapOptions.scrollWheelZoom = this.selectBounds || this.stac?.isItem();
  },
  mounted() {
    // Solves https://github.com/radiantearth/stac-browser/issues/95 by showing the map
    // only after the next tick so that the page was fully rendered once before we start adding the map
    this.$nextTick(() => this.show = true);
  },
  beforeDestroy() {
    this.show = false;
    if (this.dblClickState) {
      window.clearTimeout(this.dblClickState);
    }
  },
  computed: {
    ...mapState(['buildTileUrlTemplate', 'crossOriginMedia', 'geoTiffResolution', 'tileSourceTemplate', 'useTileLayerAsFallback']),
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
      }).filter(map => !!map);
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
        this.stacLayer = null;
      }
      let data = this.stacLayerData || this.stac;
      if (data.type !== 'Catalog') {
        let options = {
          resolution: this.geoTiffResolution,
          useTileLayerAsFallback: this.useTileLayerAsFallback,
          tileUrlTemplate: this.tileSourceTemplate,
          buildTileUrlTemplate: this.buildTileUrlTemplate,
          crossOrigin: this.crossOriginMedia
        };
        if (this.stac instanceof STAC) {
          options.baseUrl = this.stac.getAbsoluteUrl();
        }
        if ('href' in data) {
          if (this.stac.type === 'Feature') {
            options.bbox = this.stac?.bbox;
          }
          else if (this.stac.type === 'Collection') {
            options.bbox = this.stac?.extent?.spatial?.bbox[0];
          }
        }
        try {
          this.stacLayer = await stacLayer(data, options);
        } catch (error) {
          this.$root.$emit('error', error, 'Sorry, adding the data to the map failed.');
        }

        // If the map isn't shown any more after loading the STAC data, don't try to add it to the map.
        // Fixes https://github.com/radiantearth/stac-browser/issues/109
        if (!this.show || !this.stacLayer) {
          return;
        }

        this.$emit('mapChanged', this.stacLayer.stac);
        this.stacLayer.on('click', event => {
          // Debounce click event, otherwise a dblclick is fired (and fired twice)
          let clicks = event.originalEvent.detail || 1;
          if (clicks === 1) {
            this.dblClickState = window.setTimeout(() => {
              this.dblClickState = null;
              this.$emit('mapClicked', event.stac);
            }, 500);
          }
          else if (clicks > 1 && this.dblClickState) {
            window.clearTimeout(this.dblClickState);
            this.dblClickState = null;
          }
        });
        this.stacLayer.on("fallback", event => this.$emit('mapChanged', event.stac));
        this.stacLayer.addTo(this.map);
        this.fitBounds();
      }
    },
    fitBounds() {
      let fitOptions = {
        padding: this.selectBounds ? [0,0] : [90,90],
        animate: false,
        duration: 0
      };
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