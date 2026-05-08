<template>
  <div class="map-container" :class="{ expanded: isExpanded }">
    <div ref="map" class="map" :id="mapId">
      <LayerControl :map="map" :basemaps="basemaps" :activeBasemapIndex="activeBasemapIndex" :stacLayer="stacLayer" @switch-basemap="switchBasemap" />
      <TerrainControl :is3D="is3D" @toggle="toggle3D" />
      <StylePicker
        :styles="availableStyles"
        :activeIndex="activeStyleIndex"
        :legend="activeLegend"
        @change="applyStyleAtIndex"
      />
      <TextControl v-if="empty" :text="$t('mapping.nodata')" />
      <TextControl v-else-if="!hasBasemap" :text="$t('mapping.nobasemap')" />
    </div>
    <div ref="target" class="popover-target" />
    <b-popover
      v-if="popover && selection" show manual placement="auto"
      :target="selection.target" :teleport-to="container" class="map-popover"
      :boundary-padding="10"
    >
      <section class="popover-children">
        <Items v-if="selection.type === 'items'" :stac="stac" :items="selection.children" />
        <Catalogs v-else-if="selection.type === 'collections'" collectionsOnly enforceCards hideControls :stac="stac" :catalogs="selection.children" />
        <Features v-else :features="selection.children" />
      </section>
      <div class="text-center">
        <b-button variant="danger" @click="resetSelection">{{ $t('mapping.close') }}</b-button>
      </div>
    </b-popover>
  </div>
</template>

<script>
import { defineAsyncComponent } from 'vue';
import MapMixin from './maps/MapMixin.js';
import LayerControl from './maps/LayerControl.vue';
import TextControl from './maps/TextControl.vue';
import TerrainControl from './maps/TerrainControl.vue';
import StylePicker from './maps/StylePicker.vue';
import StacMapLayer from './maps/StacMapLayer.js';
import { resolveStyles, loadStyleJson, extractLegend } from '../utils/portolanStyles.js';
import { mapGetters } from 'vuex';
import proj4 from 'proj4';

let mapId = 0;

