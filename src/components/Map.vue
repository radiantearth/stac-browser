<template>
  <div class="map-container">
    <l-map class="map" v-if="show" :class="stac.type" @ready="init" :options="mapOptions">
      <l-control-zoom :key="`z${ix}`" v-bind="zoomControlTexts" position="topleft" />
      <l-control-fullscreen :key="`fs${ix}`" position="topleft" :options="fullscreenOptions" />
      <template v-if="baseMaps.length > 0">
        <component v-for="baseMap in baseMaps" :key="baseMap.name" :is="baseMap.component" v-bind="baseMap" :layers="baseMap.name" layer-type="base" />
      </template>
      <l-tile-layer v-else url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" :options="osmOptions" />
      <l-geo-json v-if="geojson" ref="geojson" :geojson="geojson" :options="{onEachFeature: showPopup}" :optionsStyle="{color: secondaryColor, weight: secondaryWeight}" />
    </l-map>
    <b-popover
      v-if="popover && selectedItem" placement="left" triggers="manual" :show="selectedItem !== null"
      :target="selectedItem.target" boundary="#stac-browser" container="#stac-browser" :key="selectedItem.key"
    >
      <section class="items">
        <b-card-group columns class="count-1">
          <Item :item="selectedItem.item" />
        </b-card-group>
      </section>
      <div class="text-center">
        <b-button target="_blank" variant="danger" @click="resetSelectedItem">{{ $t('leaflet.close') }}</b-button>
      </div>
    </b-popover>
  </div>
</template>

<script>
import stacLayer from 'stac-layer';
import { CRS } from "leaflet";
import { LMap, LControlZoom, LTileLayer, LWMSTileLayer, LGeoJson } from 'vue2-leaflet';
import LControlFullscreen from 'vue2-leaflet-fullscreen';
import Utils, { geojsonMediaType } from '../utils';
import './map/leaflet-areaselect';
import { mapGetters, mapState } from 'vuex';
import STAC from '../models/stac';
import { object as formatObject, string as formatString } from '@radiantearth/stac-fields/datatypes';
import { BPopover } from 'bootstrap-vue';

// Fix missing icons: https://vue2-leaflet.netlify.app/quickstart/#marker-icons-are-missing
import { Icon } from 'leaflet';
delete Icon.Default.prototype._getIconUrl;
Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

