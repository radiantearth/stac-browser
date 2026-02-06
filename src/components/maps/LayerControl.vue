<template>
  <div class="ol-layercontrol ol-unselectable ol-control" style="pointer-events: auto;">
    <button :id="id"><b-icon-layers-fill /></button>
    <b-popover
      v-if="id" placement="top" triggers="click" @show="update"
      :target="id" container="#stac-browser"
    >
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
          <LayerControlGroup :map="map" :group="layerGroup" :maxZoom="maxZoom" />
        </section>
      </div>
    </b-popover>
  </div>
</template>

<script>
import ControlMixin from './ControlMixin';
import LayerControlMixin from './LayerControlMixin';
import { BFormRadio, BFormRadioGroup, BIconLayersFill, BPopover } from 'bootstrap-vue';
import Group from 'ol/layer/Group';
import MapUtils from './mapUtils';

export default {
  name: 'LayerControl',
  components: {
    BFormRadioGroup,
    BFormRadio,
    BIconLayersFill,
    BPopover,
    LayerControlGroup: () => import('./LayerControlGroup.vue')
  },
  mixins: [
    ControlMixin,
    LayerControlMixin
  ],
  props: {
    maxZoom: {
      type: Number,
      default: undefined
    }
  },
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
      let projection;
      for (const data of this.baseLayers) {
        data.layer.setVisible(data.id === newId);
        if (data.id === newId) {
          if (data.layer instanceof Group) {
            const layerWithProjection = data.layer.getLayers().getArray()
              .map(layer => layer.getSource().getProjection())
              .filter(projection => Boolean(projection));
            projection = layerWithProjection.length > 0 ? layerWithProjection[0] : null;
          }
          else {
            projection = data.layer.getSource().getProjection();
          }
        }
      }
      if (projection) {
        MapUtils.reproject(this.map, projection);
      }
    }
  },
  methods: {
    update() {
      this.layerGroup = this.map.getLayerGroup();
      this.baseLayers = [];
      for (const layer of this.layerGroup.getLayers().getArray()) {
        if (!layer.get('base')) {
          continue;
        }
        const data = {
          layer,
          id: layer.ol_uid,
          title: this.getTitle(layer)
        };
        this.baseLayers.push(data);
        if (MapUtils.isLayerVisible(layer)) {
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
