<template>
  <ul>
    <li v-for="l in layers" :key="l.id">
      <div class="d-flex justify-content-between align-items-start gap-2">
        <b-form-checkbox class="layer-title" inline :name="l.id" :model-value="l.visible" @update:model-value="setVisibility(l, $event)">
          <span class="title">{{ l.title }}</span>
        </b-form-checkbox>
        <b-button-group size="sm" class="flex-shrink-0">
          <template v-if="l.dataSource && mapSelection">
            <b-button variant="primary" :disabled="l.top" :title="$t('mapping.layers.moveUp')" @click.prevent.stop="move(l, 1)">
              <b-icon-arrow-up />
            </b-button>
            <b-button variant="primary" :disabled="l.bottom" :title="$t('mapping.layers.moveDown')" @click.prevent.stop="move(l, -1)">
              <b-icon-arrow-down />
            </b-button>
            <b-button variant="primary" :title="$t('assets.hideFromMap')" @click.prevent.stop="mapSelection.hide(l.dataSource)">
              <b-icon-x-lg />
            </b-button>
          </template>
          <b-button variant="primary" :title="$t('mapping.fit')" @click.prevent.stop="fitToExtent(l)">
            <b-icon-zoom-in />
          </b-button>
        </b-button-group>
      </div>
      <LayerControlGroup v-if="l.expand" :map="map" :group="l.layer" :maxZoom="maxZoom" />
    </li>
  </ul>
</template>

<script>
import { defineAsyncComponent } from 'vue';
import LayerControlMixin from './LayerControlMixin';
import LayerGroup from 'ol/layer/Group';
import { unByKey } from 'ol/Observable';
import { toOlExtent } from 'ol-stac/util.js';

export default {
  name: 'LayerControlGroup',
  components: {
    LayerControlGroup: defineAsyncComponent(() => import('./LayerControlGroup.vue')),
  },
  mixins: [
    LayerControlMixin
  ],
  inject: {
    mapSelection: { default: null },
    layerVisibilityChanged: { default: null }
  },
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
  data() {
    return {
      revision: 0
    };
  },
  computed: {
    layers() {
      // OpenLayers collections are not reactive
      this.revision;  
      // List the layers that are rendered on top first
      const allLayers = this.group.getLayers().getArray()
        .map((layer, position) => ({ layer, position }))
        .sort((a, b) => ((b.layer.getZIndex() || 0) - (a.layer.getZIndex() || 0)) || (b.position - a.position))
        .map(({ layer }) => layer);
      const layers = [];
      for (const layer of allLayers) {
        if (layer.get('base')) {
          // Skip base layers from top-level layer group
          continue;
        }
        const group = layer instanceof LayerGroup ? layer.getLayers().getLength() : 0;
        const data = {
          // A single layer is only listed separately if it can be managed
          expand: group > 1 || (group === 1 && Boolean(this.getDataSource(layer.getLayers().item(0)))),
          layer,
          id: layer.ol_uid,
          visible: layer.getVisible(),
          title: this.getTitle(layer),
          dataSource: this.getDataSource(layer)
        };
        layers.push(data);
      }
      const dataSources = layers.filter(data => data.dataSource);
      if (dataSources.length > 0) {
        dataSources[0].top = true;
        dataSources[dataSources.length - 1].bottom = true;
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
  created() {
    this.listenerKeys = this.group.getLayers().on(['add', 'remove'], () => this.revision++);
  },
  beforeUnmount() {
    unByKey(this.listenerKeys);
  },
  methods: {
    getDataSource(layer) {
      const stac = layer.get('stac');
      if ((stac?.isAsset || stac?.isLink) && this.mapSelection?.canManage(stac)) {
        return stac;
      }
      return null;
    },
    move(data, offset) {
      this.mapSelection.move(data.dataSource, offset);
    },
    setVisibility(data, visible) {
      data.layer.setVisible(visible);
      data.visible = visible;
      if (this.layerVisibilityChanged) {
        this.layerVisibilityChanged();
      }
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
          extent = toOlExtent(bbox, this.map.getView().getProjection());
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

  .layer-title {
    min-width: 0;
  }

  .title {
    overflow-wrap: anywhere;
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
