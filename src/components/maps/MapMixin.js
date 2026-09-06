import { isObject } from 'stac-js/src/utils.js';
import i18n from '../../i18n';
import Utils from '../../utils';
import { mapGetters, mapState } from 'vuex';
import { needsAuthenticatedFetch } from '../../models/authMedia';
import OlMap from 'ol/Map.js';
import View from 'ol/View.js';
import Kinetic from 'ol/Kinetic.js';
import { defaults } from 'ol/interaction/defaults';
import DragPan from 'ol/interaction/DragPan.js';
import { all, focus, noModifierKeys, primaryAction } from 'ol/events/condition.js';
import ZoomControl from 'ol/control/Zoom.js';
import AttributionControl from 'ol/control/Attribution.js';
import FullScreenControl from 'ol/control/FullScreen.js';

import configureBasemap from '../../../basemaps.config';
import CONFIG from '../../merged-config';
import proj4 from 'proj4';
import {register} from 'ol/proj/proj4.js';
import { markRaw } from 'vue';
// Register pre-defined CRS from config in proj4
if (isObject(CONFIG.crs)) {
  for (const code in CONFIG.crs) {
    proj4.defs(code, CONFIG.crs[code]);
  }
}
register(proj4); // required to support source reprojection

export default {
  computed: {
    ...mapState(['buildTileUrlTemplate', 'colorMode', 'crossOriginMedia', 'displayGeoTiffByDefault', 'displayPreview', 'displayOverview', 'getMapSourceOptions', 'getStacLayerOptions', 'maxDisplayPixels', 'useTileLayerAsFallback', 'uiLanguage']),
    ...mapGetters(['getRequestUrl']),
    stacLayerOptions() {
      const options = {
        buildTileUrlTemplate: this.buildTileUrlTemplate,
        crossOriginMedia: this.crossOriginMedia,
        displayPreview: this.displayPreview,
        displayOverview: this.displayOverview,
        displayGeoTiffByDefault: this.displayGeoTiffByDefault,
        useTileLayerAsFallback: this.useTileLayerAsFallback,
        getSourceOptions: this.getMapSourceOptions,
        getLayerOptions: this.getStacLayerOptions,
        getRequestHeaders: this.getRequestHeadersForStacLayer,
        // Adds the configured query parameters (incl. query-parameter
        // credentials) to the URLs requested by ol-stac
        getRequestUrl: (ref, url, isTemplate) => isTemplate ? this.getRequestUrlTemplate(url) : this.getRequestUrl(url),
        httpRequestFn: async (url, responseType) => {
          const response = await this.$store.dispatch('request', { link: url, axiosOptions: { responseType } });
          return response.data;
        },
      };
      // null = use the ol-stac default
      if (typeof this.maxDisplayPixels === 'number') {
        options.maxDisplayPixels = this.maxDisplayPixels;
      }
      return options;
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
    },
    async colorMode() {
      await this.updateBasemaps();
    }
  },
  methods: {
    getRequestUrlTemplate(template) {
      return Utils.restoreUrlTemplateParams(this.getRequestUrl(template), template);
    },
    // Returns the HTTP headers (e.g. for authentication) that ol-stac attaches
    // to the requests for the given URL. External URLs get no credentials.
    getRequestHeadersForStacLayer(ref, url) {
      if (needsAuthenticatedFetch(this.$store, url)) {
        return this.$store.state.requestHeaders;
      }
      return null;
    },
    async createMap(element, onFocusOnly = false) {
      let projection = 'EPSG:3857';
      let visibleLayer = 0;

      // Get basemaps
      this.basemaps = configureBasemap(this.stac, this.$i18n, this.$store);
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

      const interactions = defaults({
        altShiftDragRotate: false,
        pinchRotate: false,
        dragPan: !onFocusOnly,
        onFocusOnly
      });
      if (onFocusOnly) {
        // Starting a mouse drag on the map is already a clear intent to pan,
        // but a one-finger touch drag is how the page is scrolled,
        // so only the latter requires the map to be focused first
        interactions.push(new DragPan({
          condition: (event) => all(noModifierKeys, primaryAction)(event)
            && (event.originalEvent.pointerType !== 'touch' || focus(event)),
          kinetic: new Kinetic(-0.005, 0.05, 100)
        }));
      }

      // Create map instance
      this.map = markRaw(new OlMap({
        target: element,
        controls: [],
        interactions,
        view: new View({
          center: [0, 0],
          zoom: 0,
          showFullExtent: true,
          projection,
        }),
      }));

      // Add controls
      this.createControls();

      // Add basemaps
      await this.addBasemaps(this.basemaps, visibleLayer);
    },
    async updateBasemaps() {
      if (!this.map) {
        return;
      }

      // Get new basemaps
      const newBasemaps = configureBasemap(this.stac, this.$i18n, this.$store);

      // Only update when the basemaps are different to before based on URLs
      const sameBasemaps = (
        this.basemaps.length === newBasemaps.length
        && this.basemaps.every((b, i) => b.url === newBasemaps[i].url)
      );
      if (sameBasemaps) {
        return;
      }

      // Remove existing basemap layers, but keep their position and visibility for the new layers
      const allLayers = this.map.getLayers().getArray();
      const basemapLayers = allLayers.filter(l => l.get('base'));
      const insertAt = allLayers.findIndex(l => l.get('base'));
      const visibleIndex = basemapLayers.findIndex(l => l.getVisible());
      basemapLayers.forEach(l => this.map.removeLayer(l));

      // Assign new basemaps
      this.basemaps = newBasemaps;

      // Restore visibility of the previously visible layer
      const newVisibleIndex = visibleIndex >= 0 && visibleIndex < this.basemaps.length ? visibleIndex : 0;

      // Add new basemap layers at the same position as the previous ones
      await this.addBasemaps(this.basemaps, newVisibleIndex, insertAt >= 0 ? insertAt : 0);
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
    async addBasemaps(basemaps, visibleLayer = 0, insertAt = null) {
      const promises = basemaps.map(async (options) => {
        try {
          let layerClassName = 'WebGLTile';
          let sourceClassName = options.is;
          if (options.is === 'VectorTileStyle') {
            layerClassName = 'Group';
            sourceClassName = null;
            const {apply} = await import('ol-mapbox-style');
            if (typeof options.transformRequest !== 'function') {
              // Attach the configured credentials to all requests made by
              // ol-mapbox-style (style, sources, sprites, glyphs, tiles).
              // A transformRequest defined in the basemap config takes over
              // instead and must handle credentials itself.
              options.transformRequest = (url, type) => {
                const requestUrl = type === 'Tiles' ? this.getRequestUrlTemplate(url) : this.getRequestUrl(url);
                if (needsAuthenticatedFetch(this.$store, url)) {
                  return new Request(requestUrl, { headers: this.$store.state.requestHeaders });
                }
                return requestUrl;
              };
            }
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
              // Request through the store so that credentials are attached
              const response = await this.$store.dispatch('request', { link: options.url, axiosOptions: { responseType: 'text' } });
              const capabilities = new WMTSCapabilities().read(response.data);
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
        .filter(layer => isObject(layer))
        .forEach((layer, i) => {
          layer.setVisible(i === visibleLayer);
          if (insertAt !== null) {
            this.map.getLayers().insertAt(insertAt + i, layer);
          } else {
            this.map.addLayer(layer);
          }
        });
    }
  }
};