export default {
  name: 'MapView',
  components: {
    BPopover: defineAsyncComponent(() => import('bootstrap-vue-next').then(m => m.BPopover)),
    Features: defineAsyncComponent(() => import('../components/Features.vue')),
    Catalogs: defineAsyncComponent(() => import('../components/Catalogs.vue')),
    Items: defineAsyncComponent(() => import('../components/Items.vue')),
    LayerControl,
    TextControl,
    TerrainControl,
    StylePicker,
  },
  mixins: [
    MapMixin
  ],
  props: {
    stac: {
      type: Object,
      default: null
    },
    assets: {
      type: Array,
      default: null
    },
    children: {
      type: Object,
      default: null
    },
    onfocusOnly: {
      type: Boolean,
      default: false
    },
    popover: {
      type: Boolean,
      default: false
    },
    hideFootprint: {
      type: Boolean,
      default: false
    }
  },
  emits: ['empty', 'changed'],
  data() {
    return {
      selection: null,
      empty: false,
      isExpanded: false,
      mapId: `map-${++mapId}`,
      availableStyles: [],
      activeStyleIndex: 0,
      activeLegend: [],
    };
  },
  computed: {
    ...mapGetters(['getStac']),
    container() {
      if (this.isFullScreen) {
        return '#' + this.mapId;
      }
      return '#stac-browser';
    },
  },
  watch: {
    async stac() {
      await this.showStacLayer();
    },
    async assets() {
      if (!this.stacLayer) return;
      await this.stacLayer.setAssets(this.assets);
    },
    async children() {
      if (!this.stacLayer) return;
      this.stacLayer.setChildren(this.children);
      this.stacLayer.fit();
    },
    empty(empty) {
      if (empty) {
        this.$emit('empty');
      }
    },
  },
  created() {
    this.stacLayer = null;
    this._showingStacLayer = false;
  },
  async mounted() {
    await this.showStacLayer();
  },
  beforeUnmount() {
    if (this.stacLayer) {
      this.stacLayer.remove();
      this.stacLayer = null;
    }
    if (this.map) {
      this.map.remove();
      this.map = null;
    }
  },
  methods: {
    async showStacLayer() {
      if (this._showingStacLayer) return;
      this._showingStacLayer = true;

      try {
        this.availableStyles = [];
        this.activeStyleIndex = 0;
        this.activeLegend = [];
        if (this.stacLayer) {
          this.stacLayer.remove();
          this.stacLayer = null;
        }
        if (this.map) {
          this.map.remove();
        }
        this.map = null;

        if (!this.$refs.map) return;

        await this.createMap(this.$refs.map, this.stac, this.onfocusOnly);
        this._addExpandControl();

        if (this.stac) {
          await this.addStacLayer();
        }
      } finally {
        this._showingStacLayer = false;
      }
    },

    async addStacLayer() {
      this.stacLayer = new StacMapLayer(this.map, this.stacLayerOptions);

      this.stacLayer.setStac(this.stac);

      if (this.children) {
        this.stacLayer.setChildren(this.children);
      }

      if (this.assets) {
        await this.stacLayer.setAssets(this.assets);
      } else {
        await this.stacLayer.autoLoadVisualAssets(this.stac);
      }

      if (this.hideFootprint) {
        this.stacLayer.setFootprintVisible(false);
      }

      this.empty = this.stacLayer.isEmpty();
      this.stacLayer.fit();

      this.$emit('changed', this.getShownData());

      if (this.popover) {
        this._setupClickInteraction();
      }

      await this.resolveAndApplyStyles();
    },

    async resolveAndApplyStyles() {
      if (!this.stac) return;
      const styles = resolveStyles(this.stac);
      if (styles.length === 0) return;
      this.availableStyles = styles;
      await this.applyStyleAtIndex(0);
    },

    async applyStyleAtIndex(index) {
      const styleEntry = this.availableStyles[index];
      if (!styleEntry || !this.stacLayer) return;
      try {
        if (!styleEntry._cached) {
          styleEntry._cached = await loadStyleJson(styleEntry.href);
        }
        this.stacLayer.applyGlStyle(styleEntry._cached);
        this.activeStyleIndex = index;
        this.activeLegend = extractLegend(styleEntry._cached);
      } catch (err) {
        console.warn('Failed to apply style:', styleEntry.name, err);
      }
    },

    async onBasemapChanged() {
      if (this.stacLayer) {
        await this.stacLayer.readdAfterStyleChange();
      }
    },

    _setupClickInteraction() {
      const childrenLayerIds = this.stacLayer.getChildrenLayerIds();
      if (childrenLayerIds.length === 0) return;

      for (const layerId of childrenLayerIds) {
        this.map.on('mouseenter', layerId, () => {
          this.map.getCanvas().style.cursor = 'pointer';
        });
        this.map.on('mouseleave', layerId, () => {
          this.map.getCanvas().style.cursor = '';
        });
      }

      this.map.on('click', (e) => {
        this.selection = null;

        const features = this.map.queryRenderedFeatures(e.point, {
          layers: childrenLayerIds,
        });

        if (features.length === 0) return;

        this.$refs.target.style.left = e.point.x + 'px';
        this.$refs.target.style.top = e.point.y + 'px';

        const items = this.children?.isItemCollection
          ? this.children.features
          : this.children?.collections;

        if (!items) return;

        const seen = new Set();
        const matched = [];
        for (const f of features) {
          const idx = f.properties._stacIndex;
          if (idx != null && !seen.has(idx) && items[idx]) {
            seen.add(idx);
            matched.push(items[idx]);
            if (matched.length >= 5) break;
          }
        }

        if (matched.length > 0) {
          this.selection = {
            target: this.$refs.target,
            type: this.children.isCollectionCollection ? 'collections' : 'items',
            children: matched,
          };
        }
      });
    },

    _addExpandControl() {
      if (!this.map) return;
      const vm = this;
      const ctrl = {
        onAdd() {
          const container = document.createElement('div');
          container.className = 'maplibregl-ctrl maplibregl-ctrl-group';
          const btn = document.createElement('button');
          btn.type = 'button';
          btn.title = 'Expand map';
          btn.innerHTML = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></svg>';
          btn.style.display = 'flex';
          btn.style.alignItems = 'center';
          btn.style.justifyContent = 'center';
          btn.addEventListener('click', () => vm.toggleExpand(btn));
          container.appendChild(btn);
          return container;
        },
        onRemove() {}
      };
      this.map.addControl(ctrl, 'top-right');
    },

    toggleExpand(btn) {
      this.isExpanded = !this.isExpanded;
      if (btn) {
        btn.title = this.isExpanded ? 'Collapse map' : 'Expand map';
        btn.innerHTML = this.isExpanded
          ? '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><polyline points="4 14 10 14 10 20"/><polyline points="20 10 14 10 14 4"/><line x1="14" y1="10" x2="21" y2="3"/><line x1="3" y1="21" x2="10" y2="14"/></svg>'
          : '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></svg>';
      }
      this.$nextTick(() => {
        if (this.map) {
          this.map.resize();
        }
      });
    },

    fit() {
      if (this.stacLayer) {
        this.stacLayer.fit();
      }
    },

    resetSelection() {
      this.selection = null;
    },

    getShownData() {
      if (!this.stacLayer) return null;
      return this.stacLayer.getVisibleStacReferences();
    },

    async resolveExtent(bbox, sourceCrs) {
      if (!this.map || !bbox || bbox.length !== 4) return null;

      const fromCrs = sourceCrs || 'EPSG:4326';

      if (fromCrs === 'EPSG:4326') {
        return [[bbox[0], bbox[1]], [bbox[2], bbox[3]]];
      }

      if (fromCrs !== 'EPSG:3857' && !proj4.defs(fromCrs)) {
        const match = fromCrs.match(/^EPSG:(\d+)$/);
        if (match) {
          try {
            const resp = await fetch(`https://epsg.io/${match[1]}.proj4`);
            if (resp.ok) {
              const proj4def = await resp.text();
              proj4.defs(fromCrs, proj4def.trim());
            }
          } catch (e) {
            console.warn('Failed to fetch CRS definition for', fromCrs, e);
          }
        }
      }

      try {
        const sw = proj4(fromCrs, 'EPSG:4326', [bbox[0], bbox[1]]);
        const ne = proj4(fromCrs, 'EPSG:4326', [bbox[2], bbox[3]]);
        return [sw, ne];
      } catch (e) {
        console.warn('CRS transform failed', e);
        return null;
      }
    },

    pulseExtent(bounds) {
      if (!this.map || !bounds) return;

      const sourceId = 'pulse-extent-' + Date.now();
      const fillLayerId = sourceId + '-fill';
      const lineLayerId = sourceId + '-line';

      const sw = bounds[0];
      const ne = bounds[1];

      const width = Math.abs(ne[0] - sw[0]);
      const height = Math.abs(ne[1] - sw[1]);
      const zoom = this.map.getZoom();
      const tooSmall = width < 0.001 && height < 0.001 && zoom > 10;

      let geojson;
      if (tooSmall) {
        const center = [(sw[0] + ne[0]) / 2, (sw[1] + ne[1]) / 2];
        geojson = {
          type: 'Feature',
          geometry: { type: 'Point', coordinates: center },
          properties: {},
        };
      } else {
        geojson = {
          type: 'Feature',
          geometry: {
            type: 'Polygon',
            coordinates: [[
              [sw[0], sw[1]],
              [ne[0], sw[1]],
              [ne[0], ne[1]],
              [sw[0], ne[1]],
              [sw[0], sw[1]],
            ]],
          },
          properties: {},
        };
      }

      this.map.addSource(sourceId, { type: 'geojson', data: geojson });

      if (tooSmall) {
        this.map.addLayer({
          id: fillLayerId,
          type: 'circle',
          source: sourceId,
          paint: {
            'circle-radius': 8,
            'circle-color': 'rgba(255, 200, 0, 0.7)',
            'circle-stroke-color': 'rgba(200, 150, 0, 0.8)',
            'circle-stroke-width': 2,
          },
        });
      } else {
        this.map.addLayer({
          id: fillLayerId,
          type: 'fill',
          source: sourceId,
          paint: {
            'fill-color': 'rgba(255, 200, 0, 0.1)',
          },
        });
        this.map.addLayer({
          id: lineLayerId,
          type: 'line',
          source: sourceId,
          paint: {
            'line-color': 'rgba(255, 200, 0, 0.8)',
            'line-width': 3,
          },
        });
      }

      const duration = 8000;
      const start = Date.now();
      const map = this.map;

      const interval = setInterval(() => {
        const elapsed = Date.now() - start;
        if (elapsed >= duration || !map) {
          clearInterval(interval);
          try {
            if (map.getLayer(fillLayerId)) map.removeLayer(fillLayerId);
            if (map.getLayer(lineLayerId)) map.removeLayer(lineLayerId);
            if (map.getSource(sourceId)) map.removeSource(sourceId);
          } catch { /* map may be gone */ }
          return;
        }
        const phase = (elapsed / 800) * Math.PI;
        const pulse = 0.4 + 0.5 * Math.abs(Math.sin(phase));
        try {
          if (tooSmall) {
            map.setPaintProperty(fillLayerId, 'circle-color', `rgba(255, 200, 0, ${pulse})`);
            map.setPaintProperty(fillLayerId, 'circle-radius', 6 + 3 * Math.abs(Math.sin(phase)));
          } else {
            map.setPaintProperty(fillLayerId, 'fill-color', `rgba(255, 200, 0, ${pulse * 0.15})`);
            map.setPaintProperty(lineLayerId, 'line-color', `rgba(255, 200, 0, ${pulse})`);
            map.setPaintProperty(lineLayerId, 'line-width', 2 + 2 * Math.abs(Math.sin(phase)));
          }
        } catch { /* ignore */ }
      }, 50);
    },

    async zoomToBbox(bbox, sourceCrs) {
      if (!this.map) return;
      const bounds = await this.resolveExtent(bbox, sourceCrs);
      if (!bounds) return;

      try {
        this.map.fitBounds(bounds, { padding: 50, maxZoom: 18 });
      } catch (e) {
        console.warn('Map fitBounds failed', e);
        return;
      }

      this.pulseExtent(bounds);
    },

    async highlightBbox(bbox, sourceCrs) {
      const bounds = await this.resolveExtent(bbox, sourceCrs);
      if (!bounds) return;
      this.pulseExtent(bounds);
    },
  }
};
</script>

<style lang="scss">
@import "maplibre-gl/dist/maplibre-gl.css";

#stac-browser {
  .map-container.expanded .map {
    height: calc(100vh - 30px) !important;
  }

  .map-popover {
    max-width: 400px;
  }

  .popover-target {
    width: 1px;
    height: 1px;
    opacity: 0;
    position: absolute;
    top: -1px;
    left: -1px;
  }

  .popover-children {
    max-height: 500px;
    overflow: auto;
    margin-top: -0.5rem;
    margin-left: -0.75rem;
    margin-right: -0.75rem;
    padding: 0.5rem 0.75rem 0  0.75rem;

    .items, .features, .catalogs {
      margin-bottom: 0 !important;
    }

    .card-columns {
      column-count: 1;
    }
  }
}
</style>
