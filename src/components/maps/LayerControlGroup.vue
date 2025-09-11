<template>
  <ul>
    <li v-for="l in layers" :key="l.id">
      <div class="d-flex justify-content-between">
        <b-form-checkbox inline :name="l.id" :checked="l.visible" @input="setVisibility(l, $event)">
          <span class="title">{{ l.title }}</span>
        </b-form-checkbox>
        <b-button variant="light" size="sm" :title="$t('mapping.fit')" @click.prevent.stop="fitToExtent(l)">
          <b-icon-zoom-in />
        </b-button>
      </div>
      <LayerControlGroup v-if="l.group > 1" :map="map" :group="l.layer" :maxZoom="maxZoom" />
    </li>
  </ul>
</template>

<script>
import LayerControlMixin from './LayerControlMixin';
import { BFormCheckbox, BIconZoomIn } from 'bootstrap-vue';
import LayerGroup from 'ol/layer/Group';
import { transformExtent } from 'ol/proj';

export default {
  name: 'LayerControlGroup',
  components: {
    LayerControlGroup: () => import('./LayerControlGroup.vue'),
    BFormCheckbox,
    BIconZoomIn
  },
  mixins: [
    LayerControlMixin
  ],
  props: {
    map: {
      type: Object,
      required: true
    },
    group: {
      type: Object,
      required: true
    },
    maxZoom: {
      type: Number,
      default: undefined
    }
  },
  computed: {
    layers() {
      const allLayers = this.group.getLayers().getArray();
      const layers = [];
      for (const layer of allLayers) {
        if (layer.get('base')) {
          // Skip base layers from top-level layer group
          continue;
        }
        const group = layer instanceof LayerGroup ? layer.getLayers().getLength() : 0;
        const data = {
          group,
          layer,
          id: layer.ol_uid,
          visible: layer.getVisible(),
          title: this.getTitle(layer)
        };
        layers.push(data);
      }
      return layers;
    },
    visibleLayers: {
      get() {
        return this.layers
          .filter(data => data.layer.getVisible())
          .map(data => data.id);
      },
      set(visibleLayers) {
        for (const data of this.layers) {
          const expected = visibleLayers.includes(data.id);
          const current = data.layer.getVisible();
          if (expected !== current) {
            data.layer.setVisible(expected);
          }
        }
      }
    }
  },
  methods: {
    setVisibility(data, visible) {
      data.layer.setVisible(visible);
      data.visible = visible;
    },
    fitToExtent(data) {
      if (!data.visible) {
        this.setVisibility(data, true);
      }
      let extent = data.layer.getExtent();
      let stac = data.layer.get('stac');
      if (stac) {
        let bbox = stac.getBoundingBox();
        if (!bbox) {
          stac = stac.getContext();
          if (stac) {
            bbox = stac.getBoundingBox();
          }
        }
        if (bbox) {
          extent = transformExtent(bbox, 'EPSG:4326', this.map.getView().getProjection());
        }
      }
      if (extent) {
        this.map.getView().fit(extent, { padding: [10,10,10,10], maxZoom: this.maxZoom });
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

  .title {
    line-break: anywhere;
  }

  ul {
    list-style: none;
    padding: 0.1rem 0;
    margin: 0;

    .btn-sm {
      padding: 0.1rem 0.5rem;
    }

    li {
      padding-top: 0.1rem;
      padding-bottom: 0.1rem;
    }

    li li {
      padding-left: 0.75rem;
    }
  }
}
h5 {
  font-weight: bold;
  font-size: 1em;
}
</style>
