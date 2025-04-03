import Utils from '../../utils';
import { mapState } from 'vuex';
import Map from 'ol/Map.js';
import View from 'ol/View.js';
import { defaults } from 'ol/interaction/defaults';
import ZoomControl from 'ol/control/Zoom.js';
import AttributionControl from 'ol/control/Attribution.js';
import FullScreenControl from 'ol/control/FullScreen.js';
import { stacRequest } from '../../store/utils';

import configureBasemap from '../../../basemaps.config';
import CONFIG from '../../../config';
import proj4 from 'proj4';
import {register} from 'ol/proj/proj4.js';
// Register pre-defined CRS from config in proj4
if (Utils.isObject(CONFIG.crs)) {
  for (const code in CONFIG.crs) {
    proj4.defs(code, CONFIG.crs[code]);
  }
}
register(proj4); // required to support source reprojection

export default {
  computed: {
    ...mapState(['buildTileUrlTemplate', 'crossOriginMedia', 'displayGeoTiffByDefault', 'useTileLayerAsFallback']),
    stacLayerOptions() {
      return {
        buildTileUrlTemplate: this.buildTileUrlTemplate,
        crossOriginMedia: this.crossOriginMedia,
        displayGeoTiffByDefault: this.displayGeoTiffByDefault,
        useTileLayerAsFallback: this.useTileLayerAsFallback,
        httpRequestFn: async (url, responseType) => {
          const response = await stacRequest(this.$store, url, {responseType});
          return response.data;
        },
      };
    },
    hasBasemap() {
      return this.basemaps.length > 0;
    }
  },
  data() {
    return {
      map: null,
      zoomControl: null,
      attributionControl: null,
      fullScreenControl: null,
      basemaps: [],
    };
  },
  created() {
    this.$root.$on('uiLanguageChanged', this.translate);
  },
  methods: {
    async createMap(element, stac, onfocusOnly = false) {
      let projection = 'EPSG:3857';
      let visibleLayer = 0;

      // Get basemaps
      this.basemaps = configureBasemap(stac, this.$i18n);
      if (this.basemaps.length > 0) {
        const ix = this.basemaps.findIndex(basemap => basemap.visible);
        if (ix >= 0) {
          visibleLayer = ix;
        }
        const currentBasemap = this.basemaps[visibleLayer];
        if (currentBasemap?.projection) {
          projection = currentBasemap?.projection;
        }
      }

      // Create map instance
      this.map = new Map({
        target: element,
        controls: [],
        interactions: defaults({
          altShiftDragRotate: false,
          pinchRotate: false,
          onfocusOnly
        }),
        view: new View({
          center: [0, 0],
          zoom: 0,
          showFullExtent: true,
          projection,
        }),
      });

      // Add controls
      this.createControls();

      // Add basemaps
      await this.addBasemaps(this.basemaps, visibleLayer);
    },
    createControls() {
      ['zoom', 'attribution', 'fullScreen'].forEach(type => {
        const key = type + 'Control';
        if (this[key]) {
          this.map.removeControl(this[key]);
          this[key] = null;
        }
      });

      this.zoomControl = new ZoomControl({
        zoomInLabel: this.$t('mapping.zoom.in.label'),
        zoomOutLabel: this.$t('mapping.zoom.out.label'),
        zoomInTipLabel: this.$t('mapping.zoom.in.description'),
        zoomOutTipLabel: this.$t('mapping.zoom.out.description')
      });
      this.map.addControl(this.zoomControl);

      this.attributionControl = new AttributionControl({
        tipLabel: this.$t('mapping.attribution.description'),
        label: this.$t('mapping.attribution.label'),
        collapseLabel: this.$t('mapping.attribution.collapseLabel'),
      });
      this.map.addControl(this.attributionControl);

      this.fullScreenControl = new FullScreenControl({
        label: this.$t('fullscreen.showLabel'),
        labelActive: this.$t('fullscreen.exitLabel'),
        tipLabel: this.$t('fullscreen.show'),
      });
      this.fullScreenControl.on('enterfullscreen', () => {
        this.fullScreenControl.button_.title = this.$t('fullscreen.exit')
      });
      this.fullScreenControl.on('leavefullscreen', () => {
        this.fullScreenControl.button_.title = this.$t('fullscreen.show')
      });
      this.map.addControl(this.fullScreenControl);
    },
    translate() {
      this.createControls();
    },
    async addBasemaps(basemaps, visibleLayer = 0) {
      const promises = basemaps.map(async (options) => {
        try {
          const layerClassName = options.is === 'VectorTile' ? 'VectorTile' : 'WebGLTile';
          const [{default: sourceCls}, {default: layerCls}] = await Promise.all([
            import(`ol/source/${options.is}.js`),
            import(`ol/layer/${layerClassName}.js`)
          ]);
          const source = new sourceCls(options);
          const layer = new layerCls({
            source,
            title: options.title,
            base: true
          });
          if (options.layerCreated) {
            return await options.layerCreated(layer, source);
          }
          return layer;
        } catch (error) {
          console.error(`Failed to load basemap source for ${options.is}`, error);
          return null;
        }
      });
      (await Promise.all(promises))
        .filter(options => Utils.isObject(options))
        .forEach((layer, i) => {
          layer.setVisible(i === visibleLayer);
          this.map.addLayer(layer);
        });
    }
  }
};
