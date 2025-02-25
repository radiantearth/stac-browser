<template>
  <div class="map-container">
    <div ref="map" class="map">
      <!-- this will be filled by OpenLayers -->
      <LayerControl :map="map" />
      <TextControl v-if="empty" :map="map" :text="$t('mapping.nodata')" />
      <TextControl v-else-if="!hasBasemap" :map="map" :text="$t('mapping.nobasemap')" />
    </div>
    <div ref="target" class="popover-target" />
    <b-popover
      v-if="popover && selectedItems" show placement="left" triggers="manual"
      :target="selectedItems.target" container="#stac-browser"
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
import Select from 'ol/interaction/Select';
import {register} from 'ol/proj/proj4.js';
import StacLayer from 'ol-stac';
import { getStacObjectsForEvent, getStyle } from 'ol-stac/util.js';

register(proj4); // required to support source reprojection

const selectStyle = getStyle('#ff0000', 2, null);

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
    onfocusOnly: {
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
      empty: false,
      selector: null
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
      this.fit();
    },
    empty(empty) {
      if (empty) {
        this.$emit('empty');
      }
    },
    selectedItems(selectedItems) {
      if (!selectedItems && this.selector) {
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
        url: this.stac.getAbsoluteUrl(),
        data: this.stac,
        children: this.items,
        assets: this.assets || null,
        displayWebMapLink: true,
        displayPreview: !this.items,
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
        this.$emit('assets', this.stacLayer.getAssets());
      });
      this.map.addLayer(this.stacLayer);

      if (this.popover) {
        this.selector = new Select({
          toggleCondition: () => false, // Only add features manually
          condition: () => false, // Only add features manually
          style: selectStyle
        });
        this.map.addInteraction(this.selector);
        this.map.on('singleclick', async (event) => {
          // The event doesn't contain a target element for the popover to attach to.
          // Thus we move a hidden target element to the click position and attach the popover to it.
          // See also https://github.com/bootstrap-vue/bootstrap-vue/issues/5285
          this.$refs.target.style.left = event.pixel[0] + 'px';
          this.$refs.target.style.top = event.pixel[1] + 'px';

          this.selector.getFeatures().clear();
          const features = this.selector.getFeatures();
          const container = this.stacLayer.getData();
          const objects = await getStacObjectsForEvent(event, container, features, 5);
          if (objects.length > 0) {
            this.selectedItems = {
              target: this.$refs.target,
              // Map from stac-js object back to STAC Browser STAC class
              items: objects.map(obj => this.getStac(obj.getAbsoluteUrl()))
            };
          }
          else {
            this.selectedItems = null;
          }
        });
        this.map.on('change', () => this.selectedItems = null);
        this.map.on('movestart', () => this.selectedItems = null);
      }
    },
    fit() {
      let extent = this.stacLayer.getExtent();
      if (extent) {
        // Update the sizes, otherwise the fit will not work properly and compute a wrong zoom level
        this.map.updateSize();
        this.map.getView().fit(extent, { padding: [50,50,50,50] });
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

#stac-browser {
  .popover-target {
    width: 1px;
    height: 1px;
    opacity: 0;
    position: absolute;
    top: -1px;
    left: -1px;
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
