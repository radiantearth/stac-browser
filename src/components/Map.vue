<template>
  <div class="map-container">
    <div ref="map" class="map"></div>
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
import getBasemaps from '../../basemaps.config';
import STAC from '../models/stac';
import Utils, { geojsonMediaType } from '../utils';
import { object as formatObject, string as formatString } from '@radiantearth/stac-fields/datatypes';
import { mapGetters, mapState } from 'vuex';
import { BPopover } from 'bootstrap-vue';
import Map from 'ol/Map.js';
import OSM from 'ol/source/OSM.js';
import View from 'ol/View.js';
import TileLayer from 'ol/layer/WebGLTile.js';
import proj4 from 'proj4';
import {register} from 'ol/proj/proj4.js';
import StacLayer from 'ol-stac';

register(proj4); // required to support source reprojection

const LABEL_EXT = 'https://stac-extensions.github.io/label/v1.*/schema.json';

export default {
  name: 'Map',
  components: {
    BPopover,
    Item: () => import('../components/Item.vue')
  },
  props: {
    stac: {
      type: Object,
      required: true
    },
    shownData: {
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
    },
    fitBoundsOnce: {
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
      dblClickState: null,
      selectedItem: null
    };
  },
  computed: {
    ...mapState(['buildTileUrlTemplate', 'crossOriginMedia', 'displayGeoTiffByDefault', 'maxPreviewsOnMap', 'useTileLayerAsFallback']),
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
    basemaps() {
      return getBasemaps(this.stac).map(map => {
        map = Object.assign({
          key: map.url || map.baseUrl,
          options: {}
        }, map);
        map.options.noWrap = this.selectBounds;
        return map;
      }).filter(map => Utils.isObject(map));
    },
    xyzLinks() {
      const links = this.getWebMapLinks('xyz');
      return links.map(link => ({
        url: link.href,
        name: link.title || Utils.titleForHref(link.href),
        subdomains: link.servers,
        attribution: link.attribution || this.stac.getMetadata('attribution')
      }));
    },
    wmsLinks() {
      const links = this.getWebMapLinks('wms');
      const wmsLinks = [];
      for(const link of links) {
        if (!Array.isArray(link['wms:layers'])) {
          continue;
        }
        for(const i in link['wms:layers']) {
          const layers = link['wms:layers'][i];
          let styles;
          if (Array.isArray(link['wms:styles']) && typeof link['wms:styles'][i] === 'string') {
            styles = link['wms:styles'][i];
          }
          const name = [link.title, layers].filter(x => Boolean(x)).join(' - ');
          const transparent = Utils.hasText(link['wms:transparent']) ? link['wms:transparent'].toLowerCase() === "true" : true;
          const props = {
            baseUrl: link.href,
            name,
            attribution: link.attribution || this.stac.getMetadata('attribution'),
            version: '1.3.0',
            layers,
            transparent,
            styles
          };
          if (typeof link['type'] === 'string' && link['type'].startsWith('image/')) {
            props.format = link['type'];
          }
          if (Utils.isObject(link['wms:dimensions'])) {
            props.options = link['wms:dimensions'];
          }
          wmsLinks.push(props);
        }
      }
      return wmsLinks;
    }
  },
  watch: {
    async shownData() {
      await this.showStacLayer();
    }
  },
  created() {
    this.mapOptions.scrollWheelZoom = this.selectBounds || this.scrollWheelZoom;
    // This recreates the component so that it picks up the new translations
    this.$root.$on('uiLanguageChanged', () => {
      // todo: update the language resources
    });
  },
  async mounted() {
    await this.showStacLayer();
  },
  methods: {
    async showStacLayer() {
      if (this.map && this.stacLayer) {
        this.map.removeLayer(this.stacLayer);
        this.stacLayer = null;
      }
      if (this.shownData) {
        this.map = new Map({
          target: this.$refs.map,
          layers: [
            new TileLayer({
              source: new OSM(),
            }),
          ],
          view: new View({
            center: [0, 0],
            zoom: 0,
            showFullExtent: true,
            multiWorld: false,
          }),
        });
        this.stacLayer = new StacLayer({
          url: this.stac.getAbsoluteUrl(),
          data: this.stac,
          assets: this.shownData,
          displayWebMapLink: true,
          buildTileUrlTemplate: this.buildTileUrlTemplate,
          crossOriginMedia: this.crossOriginMedia,
          displayGeoTiffByDefault: this.displayGeoTiffByDefault,
          maxPreviewsOnMap: this.maxPreviewsOnMap,
          useTileLayerAsFallback: this.useTileLayerAsFallback
        });
        this.stacLayer.on('assetsready', () => {
          // Assign titles for e.g. a layerswitcher
          for (const sublayer of this.stacLayer.getLayersArray()) {
            const stac = sublayer.get('stac');
            let title;
            if (stac.isAsset() || stac.isLink()) {
              title = stac.getMetadata('title') || stac.getKey();
            } else {
              title = stac.getMetadata('title') || stac.getMetadata('id');
            }
            sublayer.set('title', title);
          }
        });
        this.map.addLayer(this.stacLayer);
        if (this.fitBoundsOnce) {
          this.map.getView().fit(this.stacLayer.getExtent());
        }
      }
    }
  }
};
</script>

<style lang="scss">
@import "../../node_modules/ol/ol.css";
</style>
