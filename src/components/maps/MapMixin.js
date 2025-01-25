import configureBasemap from '../../../basemaps.config';
import Utils from '../../utils';
import { mapState } from 'vuex';
import Map from 'ol/Map.js';
import View from 'ol/View.js';
import MouseWheelZoom from 'ol/interaction/MouseWheelZoom.js';
import TileLayer from 'ol/layer/WebGLTile.js';
import ZoomControl from 'ol/control/Zoom.js';
import AttributionControl from 'ol/control/Attribution.js';
import FullScreenControl from 'ol/control/FullScreen.js';
import { stacRequest } from '../../store/utils';

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
    async createMap(element, stac) {
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
    disableMouseWheelZoom() {
      const interaction = this.map.getInteractions().getArray()
        .find(interaction => interaction instanceof MouseWheelZoom);
      if (interaction) {
        this.map.removeInteraction(interaction);
      }
    },
    translate() {
      this.createControls();
    },
    async addBasemaps(basemaps, visibleLayer = 0) {
      const promises = basemaps.map(async (options) => {
        try {
          const cls = (await import(`ol/source/${options.is}.js`)).default;
          return {
            source: new cls(options),
            title: options.title,
            base: true
          };
        } catch (error) {
          console.error(`Failed to load basemap source for ${options.is}`, error);
          return null;
        }
      });
      (await Promise.all(promises))
        .filter(options => Utils.isObject(options))
        .map(options => new TileLayer(options))
        .forEach((layer, i) => {
          layer.setVisible(i === visibleLayer);
          this.map.addLayer(layer);
        });
    }
  }
};
