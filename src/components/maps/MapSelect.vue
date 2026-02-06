<template>
  <div class="map-container">
    <div ref="map" class="map">
      <!-- this will be filled by OpenLayers -->
      <TextControl :text="help" :map="map" />
      <UserLocationControl :map="map" :maxZoom="maxZoom" />
      <LayerControl :map="map" :maxZoom="maxZoom" />
    </div>
  </div>
</template>

<script>
import MapMixin from './MapMixin.js';
import LayerControl from './LayerControl.vue';
import TextControl from './TextControl.vue';
import UserLocationControl from './UserLocationControl.vue';
import {shiftKeyOnly} from 'ol/events/condition.js';
import ExtentInteraction from 'ol/interaction/Extent';
import { containsXY } from 'ol/extent';
import { transformExtent } from 'ol/proj';
import Style, { createDefaultStyle } from 'ol/style/Style';
import VectorSource from 'ol/source/Vector';
import GeoJSON from 'ol/format/GeoJSON';
import Fill from 'ol/style/Fill';
import VectorLayer from 'ol/layer/Vector';
import { toGeoJSON } from 'stac-js/src/geo.js';
import mask from '@turf/mask';

export default {
  name: 'MapSelect',
  components: {
    LayerControl,
    TextControl,
    UserLocationControl
  },
  mixins: [
    MapMixin
  ],
  props: {
    stac: {
      type: Object,
      default: null
    },
    value: {
      type: Array,
      default: null
    }
  },
  data() {
    return {
      crs: 'EPSG:4326',
      extent: this.value,
      dragging: false
    };
  },
  computed: {
    projectedExtent() {
      if (this.extent) {
        return transformExtent(this.extent, this.crs, this.map.getView().getProjection());
      }
      return null;
    },
    help() {
      return this.extent ? this.$t('mapping.bboxSelect.remove') : this.$t('mapping.bboxSelect.add');
    }
  },
  watch: {
    async stac() {
      await this.initMap();
    }
  },
  created() {
    // This recreates the component so that it picks up the new translations
    this.$root.$on('uiLanguageChanged', () => {
      // todo: update the language resources
    });
  },
  async mounted() {
    await this.initMap();
  },
  methods: {
    async initMap() {
      this.map = null;

      await this.createMap(this.$refs.map, this.stac, true);

      // Add extent interaction for bbox selection
      const condition = (event) => {
        if (event.type === 'singleclick') {
          if (!this.extent) {
            let pixelSize = this.map.getSize().map(xy => xy * 0.2);
            let extent = this.map.getView().calculateExtent(pixelSize);
            let size = [
              extent[2] - extent[0],
              extent[3] - extent[1]
            ];
            let mouseExtent = [
              event.coordinate[0] - size[0],
              event.coordinate[1] - size[1],
              event.coordinate[0] + size[0],
              event.coordinate[1] + size[1],
            ];
            this.interaction.setExtent(mouseExtent);
            return false;
          }
          else if (containsXY(this.projectedExtent, ...event.coordinate)) {
            this.interaction.setExtent(null);
            this.interaction.vertexOverlay_.getSource().clear();
            this.interaction.vertexFeature_ = null;
          }
        }
        else if (this.interaction.handlingDownUpSequence || this.interaction.snapToVertex_(event.pixel, event.map)) {
          return true;
        }
        return shiftKeyOnly(event);
      };
      this.interaction = new ExtentInteraction({
        extent: this.projectedExtent,
        condition,
        boxStyle: createDefaultStyle()
      });
      this.interaction.on('extentchanged', this.update);
      this.map.addInteraction(this.interaction);
  
      if (this.stac) {
        this.addMask(this.stac);
      }

      let extent;
      if (this.projectedExtent) {
        extent = this.projectedExtent;
      }
      else if (this.stac) {
        const bbox = this.stac.getBoundingBox();
        if (bbox) {
          extent = transformExtent(bbox, this.crs, this.map.getView().getProjection());
        }
      }
      if (extent) {
        this.map.getView().fit(extent, { padding: [50,50,50,50], maxZoom: this.maxZoom });
      }
    },
    addMask(stac) {
      // Darken areas outside of the available area
      if (!stac || typeof stac.toGeoJSON !== 'function') {
        return;
      }

      const geojson = stac.toGeoJSON();
      if (!geojson) {
        return;
      }

      // Create a mask for the available area
      const world = toGeoJSON([-180, -90, 180, 90]);
      const masked = mask(geojson, world);

      // Parse the GeoJSON
      const features = new GeoJSON().readFeatures(masked, {
        featureProjection: this.map.getView().getProjection(),
      });

      /// Add the mask layer, make it half-transparent
      const maskLayer = new VectorLayer({
        source: new VectorSource({ features }),
        style: new Style({
          fill: new Fill({
            color: 'rgba(0, 0, 0, 0.5)',
          }),
        }),
      });
      this.map.addLayer(maskLayer);
    },
    fixX(x) {
      return (x + 180) % 360 - 180;
    },
    fixY(y) {
      return Math.max(-90, Math.min(90, y));
    },
    update(event) {
      if (event.extent) {
        this.extent = transformExtent(event.extent, this.map.getView().getProjection(), this.crs);
        const extent = [
          this.fixX(this.extent[0]),
          this.fixY(this.extent[1]),
          this.fixX(this.extent[2]),
          this.fixY(this.extent[3])
        ];
        this.$emit('input', extent);
      }
      else {
        this.extent = null;
        this.$emit('input', null);
      }
    }
  }
};
</script>

<style lang="scss">
@import "../../../node_modules/ol/ol.css";
</style>
