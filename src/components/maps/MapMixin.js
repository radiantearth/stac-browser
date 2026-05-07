import { mapState } from 'vuex';
import maplibregl from 'maplibre-gl';
import { Protocol } from 'pmtiles';
import { markRaw } from 'vue';
import configureBasemap from '../../../basemaps.config';

const protocol = new Protocol({ metadata: true });
maplibregl.addProtocol('pmtiles', protocol.tile);

const MAPTERHORN_SOURCE_ID = 'mapterhorn-terrain';
const MAPTERHORN_HILLSHADE_ID = 'mapterhorn-hillshade';

export default {
  computed: {
    ...mapState(['buildTileUrlTemplate', 'crossOriginMedia', 'displayGeoTiffByDefault', 'displayPreview', 'displayOverview', 'getMapSourceOptions', 'useTileLayerAsFallback', 'uiLanguage']),
    stacLayerOptions() {
      return {
        displayPreview: this.displayPreview,
        displayOverview: this.displayOverview,
        displayGeoTiffByDefault: this.displayGeoTiffByDefault,
        crossOriginMedia: this.crossOriginMedia,
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
      basemaps: [],
      activeBasemapIndex: 0,
      isFullScreen: false,
      is3D: false,
    };
  },
  methods: {
    async createMap(element, stac, onfocusOnly = false) {
      this.basemaps = configureBasemap(stac);

      this.map = markRaw(new maplibregl.Map({
        container: element,
        style: { version: 8, sources: {}, layers: [] },
        center: [0, 0],
        zoom: 1,
        attributionControl: false,
        interactive: !onfocusOnly,
      }));

      this.map.addControl(new maplibregl.NavigationControl({ showCompass: true }), 'top-right');
      this.map.addControl(new maplibregl.AttributionControl({ compact: true }), 'bottom-right');
      this.map.addControl(new maplibregl.FullscreenControl(), 'top-right');

      this.map.on('fullscreenchange', () => {
        this.isFullScreen = document.fullscreenElement != null;
      });

      await new Promise(resolve => {
        if (this.map.isStyleLoaded()) {
          resolve();
        } else {
          this.map.once('style.load', resolve);
        }
      });

      if (this.basemaps.length > 0) {
        this._loadBasemapAsync(this.basemaps[0]);
      }
    },

    _loadBasemapAsync(basemap) {
      const style = basemap.raster ? this.buildRasterStyle(basemap) : basemap.url;
      if (!style) return;

      this.map.once('style.load', () => {
        if (this.is3D) {
          this.enable3D();
        }
        if (typeof this.onBasemapChanged === 'function') {
          this.onBasemapChanged();
        }
      });
      this.map.setStyle(style);
    },

    buildRasterStyle(basemap) {
      return {
        version: 8,
        sources: {
          'raster-basemap': {
            type: 'raster',
            tiles: basemap.tiles,
            tileSize: 256,
            attribution: basemap.attribution || '',
          }
        },
        layers: [{
          id: 'raster-basemap-layer',
          type: 'raster',
          source: 'raster-basemap',
        }],
      };
    },

    async switchBasemap(index) {
      if (index === this.activeBasemapIndex || !this.map) return;
      this.activeBasemapIndex = index;
      const basemap = this.basemaps[index];
      if (!basemap) return;

      const was3D = this.is3D;

      const style = basemap.raster ? this.buildRasterStyle(basemap) : basemap.url;
      this.map.setStyle(style);

      await new Promise(resolve => this.map.once('style.load', resolve));

      if (was3D) {
        this.enable3D();
      }

      if (typeof this.onBasemapChanged === 'function') {
        this.onBasemapChanged();
      }
    },

    toggle3D() {
      if (this.is3D) {
        this.disable3D();
      } else {
        this.enable3D();
      }
    },

    enable3D() {
      if (!this.map) return;

      if (!this.map.getSource(MAPTERHORN_SOURCE_ID)) {
        this.map.addSource(MAPTERHORN_SOURCE_ID, {
          type: 'raster-dem',
          url: 'https://tiles.mapterhorn.com/tilejson.json',
        });
      }

      this.map.setTerrain({ source: MAPTERHORN_SOURCE_ID, exaggeration: 1 });
      this.map.setProjection({ type: 'globe' });

      if (!this.map.getSource(MAPTERHORN_HILLSHADE_ID)) {
        this.map.addSource(MAPTERHORN_HILLSHADE_ID, {
          type: 'raster-dem',
          url: 'https://tiles.mapterhorn.com/tilejson.json',
        });
      }
      if (!this.map.getLayer('hillshade-layer')) {
        this.map.addLayer({
          id: 'hillshade-layer',
          type: 'hillshade',
          source: MAPTERHORN_HILLSHADE_ID,
          layout: { visibility: 'visible' },
          paint: { 'hillshade-shadow-color': '#473B24' },
        }, this.getFirstSymbolLayerId());
      }

      this.map.setSky({
        'atmosphere-blend': ['interpolate', ['linear'], ['zoom'], 0, 1, 5, 1, 7, 0],
      });

      this.is3D = true;
    },

    disable3D() {
      if (!this.map) return;

      this.map.setTerrain(null);
      this.map.setProjection({ type: 'mercator' });
      this.map.setSky(null);

      if (this.map.getLayer('hillshade-layer')) {
        this.map.removeLayer('hillshade-layer');
      }
      if (this.map.getSource(MAPTERHORN_HILLSHADE_ID)) {
        this.map.removeSource(MAPTERHORN_HILLSHADE_ID);
      }
      if (this.map.getSource(MAPTERHORN_SOURCE_ID)) {
        this.map.removeSource(MAPTERHORN_SOURCE_ID);
      }

      this.is3D = false;
    },

    getFirstSymbolLayerId() {
      if (!this.map) return undefined;
      const layers = this.map.getStyle()?.layers;
      if (!layers) return undefined;
      for (const layer of layers) {
        if (layer.type === 'symbol') return layer.id;
      }
      return undefined;
    },
  }
};
