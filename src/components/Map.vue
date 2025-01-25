<template>
  <div class="map-container">
    <div ref="map" class="map">
      <!-- this will be filled by OpenLayers -->
      <LayerControl :map="map" />
      <TextControl v-if="empty" :map="map" :text="$t('mapping.nodata')" />
      <TextControl v-else-if="!hasBasemap" :map="map" :text="$t('mapping.nobasemap')" />
    </div>
    <b-popover
      v-if="popover && selectedItems" show placement="left" triggers="manual"
      :target="selectedItems.target" container="#stac-browser" :key="selectedItems.key"
    >
      <section class="popover-items">
        <Items :stac="stac" :items="selectedItems.items" />
      </section>
      <div class="text-center">
        <b-button target="_blank" variant="danger" @click="resetSelectedItems">{{ $t('mapping.close') }}</b-button>
      </div>
    </b-popover>
  </div>
</template>

<script>
import MapMixin from './maps/MapMixin.js';
import LayerControl from './maps/LayerControl.vue';
import TextControl from './maps/TextControl.vue';
import { mapGetters } from 'vuex';
import { BPopover } from 'bootstrap-vue';
import proj4 from 'proj4';
import {register} from 'ol/proj/proj4.js';
import StacLayer from 'ol-stac';
import { getStacObjectsForEvent } from 'ol-stac/util.js';

register(proj4); // required to support source reprojection

export default {
  name: 'Map',
  components: {
    BPopover,
    Items: () => import('../components/Items.vue'),
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
    noscroll: {
      type: Boolean,
      default: false
    },
    popover: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      stacLayer: null,
      selectedItems: null,
      empty: false
    };
  },
  computed: {
    ...mapGetters(['getStac'])
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
      await this.stacLayer.setAssets(null);
      await this.stacLayer.setChildren(this.items, {displayPreview: true});
    },
    empty(empty) {
      if (empty) {
        this.$emit('empty');
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

      await this.createMap(this.$refs.map, this.stac);

      if (this.stac) {
        await this.addStacLayer();
      }

      if (this.noscroll) {
        this.disableMouseWheelZoom();
      }
    },
    async addStacLayer() {
      let options = Object.assign({}, this.stacLayerOptions, {
        url: this.stac.getAbsoluteUrl(),
        data: this.stac,
        children: this.items,
        assets: this.assets || null,
        displayWebMapLink: true,
        displayPreview: !this.items,
        disableMigration: true,
      });
      this.stacLayer = new StacLayer(options);
      console.log(this.stacLayer.getData().getBoundingBoxes());
      console.log(JSON.stringify(this.stacLayer.getData().toGeoJSON()));
      this.stacLayer.on('error', error => {
        console.warn(error);
        this.fit();
      });
      this.stacLayer.on('sourceready', this.fit);
      this.stacLayer.on('layersready', () => {
        this.empty = this.stacLayer.isEmpty();
        this.$emit('assets', this.stacLayer.getAssets());
      });
      this.map.addLayer(this.stacLayer);

      if (this.popover) {
        this.map.on('singleclick', async (event) => {
          const objects = await getStacObjectsForEvent(event, this.stacLayer.getData());
          if (objects.length > 0) {
            this.selectedItems = {
              target: event.originalEvent.srcElement || event.originalEvent.target,
              key: event.map.ol_uid,
              // Map from stac-js object back to STAC Browser STAC class
              items: objects.map(obj => this.getStac(obj.getAbsoluteUrl()))
            };
          }
          else {
            this.selectedItems = null;
          }
        });
      }
    },
    fit() {
      let extent = this.stacLayer.getExtent();
      if (extent) {
        // Update the sizes, otherwise the fit will not work properly and compute a wrong zoom level
        this.map.updateSize();
        this.map.getView().fit(extent, { padding: [100,150,100,150] });
      }
    },
    resetSelectedItems() {
      this.selectedItems = null;
    }
  }
};
</script>

<style lang="scss">
@import "../../node_modules/ol/ol.css";

#stac-browser .popover-items {
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
</style>
