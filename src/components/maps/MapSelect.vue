<template>
  <div class="map-container">
    <div ref="map" class="map">
      <!-- this will be filled by OpenLayers -->
      <TextControl :text="help" :map="map" />
      <UserLocationControl :map="map" :maxZoom="maxZoom" />
      <LayerControl :map="map" :maxZoom="maxZoom" />
    </div>
    <div class="bbox-controls">
      <div class="compass-grid">
        <!-- Max Latitude (top center) -->
        <b-form-group 
          :label="$t('mapping.bboxSelect.maxLat')" 
          label-for="maxLat" 
          class="compass-input compass-top"
          :state="validationErrors.maxLat ? false : null"
        >
          <b-form-input
            id="maxLat"
            v-model.number="bboxValues.maxLat"
            type="number"
            step="0.0001"
            min="-90"
            max="90"
            :state="validationErrors.maxLat ? false : null"
            @focus="validationErrors.maxLat = null"
            @blur="applyManualBbox"
            @keyup.enter.stop="applyManualBbox"
          />
          <b-form-invalid-feedback :state="validationErrors.maxLat ? false : null" class="text-danger">
            {{ validationErrors.maxLat }}
          </b-form-invalid-feedback>
        </b-form-group>

        <!-- Min Longitude (left center) -->
        <b-form-group 
          :label="$t('mapping.bboxSelect.minLon')" 
          label-for="minLon" 
          class="compass-input compass-left"
          :state="validationErrors.minLon ? false : null"
        >
          <b-form-input
            id="minLon"
            v-model.number="bboxValues.minLon"
            type="number"
            step="0.0001"
            :state="validationErrors.minLon ? false : null"
            @focus="validationErrors.minLon = null"
            @blur="applyManualBbox"
            @keyup.enter.stop="applyManualBbox"
          />
          <b-form-invalid-feedback :state="validationErrors.minLon ? false : null" class="text-danger">
            {{ validationErrors.minLon }}
          </b-form-invalid-feedback>
        </b-form-group>

        <!-- Max Longitude (right center) -->
        <b-form-group 
          :label="$t('mapping.bboxSelect.maxLon')" 
          label-for="maxLon" 
          class="compass-input compass-right"
          :state="validationErrors.maxLon ? false : null"
        >
          <b-form-input
            id="maxLon"
            v-model.number="bboxValues.maxLon"
            type="number"
            step="0.0001"
            :state="validationErrors.maxLon ? false : null"
            @focus="validationErrors.maxLon = null"
            @blur="applyManualBbox"
            @keyup.enter.stop="applyManualBbox"
          />
          <b-form-invalid-feedback :state="validationErrors.maxLon ? false : null" class="text-danger">
            {{ validationErrors.maxLon }}
          </b-form-invalid-feedback>
        </b-form-group>

        <!-- Min Latitude (bottom center) -->
        <b-form-group 
          :label="$t('mapping.bboxSelect.minLat')" 
          label-for="minLat" 
          class="compass-input compass-bottom"
          :state="validationErrors.minLat ? false : null"
        >
          <b-form-input
            id="minLat"
            v-model.number="bboxValues.minLat"
            type="number"
            step="0.0001"
            min="-90"
            max="90"
            :state="validationErrors.minLat ? false : null"
            @focus="validationErrors.minLat = null"
            @blur="applyManualBbox"
            @keyup.enter.stop="applyManualBbox"
          />
          <b-form-invalid-feedback :state="validationErrors.minLat ? false : null" class="text-danger">
            {{ validationErrors.minLat }}
          </b-form-invalid-feedback>
        </b-form-group>
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
    }
  },
  emits: ['update:modelValue'],
  data() {
    return {
      crs: 'EPSG:4326',
      extent: this.modelValue,
      dragging: false,
      applyingManually: false,
      validationErrors: {
        minLon: null,
        minLat: null,
        maxLon: null,
        maxLat: null
      },
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
    },
    uiLanguage() {
      
    }
  },
  async mounted() {
    await this.initMap();
    this.updateBboxValues();
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
      // Normalize longitude to -180 to 180 range
      // For antimeridian crossing, minLon can be > maxLon
      while (x > 180) x -= 360;
      while (x < -180) x += 360;
      return x;
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
        // Only emit to parent if not manually applying
        // Manual apply just updates the visual representation
        if (!this.applyingManually) {
          this.$emit('update:modelValue', extent);
        }
        this.updateBboxValues();
      }
      else {
        this.extent = null;
        if (!this.applyingManually) {
          this.$emit('update:modelValue', null);
        }
        this.clearBboxValues();
      }
    },
    updateBboxValues() {
      if (this.extent && Array.isArray(this.extent) && this.extent.length === 4) {
        this.bboxValues = {
          minLon: Math.round(this.fixX(this.extent[0]) * 10000) / 10000,
          minLat: Math.round(this.fixY(this.extent[1]) * 10000) / 10000,
          maxLon: Math.round(this.fixX(this.extent[2]) * 10000) / 10000,
          maxLat: Math.round(this.fixY(this.extent[3]) * 10000) / 10000
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
      const errors = {
        minLon: null,
        minLat: null,
        maxLon: null,
        maxLat: null
      };
      const incompleteMsg = this.$t('mapping.bboxSelect.error.incomplete');
      
      // Check all values are present - show error on fields that are empty
      if (minLon === null) {
        errors.minLon = incompleteMsg;
      }
      if (minLat === null) {
        errors.minLat = incompleteMsg;
      }
      if (maxLon === null) {
        errors.maxLon = incompleteMsg;
      }
      if (maxLat === null) {
        errors.maxLat = incompleteMsg;
      }
      
      // If any incomplete, return early
      if (Object.values(errors).some(err => err !== null)) {
        return errors;
      }
      
      // Check longitude values are in valid range (-180 to 180)
      // Per STAC spec, minLon can be > maxLon for antimeridian crossing
      if (minLon < -180 || minLon > 180) {
        errors.minLon = this.$t('mapping.bboxSelect.error.invalidLon');
      }
      if (maxLon < -180 || maxLon > 180) {
        errors.maxLon = this.$t('mapping.bboxSelect.error.invalidLon');
      }
      
      // Check latitude values (must be between -90 and 90)
      if (minLat < -90 || minLat > 90) {
        errors.minLat = this.$t('mapping.bboxSelect.error.invalidLat');
      }
      if (maxLat < -90 || maxLat > 90) {
        errors.maxLat = this.$t('mapping.bboxSelect.error.invalidLat');
      }
      
      // Check latitude order (minLat must be < maxLat)
      if (minLat >= maxLat) {
        errors.minLat = this.$t('mapping.bboxSelect.error.latOrder');
      }
      
      // Return errors object if any errors exist
      if (Object.values(errors).some(err => err !== null)) {
        return errors;
      }
      
      return null;
    },
    applyManualBbox() {
      const errors = this.validateBbox();
      if (errors) {
        this.validationErrors = errors;
        return;
      }
      
      // Clear any previous errors
      this.validationErrors = {
        minLon: null,
        minLat: null,
        maxLon: null,
        maxLat: null
      };
      
      if (!this.map || !this.interaction) {
        return;
      }
      
      const extent = [
        this.bboxValues.minLon,
        this.bboxValues.minLat,
        this.bboxValues.maxLon,
        this.bboxValues.maxLat
      ];
      
      // Update local state and emit to parent directly
      this.extent = extent;
      this.$emit('update:modelValue', extent);
      
      // Update map to show the extent
      const projectedExtent = transformExtent(extent, this.crs, this.map.getView().getProjection());
      this.map.getView().fit(projectedExtent, { padding: [50,50,50,50], maxZoom: this.maxZoom });
      
      // Set flag to prevent duplicate emission from map interaction
      this.applyingManually = true;
      
      // Update the interaction to show the extent on the map
      this.interaction.setExtent(projectedExtent);
      
      // Reset flag after interaction completes
      setTimeout(() => {
        this.applyingManually = false;
      }, 100);
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
  padding: $block-margin 0;
  background-color: $light;
  border-top: 1px solid darken($light, 10%);
}

.bbox-inputs {
  margin-bottom: 0;
}

.compass-grid {
  display: grid;
  grid-template-columns: 160px 160px 160px;
  grid-template-rows: auto auto auto auto;
  gap: 0.25rem;
  align-items: start;
  justify-items: center;
  width: fit-content;
  margin: 0.25rem auto ;
}

.compass-input {
  margin-bottom: 0;
  width: 100%;
  font-size: 0.875rem;

  label {
    margin-bottom: 0.125rem;
    font-size: 0.75rem;
  }

  input {
    font-size: 0.875rem;
    padding: 0.25rem 0.5rem;
    height: auto;
  }

  .invalid-feedback {
    font-size: 0.7rem;
    margin-top: 0.125rem;
  }

  &.compass-top {
    grid-column: 2;
    grid-row: 1;
    margin-bottom: -1.2rem;
  }

  &.compass-left {
    grid-column: 1;
    grid-row: 2;
    text-align: left;
    justify-self: start;
    margin-left: -0.25rem;
  }

  &.compass-right {
    grid-column: 3;
    grid-row: 2;
    text-align: right;
    justify-self: end;
    margin-right: -0.25rem;
  }

  &.compass-bottom {
    grid-column: 2;
    grid-row: 3;
    margin-top: -1.2rem;
  }
}

.input-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: $block-margin;
  margin-bottom: $block-margin;

  .input-col {
    margin-bottom: 0;
  }
}
</style>
