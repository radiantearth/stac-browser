<template>
  <div class="map-container">
    <div ref="map" class="map">
      <!-- this will be filled by OpenLayers -->
      <TextControl :text="help" :map="map" />
      <UserLocationControl :map="map" :maxZoom="maxZoom" />
      <LayerControl :map="map" :maxZoom="maxZoom" />
    </div>
    <div class="bbox-controls">
      <div class="bbox-inputs">
        <div class="input-row">
          <label>
            {{ $t('mapping.bboxSelect.minLon') }}
            <input 
              v-model.number="bboxValues.minLon" 
              type="number" 
              step="0.0001"
              min="-180"
              max="180"
              class="coord-input"
            >
          </label>
          <label>
            {{ $t('mapping.bboxSelect.minLat') }}
            <input 
              v-model.number="bboxValues.minLat" 
              type="number" 
              step="0.0001"
              min="-90"
              max="90"
              class="coord-input"
            >
          </label>
        </div>
        <div class="input-row">
          <label>
            {{ $t('mapping.bboxSelect.maxLon') }}
            <input 
              v-model.number="bboxValues.maxLon" 
              type="number" 
              step="0.0001"
              min="-180"
              max="180"
              class="coord-input"
            >
          </label>
          <label>
            {{ $t('mapping.bboxSelect.maxLat') }}
            <input 
              v-model.number="bboxValues.maxLat" 
              type="number" 
              step="0.0001"
              min="-90"
              max="90"
              class="coord-input"
            >
          </label>
        </div>
        <button @click="applyManualBbox" class="apply-button">
          {{ $t('mapping.bboxSelect.apply') }}
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { mapState } from 'vuex';
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
    modelValue: {
      type: Array,
      default: null
    },
    value: {
      type: Array,
      default: null
    }
  },
  emits: ['input', 'update:modelValue'],
  data() {
    return {
      crs: 'EPSG:4326',
      extent: this.modelValue || this.value,
      dragging: false,
      bboxValues: {
        minLon: null,
        minLat: null,
        maxLon: null,
        maxLat: null
      }
    };
  },
  computed: {
    ...mapState(['uiLanguage']),
    projectedExtent() {
      if (this.extent && this.map) {
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
    },
    uiLanguage() {
      
    },
    modelValue(newVal) {
      if (newVal && Array.isArray(newVal) && newVal.length === 4) {
        this.extent = newVal;
        this.updateBboxValues();
      }
      else if (newVal === null) {
        this.extent = null;
        this.clearBboxValues();
      }
    },
    value(newVal) {
      if (newVal && Array.isArray(newVal) && newVal.length === 4) {
        this.extent = newVal;
        this.updateBboxValues();
      }
      else if (newVal === null) {
        this.extent = null;
        this.clearBboxValues();
      }
    }
  },
  async mounted() {
    try {
      await this.initMap();
      this.updateBboxValues();
    } catch (error) {
      console.error('Error initializing map:', error);
    }
  },
  methods: {
    async initMap() {
      try {
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
      } catch (error) {
        console.error('Error in initMap:', error);
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
        this.emitExtent(extent);
        this.updateBboxValues();
      }
      else {
        this.extent = null;
        this.emitExtent(null);
        this.clearBboxValues();
      }
    },
    emitExtent(extent) {
      this.$emit('input', extent);
      this.$emit('update:modelValue', extent);
    },
    updateBboxValues() {
      if (this.extent && Array.isArray(this.extent) && this.extent.length === 4) {
        this.bboxValues = {
          minLon: Math.round(this.extent[0] * 10000) / 10000,
          minLat: Math.round(this.extent[1] * 10000) / 10000,
          maxLon: Math.round(this.extent[2] * 10000) / 10000,
          maxLat: Math.round(this.extent[3] * 10000) / 10000
        };
      }
    },
    clearBboxValues() {
      this.bboxValues = {
        minLon: null,
        minLat: null,
        maxLon: null,
        maxLat: null
      };
    },
    validateBbox() {
      const { minLon, minLat, maxLon, maxLat } = this.bboxValues;
      
      // Check all values are present
      if (minLon === null || minLat === null || maxLon === null || maxLat === null) {
        return this.$t('mapping.bboxSelect.error.incomplete');
      }
      
      // Check longitude values
      if (minLon < -180 || minLon > 180 || maxLon < -180 || maxLon > 180) {
        return this.$t('mapping.bboxSelect.error.invalidLon');
      }
      
      // Check latitude values
      if (minLat < -90 || minLat > 90 || maxLat < -90 || maxLat > 90) {
        return this.$t('mapping.bboxSelect.error.invalidLat');
      }
      
      // Check min < max
      if (minLon >= maxLon) {
        return this.$t('mapping.bboxSelect.error.lonOrder');
      }
      
      if (minLat >= maxLat) {
        return this.$t('mapping.bboxSelect.error.latOrder');
      }
      
      return null;
    },
    applyManualBbox() {
      const validationError = this.validateBbox();
      if (validationError) {
        alert(validationError);
        return;
      }
      
      if (!this.map || !this.interaction) {
        return;
      }
      
      const extent = [
        this.bboxValues.minLon,
        this.bboxValues.minLat,
        this.bboxValues.maxLon,
        this.bboxValues.maxLat
      ];
      
      this.extent = extent;
      this.emitExtent(extent);
      
      // Update map to show the extent
      const projectedExtent = transformExtent(extent, this.crs, this.map.getView().getProjection());
      this.map.getView().fit(projectedExtent, { padding: [50,50,50,50], maxZoom: this.maxZoom });
      
      // Update the interaction to show the extent on the map
      this.interaction.setExtent(projectedExtent);
    }
  }
};
</script>

<style lang="scss">
@import "ol/ol.css";
@import "../../theme/variables.scss";

.map-container {
  display: flex;
  flex-direction: column;
  width: 100%;
  min-height: 400px;
}

.map {
  flex: 1 1 auto;
  position: relative;
  width: 100%;
  min-height: 400px;
}

.bbox-controls {
  padding: $block-margin;
  background-color: $light;
  border-top: 1px solid darken($light, 10%);
}

.bbox-inputs {
  display: flex;
  flex-direction: column;
  gap: $block-margin;
}

.input-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: $block-margin;
}

.input-row label {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  font-size: 0.875rem;
}

.coord-input {
  padding: 0.5rem;
  border: 1px solid darken($light, 20%);
  border-radius: $border-radius;
  font-size: $font-size-base;
  
  &:focus {
    outline: none;
    border-color: $primary;
    box-shadow: 0 0 0 2px rgba($primary, 0.1);
  }
}

.apply-button {
  padding: 0.5rem 1rem;
  background-color: $primary;
  color: white;
  border: none;
  border-radius: $border-radius;
  cursor: pointer;
  font-size: $font-size-base;
  font-weight: 500;
  
  &:hover {
    background-color: darken($primary, 10%);
  }
  
  &:active {
    background-color: darken($primary, 15%);
  }
}
</style>
