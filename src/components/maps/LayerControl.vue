<template>
  <div v-if="showControl" class="map-layercontrol">
    <button :id="buttonId" class="maplibregl-ctrl maplibregl-ctrl-group layer-btn">
      <b-icon-layers-fill />
    </button>
    <b-popover
      v-if="buttonId" click placement="top" @show="update"
      :target="buttonId" teleport-to="#stac-browser" :boundary-padding="10"
    >
      <div class="layercontrol">
        <section v-if="basemaps && basemaps.length > 1">
          <h5>{{ $t('mapping.layers.base') }}</h5>
          <b-form-radio-group v-model="selectedIndex">
            <b-form-radio v-for="(bm, i) in basemaps" :key="i" :value="i">
              {{ bm.title }}
            </b-form-radio>
          </b-form-radio-group>
        </section>
        <section v-if="overlayLayers.length > 0">
          <h5>{{ $t('mapping.layers.title') }}</h5>
          <ul>
            <li v-for="layer in overlayLayers" :key="layer.id">
              <b-form-checkbox
                :model-value="layer.visible"
                @update:model-value="toggleOverlay(layer, $event)"
              >
                {{ layer.title }}
              </b-form-checkbox>
            </li>
          </ul>
        </section>
      </div>
    </b-popover>
  </div>
</template>

<script>
import { defineAsyncComponent } from 'vue';

export default {
  name: 'LayerControl',
  components: {
    BPopover: defineAsyncComponent(() => import('bootstrap-vue-next').then(m => m.BPopover)),
  },
  props: {
    map: {
      type: Object,
      default: null,
    },
    basemaps: {
      type: Array,
      default: () => [],
    },
    activeBasemapIndex: {
      type: Number,
      default: 0,
    },
    stacLayer: {
      type: Object,
      default: null,
    },
  },
  emits: ['switch-basemap'],
  computed: {
    showControl() {
      return (this.basemaps && this.basemaps.length > 1) || this.stacLayer;
    },
  },
  data() {
    return {
      buttonId: null,
      selectedIndex: this.activeBasemapIndex,
      overlayLayers: [],
    };
  },
  watch: {
    map(map) {
      if (map) {
        this.buttonId = 'layer-ctrl-' + Date.now();
      }
    },
    activeBasemapIndex(val) {
      this.selectedIndex = val;
    },
    selectedIndex(newVal, oldVal) {
      if (oldVal !== null && newVal !== oldVal) {
        this.$emit('switch-basemap', newVal);
      }
    },
  },
  methods: {
    update() {
      if (!this.stacLayer) {
        this.overlayLayers = [];
        return;
      }
      const footprintIds = this.stacLayer.getFootprintLayerIds();
      const childrenIds = this.stacLayer.getChildrenLayerIds();
      const layers = [];
      if (footprintIds.length > 0) {
        const vis = this.map?.getLayoutProperty(footprintIds[0], 'visibility');
        layers.push({
          id: 'footprint',
          title: this.$t('mapping.layers.footprint'),
          type: 'maplibre',
          visible: vis !== 'none',
          layerIds: footprintIds,
        });
      }
      if (childrenIds.length > 0) {
        const vis = this.map?.getLayoutProperty(childrenIds[0], 'visibility');
        layers.push({
          id: 'children',
          title: this.$t('mapping.layers.title'),
          type: 'maplibre',
          visible: vis !== 'none',
          layerIds: childrenIds,
        });
      }
      const assetOverlays = this.stacLayer.getAssetOverlays();
      layers.push(...assetOverlays);
      this.overlayLayers = layers;
    },
    toggleOverlay(layer, visible) {
      if (layer.type === 'deckgl') {
        this.stacLayer.setCogVisible(layer.deckIndex, visible);
      } else {
        const val = visible ? 'visible' : 'none';
        for (const id of layer.layerIds) {
          if (this.map?.getLayer(id)) {
            this.map.setLayoutProperty(id, 'visibility', val);
          }
        }
      }
      layer.visible = visible;
    },
  },
};
</script>

<style lang="scss" scoped>
.map-layercontrol {
  position: absolute;
  z-index: 2;
  left: 10px;
  bottom: 30px;
}

.layer-btn {
  cursor: pointer;
  width: 29px;
  height: 29px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: white;
  border: none;
  padding: 0;
}

.layercontrol {
  max-width: 300px;
  max-height: 500px;
  overflow: auto;
  margin-top: -0.5rem;
  margin-left: -0.75rem;
  margin-right: -0.75rem;
  padding: 0.5rem 0.75rem 0 0.75rem;

  ul {
    list-style: none;
    padding: 0;
    margin: 0;

    li {
      padding-left: 0.5em;
    }
  }
}

h5 {
  font-weight: bold;
  font-size: 1em;
}
</style>
