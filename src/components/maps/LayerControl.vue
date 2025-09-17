<template>
  <div class="ol-layercontrol ol-unselectable ol-control" style="pointer-events: auto;">
    <TeleportPopover v-if="id" placement="top" @show="update">
      <template #trigger>
        <button :id="id"><b-icon-layers-fill /></button>
      </template>
      <template #content>
        <div class="layercontrol">
          <section>
            <h5>{{ $t('mapping.layers.base') }}</h5>
            <span v-if="baseLayers.length === 0">{{ $t('mapping.nobasemap') }}</span>
            <b-form-radio-group v-else v-model="visibleBaseLayer">
              <b-form-radio v-for="layer in baseLayers" :key="layer.id" :value="layer.id">
                {{ layer.title }}
              </b-form-radio>
            </b-form-radio-group>
          </section>
          <section v-if="hasLayers">
            <h5>{{ $t('mapping.layers.title') }}</h5>
            <LayerControlGroup :map="map" :group="layerGroup" />
          </section>
        </div>
      </template>
    </TeleportPopover>
  </div>
</template>

<script>
import View from 'ol/View';
import ControlMixin from './ControlMixin';
import LayerControlMixin from './LayerControlMixin';
import { BFormRadio, BFormRadioGroup, BIconLayersFill, BPopover } from 'bootstrap-vue';
import { transformWithProjections } from 'ol/proj';
import Group from 'ol/layer/Group';
import { Vector } from 'ol/source';
import TeleportPopover from '../TeleportPopover.vue';

export default {
  name: 'LayerControl',
  components: {
    BFormRadioGroup,
    BFormRadio,
    BIconLayersFill,
    BPopover,
    LayerControlGroup: () => import('./LayerControlGroup.vue'),
    TeleportPopover
  },
  mixins: [
    ControlMixin,
    LayerControlMixin
  ],
  data() {
    return {
      id: null,
      baseLayers: [],
      visibleBaseLayer: null,
      layerGroup: null
    };
  },
  computed: {
    hasLayers() {
      return this.layerGroup && (this.layerGroup.getLayers().getLength() - this.baseLayers.length) > 0;
    }
  },
  watch: {
    map(map) {
      this.id = map.ol_uid;
    },
    visibleBaseLayer(newId, oldId) {
      if (oldId === null || oldId === newId) {
        return;
      }
      // todo: switching between base layers with different projections is not working yet
      let projection;
      for (const data of this.baseLayers) {
        data.layer.setVisible(data.id === newId);
        if (data.id === newId) {
          projection = data.layer.getSource().getProjection();
        }
      }
      const view = this.map.getView();
      const currentProjection = view.getProjection();
      if (currentProjection !== projection) {
        this.map.setView(new View({
          showFullExtent: true,
          projection,
          zoom: view.getZoom(),
          center: transformWithProjections(view.getCenter(), currentProjection, projection)
        }));
        this.reprojectLayers(this.map.getLayers(), currentProjection, projection);
      }
    }
  },
  methods: {
    reprojectLayers(layers, sourceProjection, targetProjection) {
      for (const layer of layers.getArray()) {
        if (layer.get('base')) {
          continue;
        }
        if (layer instanceof Group) {
          this.reprojectLayers(layer.getLayers(), sourceProjection, targetProjection);
          continue;
        }
        const source = layer.getSource();
        if (source instanceof Vector) {
          // Handle vector layers
          const currentProjection = source.getProjection() || sourceProjection;
          const features = source.getFeatures();
          for (const feature of features) {
            const geometry = feature.getGeometry();
            if (geometry) {
              geometry.transform(currentProjection, targetProjection);
            }
          }
          source.refresh();
        }
        // else: todo: Handle other layer types if needed
      }
    },
    update() {
      this.layerGroup = this.map.getLayerGroup();
      this.baseLayers = [];
      for (const layer of this.layerGroup.getLayers().getArray()) {
        if (!layer.get('base')) {
          continue;
        }
        const data = {
          layer: layer,
          id: layer.ol_uid,
          title: this.getTitle(layer)
        };
        this.baseLayers.push(data);
        if (layer.isVisible()) {
          this.visibleBaseLayer = data.id;
        }
      }
    }
  }
};
</script>

<style lang="scss" scoped>
.ol-layercontrol {
  z-index: 1;
  left: 0.5em;
  bottom: 0.5em;
}
.layercontrol {
  max-width: 300px;
  max-height: 500px;
  overflow: auto;
  margin-top: -0.5rem;
  margin-left: -0.75rem;
  margin-right: -0.75rem;
  padding: 0.5rem 0.75rem 0  0.75rem;

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