const BASEMAPS = {
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

const LABEL_EXT = 'https://stac-extensions.github.io/label/v1.*/schema.json';

export default {
  name: 'Map',
  components: {
    BPopover,
    Item: () => import('../components/Item.vue'),
    LControlFullscreen,
    LControlZoom,
    LGeoJson,
    LMap,
    LTileLayer,
    LWMSTileLayer
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
      default: false
    },
    scrollWheelZoom: {
      type: Boolean,
      default: false
    },
    popover: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      secondaryColor: '#FF8833',
      secondaryWeight: 2,
      show: false,
      map: null,
      areaSelect: null,
      stacLayer: null,
      geojson: null,
      itemPreviewsLayer: null,
      mapOptions: {
        zoomControl: false
      },
      osmOptions: {
        // Don't translate as this is an official reference back, which we copied from OSM and shouldn't be altered!
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> contributors.'
      },
      dblClickState: null,
      selectedItem: null,
      ix: 1
    };
  },
  computed: {
    ...mapState(['buildTileUrlTemplate', 'crossOriginMedia', 'displayGeoTiffByDefault', 'geoTiffResolution', 'locale', 'maxPreviewsOnMap', 'tileSourceTemplate', 'useTileLayerAsFallback']),
    ...mapGetters(['getStac', 'supportsExtension']),
    fullscreenOptions() {
      return {
        title: {
          'false': this.$t('fullscreen.show'),
          'true': this.$t('fullscreen.exit'),
        }
      };
    },
    zoomControlTexts() {
      return {
        zoomInText: this.$t('leaflet.zoom.in.label'),
        zoomInTitle: this.$t('leaflet.zoom.in.description'),
        zoomOutText: this.$t('leaflet.zoom.out.label'),
        zoomOutTitle: this.$t('leaflet.zoom.out.description')
      };
    },
    baseMaps() {
      let targets = [];
      if (this.stac instanceof STAC) {
        if (this.stac.isCollection() && Utils.isObject(this.stac.summaries) && Array.isArray(this.stac.summaries['ssys:targets'])) {
          targets = this.stac.summaries['ssys:targets'];
        }
        else if (this.stac.isCollection() && Array.isArray(this.stac['ssys:targets'])) {
          targets = this.stac['ssys:targets'];
        }
        else if (this.stac.isItem() && Array.isArray(this.stac.properties['ssys:targets'])) {
          targets = this.stac.properties['ssys:targets'];
        }
      }

      return targets.map(target => {
        target = target.toLowerCase();
        if (BASEMAPS[target]) {
          return Object.assign({
              component: "LWMSTileLayer",
              crs: CRS.EPSG4326,
              // Don't translate as this is an official reference back, which we copied from OSM and shouldn't be altered!
              attribution: "USGS Astrogeology",
              format: "image/png"
            }, BASEMAPS[target]);
        }
      }).filter(map => !!map);
    }
  },
  watch: {
    locale() {
      // This recreates the component so that it picks up the new translations
      this.ix++;
    },
    async stacLayerData() {
      await this.showStacLayer();
    },
    geojson(newVal) {
      if (newVal) {
        this.$nextTick(() => this.geojsonToFront());
      }
    }
  },
  created() {
    this.mapOptions.scrollWheelZoom = this.selectBounds || this.scrollWheelZoom;
    this.osmOptions.noWrap = this.selectBounds;
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
  methods: {
    async init(map) {
      this.map = map;
      if (this.$listeners.viewChanged || this.popover) {
        this.map.on('viewreset', this.viewChanged);
        this.map.on('zoom', this.viewChanged);
        this.map.on('move', this.viewChanged);
        this.map.on('resize', this.viewChanged);
      }

      await this.showStacLayer();

      if (this.selectBounds) {
        this.addBoundsSelector();
      }
    },
    viewChanged(event) {
      if (this.popover) {
        this.resetSelectedItem();
      }

      this.$emit('viewChanged', event);
    },
    async showStacLayer() {
      if (this.stacLayer) {
        this.map.removeLayer(this.stacLayer);
        this.stacLayer = null;
      }
      if (this.itemPreviewsLayer) {
        this.map.removeLayer(this.itemPreviewsLayer);
        this.itemPreviewsLayer = null;
      }
      let data = this.stacLayerData || this.stac;

      if (!(this.stac instanceof STAC)) {
        return;
      }

      let getDefaultOptions = (customOptions = {}) => Object.assign({
        baseUrl: this.stac.getAbsoluteUrl(),
        resolution: this.geoTiffResolution,
        useTileLayerAsFallback: this.useTileLayerAsFallback,
        tileUrlTemplate: this.tileSourceTemplate,
        buildTileUrlTemplate: this.buildTileUrlTemplate,
        crossOrigin: this.crossOriginMedia,
        displayGeoTiffByDefault: this.displayGeoTiffByDefault
      }, customOptions);

      let options = getDefaultOptions();
      if (this.stacLayerData && 'href' in this.stacLayerData) {
        if (this.stac.isItem()) {
          options.bbox = this.stac?.bbox;
        }
        else if (this.stac.isCollection()) {
          options.bbox = this.stac?.extent?.spatial?.bbox[0];
        }
        
        if (this.stacLayerData.type === geojsonMediaType) {
          this.geojson = await this.$store.dispatch('loadGeoJson', this.stacLayerData);
        }
      }

      let addItemsPreview = false;
      // Check whether we could add item previews to the map
      if (this.stac.isCatalogLike() && data.type === 'FeatureCollection') {
        data = this.stac;
        options.fillOpacity = 0;
        addItemsPreview = true;
      }

      if (!this.stac.isCatalog()) {
        try {
          this.stacLayer = await stacLayer(data, options);
        } catch (error) {
          this.$root.$emit('error', error, this.$t('leaflet.stayLayer.error'));
        }

        // If the map isn't shown any more after loading the STAC data, don't try to add it to the map.
        // Fixes https://github.com/radiantearth/stac-browser/issues/109
        if (!this.show || !this.stacLayer) {
          return;
        }

        this.$emit('dataChanged', this.stacLayer.stac);
        this.addMapClickEvent(this.stacLayer);
        this.stacLayer.on("fallback", event => this.$emit('dataChanged', event.stac));
        this.stacLayer.addTo(this.map);
        this.fitBounds(this.stacLayer, this.selectBounds);
      }

      // Add item previews to the map
      if (addItemsPreview) {
        let itemPreviewOptions = getDefaultOptions({
          fillOpacity: 0,
          weight: this.secondaryWeight,
          color: this.secondaryColor,
          displayPreview: this.stacLayerData.features.length < this.maxPreviewsOnMap
        });
        this.itemPreviewsLayer = await stacLayer(this.stacLayerData, itemPreviewOptions);
        this.addMapClickEvent(this.itemPreviewsLayer);
        this.itemPreviewsLayer.addTo(this.map);
        this.itemPreviewsLayer.bringToFront();
        if (!this.stacLayer) {
          this.fitBounds(this.itemPreviewsLayer);
        }
      }

      // label extension: Add source imagery and geojson to map
      if (this.stac.isItem() && this.supportsExtension(LABEL_EXT) && this.stac.properties['label:type'] === 'vector') {
        let sourceLinks = this.stac.getLinksWithRels(['source']);

        let labelAssets = this.stac.getAssetsWithRoles(['labels']);
        if (labelAssets.length > 1) {
          labelAssets = labelAssets.filter(asset => asset.roles.includes('labels-vector'));
        }
        if (labelAssets.length === 0) {
          if ("vector_labels" in this.stac.assets) {
            labelAssets.push(this.stac.assets.vector_labels);
          }
          else {
            let potentialAssets = Object.values(this.stac.assets).filter(asset => asset.type === geojsonMediaType && asset.rel !== 'item' && !asset.roles);
            if (potentialAssets.length === 1) {
              labelAssets.push(potentialAssets[0]);
            }
          }
        }

        if (labelAssets.length > 0 && sourceLinks.length > 0) {
          this.$store.dispatch('loadGeoJson', labelAssets[0])
            .then(geojson => this.geojson = geojson)
            .catch(error => console.error(error));

          const labelSourceLayerOptions = getDefaultOptions({
            fillOpacity: 0,
            weight: 0
          });
          for(let link of sourceLinks) {
            this.$store.dispatch('load', {url: link.href})
              .then(() => {
                let sourceStac = this.getStac(link.href, true);
                if (sourceStac instanceof STAC) {
                  return stacLayer(sourceStac, labelSourceLayerOptions);
                }
                else {
                  throw sourceStac;
                }
              })
              .then(layer => {
                layer.addTo(this.map);
                // Bring GeoJSON to front to allow opening the popups
                this.geojsonToFront();
              })
              .catch(error => console.log(error));
          }
        }
      }
    },
    addMapClickEvent(layer) {
      layer.on('click', event => {
        // Debounce click event, otherwise a dblclick is fired (and fired twice)
        let clicks = event.originalEvent.detail || 1;
        if (clicks === 1) {
          this.dblClickState = window.setTimeout(() => {
            this.dblClickState = null;
            this.mapClicked(event.stac, event);
          }, 500);
        }
        else if (clicks > 1 && this.dblClickState) {
          window.clearTimeout(this.dblClickState);
          this.dblClickState = null;
        }
      });
    },
    geojsonToFront() {
      if (this.$refs.geojson && this.$refs.geojson.mapObject) {
        this.$refs.geojson.mapObject.bringToFront();
      }
    },
    fitBounds(layer, noPadding = false) {
      let fitOptions = {
        padding: noPadding ? [0,0] : [90,90],
        animate: false,
        duration: 0
      };
      this.map.fitBounds(layer.getBounds(), fitOptions);
    },
    showPopup(feature, layer) {
      let html = '';
      if (feature.id) {
        html += `<h3>${formatString(feature.id)}</h3>`;
      }
      if (Utils.isObject(feature.properties) && Object.keys(feature.properties).length > 0) {
        html += formatObject(feature.properties);
      }
      if (html.length === 0) {
        html += `<p>${this.$t('leaflet.noFeatureProperties')}</p>`;
      }
      layer.bindPopup(html);
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
    },
    resetSelectedItem() {
        if (this.selectedItem && this.selectedItem.oldStyle) {
          this.selectedItem.layer.setStyle(this.selectedItem.oldStyle);
        }
        this.selectedItem = null;
    },
    mapClicked(stac, event) {
      if(this.popover) {
        this.resetSelectedItem();
        if (stac.type === 'Feature') {
          this.selectedItem = {
            item: stac.data,
            target: event.originalEvent.srcElement,
            layer: event.layer,
            key: event.layer._leaflet_id
          };
          if (event.layer) {
            this.selectedItem.oldStyle = Object.assign({}, event.layer.options);
            event.layer.setStyle(Object.assign({}, event.layer.options, {color: '#dc3545'}));
          }
        }
      }

      this.$emit('mapClicked', stac, event);
    }
  }
};
</script>

<style lang="scss">
@import '~leaflet/dist/leaflet.css';
@import '../theme/leaflet-areaselect.scss';
</style>