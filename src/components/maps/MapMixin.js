import Utils from '../../utils';
import i18n from '../../i18n';
import { mapState } from 'pinia';
import { useConfigStore } from '../../store/config';
import { useCatalogStore } from '../../store/catalog';
import Map from 'ol/Map.js';
import View from 'ol/View.js';
import { defaults } from 'ol/interaction/defaults';
import ZoomControl from 'ol/control/Zoom.js';
import AttributionControl from 'ol/control/Attribution.js';
import FullScreenControl from 'ol/control/FullScreen.js';
import { stacRequest } from '../../store/utils';

import configureBasemap from '../../../basemaps.config';
import CONFIG from '../../config';
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
    ...mapState(useConfigStore, ['buildTileUrlTemplate', 'crossOriginMedia', 'displayGeoTiffByDefault', 'displayPreview', 'displayOverview', 'getMapSourceOptions', 'useTileLayerAsFallback']),
    ...mapState(useCatalogStore, ['uiLanguage']),
    stacLayerOptions() {
      return {
        buildTileUrlTemplate: this.buildTileUrlTemplate,
        crossOriginMedia: this.crossOriginMedia,
        displayPreview: this.displayPreview,
        displayOverview: this.displayOverview,
        displayGeoTiffByDefault: this.displayGeoTiffByDefault,
        useTileLayerAsFallback: this.useTileLayerAsFallback,
        getSourceOptions: this.getMapSourceOptions,
        httpRequestFn: async (url, responseType) => {
          const response = await stacRequest(null, url, {responseType});
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
      maxZoom: 16,
      zoomControl: null,
      attributionControl: null,
      fullScreenControl: null,
      basemaps: [],
      isFullScreen: false,
    };
  },
  watch: {
    uiLanguage() {
      this.createControls();
    }
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
        zoomInLabel: i18n.global.t('mapping.zoom.in.label'),
        zoomOutLabel: i18n.global.t('mapping.zoom.out.label'),
        zoomInTipLabel: i18n.global.t('mapping.zoom.in.description'),
        zoomOutTipLabel: i18n.global.t('mapping.zoom.out.description')
      });
      this.map.addControl(this.zoomControl);

      this.attributionControl = new AttributionControl({
        tipLabel: i18n.global.t('mapping.attribution.description'),
        label: i18n.global.t('mapping.attribution.label'),
        collapseLabel: i18n.global.t('mapping.attribution.collapseLabel'),
      });
      this.map.addControl(this.attributionControl);

      this.fullScreenControl = new FullScreenControl({
        label: i18n.global.t('fullscreen.showLabel'),
        labelActive: i18n.global.t('fullscreen.exitLabel'),
        tipLabel: i18n.global.t('fullscreen.show'),
      });
      this.fullScreenControl.on('enterfullscreen', () => {
        this.fullScreenControl.button_.title = i18n.global.t('fullscreen.exit');
        this.isFullScreen = true;
      });
      this.fullScreenControl.on('leavefullscreen', () => {
        this.fullScreenControl.button_.title = i18n.global.t('fullscreen.show');
        this.isFullScreen = false;
      });
      this.map.addControl(this.fullScreenControl);
    },
    async addBasemaps(basemaps, visibleLayer = 0) {
      const promises = basemaps.map(async (options) => {
        try {
          let layerClassName = 'WebGLTile';
          let sourceClassName = options.is;
          if (options.is === 'VectorTileStyle') {
            layerClassName = 'Group';
            sourceClassName = null;
            const {apply} = await import('ol-mapbox-style');
            const callback = options.layerCreated;
            options.layerCreated = async (layer, source, map) => {
              layer = await apply(layer, options.url, options);
              if (callback) {
                layer = await callback(layer, source, map);
              }
              return layer;
            };
          }
          else if (options.is === 'WMTS' && !options.url.includes('{') && !options.url.includes('}')) {
            // Request capabilities if URL does not seem to be a URL template
            const [{optionsFromCapabilities}, {default: WMTSCapabilities}] = await Promise.all([
              import('ol/source/WMTS.js'),
              import('ol/format/WMTSCapabilities.js')
            ]);
            try {
              const response = await fetch(options.url, {method: 'GET'});
              const capabilities = new WMTSCapabilities().read(await response.text());
              const wmtsOptions = optionsFromCapabilities(capabilities, options);
              Object.assign(options, wmtsOptions);
            } catch (e) {
              console.error('Failed to fetch WMTS capabilities', e);
            }
          }
          const [{ default: sourceCls }, { default: layerCls }] = await Promise.all([
            // We need to import relatively for vite, see
            // https://github.com/rollup/plugins/tree/master/packages/dynamic-import-vars#imports-must-start-with--or-
            sourceClassName ? import(`../../../node_modules/ol/source/${sourceClassName}.js`) : Promise.resolve({ default: null }),
            import(`../../../node_modules/ol/layer/${layerClassName}.js`)
          ]);
          const source = sourceCls ? new sourceCls(options) : undefined;
          const layer = new layerCls({
            source,
            title: options.title,
            base: true
          });
          if (options.layerCreated) {
            return await options.layerCreated(layer, source, this.map);
          }
          return layer;
        } catch (error) {
          console.error(`Failed to load basemap source for ${options.is}`, error);
          return null;
        }
      });
      (await Promise.all(promises))
        .filter(layer => Utils.isObject(layer))
        .forEach((layer, i) => {
          layer.setVisible(i === visibleLayer);
          this.map.addLayer(layer);
        });
    }
  }
};
