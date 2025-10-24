<template>
  <div class="map-container">
    <div ref="map" class="map" :id="mapId">
      <!-- this will be filled by OpenLayers -->
      <LayerControl :map="map" :maxZoom="maxZoom" />
      <TextControl v-if="empty" :map="map" :text="$t('mapping.nodata')" />
      <TextControl v-else-if="!hasBasemap" :map="map" :text="$t('mapping.nobasemap')" />
    </div>
    <TeleportPopover
      v-if="popover && selection"
      trigger-mode="manual"
      :show="!!selection"
      placement="bottom"
      custom-class="map-popover"
    >
      <template #trigger>
        <div class="popover-trigger-point" :style="triggerStyle" />
      </template>
      <template #content>
        <section class="popover-items">
          <Items v-if="selection.type === 'items'" :stac="stac" :items="selection.items" />
          <Features v-else :features="selection.items" />
        </section>
        <div class="text-center">
          <b-button target="_blank" variant="danger" @click="resetselection">{{ $t('mapping.close') }}</b-button>
        </div>
      </template>
    </TeleportPopover>
  </div>
</template>

<script>
import { defineAsyncComponent } from 'vue';
import MapMixin from './maps/MapMixin.js';
import LayerControl from './maps/LayerControl.vue';
import TextControl from './maps/TextControl.vue';
import TeleportPopover from './TeleportPopover.vue';
import { mapGetters } from 'vuex';
import Select from 'ol/interaction/Select';
import StacLayer from 'ol-stac';
import { getStacObjectsForEvent, getStyle } from 'ol-stac/util.js';
import { STACReference } from 'stac-js';
import MapUtils from './maps/mapUtils.js';
import GeoJSON from 'ol/format/GeoJSON.js';

const selectStyle = getStyle('#ff0000', 2, null);
let mapId = 0;

export default {
  name: 'Map',
  components: {
    Features: () => import('../components/Features.vue'),
    Items: () => import('../components/Items.vue'),
    TeleportPopover,
    LayerControl,
    TextControl
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
    items: {
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
    }
  },
  emits: ['empty', 'changed'],
  data() {
    return {
      stacLayer: null,
      selection: null,
      clickPosition: { x: 0, y: 0 },
      empty: false,
      selector: null,
      mapId: `map-${++mapId}`,
    };
  },
  computed: {
    ...mapGetters(['getStac']),
    container() {
      if (this.isFullScreen) {
        return '#' + this.mapId;
      }
      else {
        return '#stac-browser';
      }
    },
    triggerStyle() {
      return {
        position: 'absolute',
        left: `${this.clickPosition.x}px`,
        top: `${this.clickPosition.y}px`,
        width: '1px',
        height: '1px',
        pointerEvents: 'none'
      };
    }
  },
  watch: {
    async stac() {
      await this.showStacLayer();
    },
    async assets() {
      if (!this.stacLayer) {
        return;
      }
      await this.stacLayer.setAssets(this.assets);
    },
    async items() {
      if (!this.stacLayer) {
        return;
      }
      await this.stacLayer.setAssets(null, false);
      await this.stacLayer.setChildren(this.items, {displayPreview: true}, false);
      await this.stacLayer.updateLayers();
      this.fit();
    },
    empty(empty) {
      if (empty) {
        this.$emit('empty');
      }
    },
    selection(selection) {
      if (!selection && this.selector) {
        this.selector.getFeatures().clear();
      }
    }
  },
  async mounted() {
    await this.showStacLayer();
  },
  methods: {
    async showStacLayer() {
      this.map = null;
      this.stacLayer = null;

      await this.createMap(this.$refs.map, this.stac, this.onfocusOnly);

      if (this.stac) {
        await this.addStacLayer();
      }
    },
    async addStacLayer() {
      let options = Object.assign({}, this.stacLayerOptions, {
        // Don't set the URL here, as it is already set in the STAC object and is read-only.
        // url: this.stac.getAbsoluteUrl(),
        data: this.stac,
        children: this.items,
        assets: this.assets || null,
        displayWebMapLink: true,
        disableMigration: true,
      });
      this.stacLayer = new StacLayer(options);
      this.stacLayer.on('error', error => {
        console.warn(error);
        this.fit();
      });
      this.stacLayer.on('sourceready', this.fit);
      this.stacLayer.on('layersready', () => {
        this.empty = this.stacLayer.isEmpty();
        this.$emit('changed', this.getShownData());
      });
      this.map.addLayer(this.stacLayer);

      if (this.popover) {
        this.selector = new Select({
          multi: true,
          style: selectStyle,
          layers: (layer) => {
            if (this.items) {
              // For item selection
              return false;
            }
            else {
              // For feature selection
              const stac = layer.get('stac');
              return stac && stac.isAsset();
            }
          }
        });
        this.selector.on('select', (event) => {
          // For feature selction
          this.selection = null;
          this.setTargetPosition(event.mapBrowserEvent);
          const features = this.selector.getFeatures();
          if (features.getLength() > 0) {
            const writer = new GeoJSON();
            this.selection = {
              target: this.$refs.target,
              type: 'features',
              items: features.getArray().map(f => writer.writeFeatureObject(f))
            };
          }
        });
        this.map.addInteraction(this.selector);
        this.map.on('singleclick', async (event) => {
          // Store click position for popover positioning
          this.clickPosition = {
            x: event.pixel[0],
            y: event.pixel[1]
          };

          // For item selection
          this.selection = null;
          if (this.items) {
            this.setTargetPosition(event);
            this.selector.getFeatures().clear();
            const features = this.selector.getFeatures();
            const container = this.stacLayer.getData();
            const objects = await getStacObjectsForEvent(event, container, features, 5);
            if (objects.length > 0) {
              this.selection = {
                target: this.$refs.target,
                type: 'items',
                items: objects
              };
            }
          }
        });
        this.map.on('change', () => this.selection = null);
        this.map.on('movestart', () => this.selection = null);
      }
    },
    setTargetPosition(event) {
      // The event doesn't contain a target element for the popover to attach to.
      // Thus we move a hidden target element to the click position and attach the popover to it.
      // See also https://github.com/bootstrap-vue/bootstrap-vue/issues/5285
      this.$refs.target.style.left = event.pixel[0] + 'px';
      this.$refs.target.style.top = event.pixel[1] + 'px';
    },
    fit() {
      const extent = this.stacLayer.getExtent();
      if (extent) {
        // Update the sizes, otherwise the fit will not work properly and compute a wrong zoom level
        this.map.updateSize();
        this.map.getView().fit(extent, { padding: [50,50,50,50], maxZoom: this.maxZoom });
      }
    },
    resetSelection() {
      this.selection = null;
    },
    getShownData() {
      if (!this.stacLayer) {
        return null;
      }
      return this.stacLayer.getLayers().getArray()
        .filter(layer => MapUtils.isLayerVisible(layer))
        .map(layer => layer.get('stac'))
        .filter(stac => stac instanceof STACReference);
    }
  }
};
</script>

<style lang="scss">
@import "../../node_modules/ol/ol.css";

#stac-browser {
  .map-popover {
    max-width: 400px;
  }

  .popover-trigger-point {
    width: 1px;
    height: 1px;
    opacity: 0;
    position: absolute;
    pointer-events: none;
  }
  
  .popover-items {
    max-height: 500px;
    overflow: auto;
    margin-top: -0.5rem;
    margin-left: -0.75rem;
    margin-right: -0.75rem;
    padding: 0.5rem 0.75rem 0  0.75rem;

    .items {
      margin-bottom: 0 !important;
    }

    .card-columns {
      column-count: 1;
    }
  }
}
</style>
