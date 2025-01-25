<template>
  <div class="ol-layercontrol ol-unselectable ol-control" style="pointer-events: auto;">
    <button :id="id"><b-icon-layers-fill /></button>
    <b-popover
      v-if="id" placement="top" triggers="click" @show="update"
      :target="id" container="#stac-browser"
    >
      <div class="layercontrol">
        <section v-if="hasLayers">
          <h5>{{ $t('mapping.layers.title') }}</h5>
          <LayerControlGroup :map="map" :group="layerGroup" />
        </section>
        <section>
          <h5>{{ $t('mapping.layers.base') }}</h5>
          <span v-if="baseLayers.length === 0">{{ $t('mapping.nobasemap') }}</span>
          <b-form-radio-group v-else v-model="visibleBaseLayer">
            <b-form-radio v-for="layer in baseLayers" :key="layer.id" :value="layer.id">
              {{ layer.title }}
            </b-form-radio>
          </b-form-radio-group>
        </section>
      </div>
    </b-popover>
  </div>
</template>

<script>
//import View from 'ol/View';
import ControlMixin from './ControlMixin';
import LayerControlMixin from './LayerControlMixin';
import { BFormRadio, BFormRadioGroup, BIconLayersFill, BPopover } from 'bootstrap-vue';
//import { transformWithProjections } from 'ol/proj';

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
      //let projection;
      for (const data of this.baseLayers) {
        data.layer.setVisible(data.id === newId);
        //projection = data.layer.getSource().getProjection();
      }
      // const view = this.map.getView();
      // if (view.getProjection() !== projection) {
      //   this.map.setView(new View({
      //     showFullExtent: true,
      //     projection,
      //     zoom: view.getZoom(),
      //     center: transformWithProjections(view.getCenter(), view.getProjection(), projection)
      //   }));
      // }
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
