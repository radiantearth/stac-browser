<template>
  <div class="map-container">
    <div ref="map" class="map">
      <!-- this will be filled by OpenLayers -->
      <TextControl :text="help" :map="map" />
      <UserLocationControl :map="map" :maxZoom="maxZoom" />
      <LayerControl :map="map" :maxZoom="maxZoom" />
    </div>
    <div class="bbox-controls">
      <b-form class="compass-grid" @change="applyManualBbox" @submit.prevent="applyManualBbox">
        <!-- North Latitude (top center) -->
        <b-form-group 
          :label="$t('mapping.bboxSelect.northLat')" 
          label-for="northLat" 
          class="compass-input compass-top"
          :state="validationErrors.northLat ? false : null"
        >
          <b-form-input
            id="northLat"
            v-model.number="bboxValues.northLat" lazy
            type="number" step="any" min="-90" max="90"
          />
        </b-form-group>
        <b-form-invalid-feedback :state="validationErrors.northLat ? false : null" class="validation error-top text-danger">
          {{ validationErrors.northLat }}
        </b-form-invalid-feedback>

        <!-- West Longitude (left center) -->
        <b-form-group 
          :label="$t('mapping.bboxSelect.westLon')" 
          label-for="westLon" 
          class="compass-input compass-left"
          :state="validationErrors.westLon ? false : null"
        >
          <b-form-input
            id="westLon"
            v-model.number="bboxValues.westLon" lazy
            type="number" step="any"
          />
        </b-form-group>
        <b-form-invalid-feedback :state="validationErrors.westLon ? false : null" class="validation error-left text-danger">
          {{ validationErrors.westLon }}
        </b-form-invalid-feedback>

        <!-- East Longitude (right center) -->
        <b-form-group 
          :label="$t('mapping.bboxSelect.eastLon')" 
          label-for="eastLon" 
          class="compass-input compass-right"
          :state="validationErrors.eastLon ? false : null"
        >
          <b-form-input
            id="eastLon"
            v-model.number="bboxValues.eastLon" lazy
            type="number" step="any"
          />
        </b-form-group>
        <b-form-invalid-feedback :state="validationErrors.eastLon ? false : null" class="validation error-right text-danger">
          {{ validationErrors.eastLon }}
        </b-form-invalid-feedback>

        <!-- South Latitude (bottom center) -->
        <b-form-group 
          :label="$t('mapping.bboxSelect.southLat')" 
          label-for="southLat" 
          class="compass-input compass-bottom"
          :state="validationErrors.southLat ? false : null"
        >
          <b-form-input
            id="southLat"
            v-model.number="bboxValues.southLat" lazy
            type="number" step="any" min="-90" max="90"
          />
        </b-form-group>
        <b-form-invalid-feedback :state="validationErrors.southLat ? false : null" class="validation error-bottom text-danger">
          {{ validationErrors.southLat }}
        </b-form-invalid-feedback>
      </b-form>
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

function getBoxDefaults() {
  return {
    westLon: null,
    southLat: null,
    eastLon: null,
    northLat: null
  };
}

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
      validationErrors: getBoxDefaults(),
      bboxValues: getBoxDefaults()
    };
  },
  computed: {
    ...mapState(['uiLanguage']),
    projectedExtent() {
      if (this.extent) {
        return this.stacToOlExtent(this.extent);
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
        extent = this.stacToOlExtent(this.stac.getBoundingBox());
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
      // For antimeridian crossing, westLon can be > eastLon
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
        this.updateBboxValues();
        this.$emit('update:modelValue', extent);
      }
      else {
        this.extent = null;
        this.clearBboxValues();
        this.$emit('update:modelValue', null);
      }
      this.validationErrors = getBoxDefaults();
    },
    updateBboxValues() {
      if (this.extent && Array.isArray(this.extent) && this.extent.length === 4) {
        this.bboxValues = {
          westLon: Math.round(this.fixX(this.extent[0]) * 100000) / 100000,
          southLat: Math.round(this.fixY(this.extent[1]) * 100000) / 100000,
          eastLon: Math.round(this.fixX(this.extent[2]) * 100000) / 100000,
          northLat: Math.round(this.fixY(this.extent[3]) * 100000) / 100000
        };
      }
    },
    clearBboxValues() {
      this.bboxValues = getBoxDefaults();
    },
    validateBbox() {
      const { westLon, southLat, eastLon, northLat } = this.bboxValues;
      const errors = getBoxDefaults();
      const incompleteMsg = this.$t('mapping.bboxSelect.error.incomplete');
      
      // Check all values are present - show error on fields that are empty
      if (westLon === '') {
        errors.westLon = incompleteMsg;
      }
      if (southLat === '') {
        errors.southLat = incompleteMsg;
      }
      if (eastLon === '') {
        errors.eastLon = incompleteMsg;
      }
      if (northLat === '') {
        errors.northLat = incompleteMsg;
      }
      
      // If any value is empty, return early
      // null = Field was never filled, '' = Field was touched but left empty
      if (Object.values(this.bboxValues).some(value => value === '' || value === null)) {
        this.validationErrors = errors;
        return false;
      }
      
      // Check longitude values are in valid range (-180 to 180)
      // Per STAC spec, westLon can be > eastLon for antimeridian crossing
      if (westLon < -180 || westLon > 180) {
        errors.westLon = this.$t('mapping.bboxSelect.error.invalidLon');
      }
      if (eastLon < -180 || eastLon > 180) {
        errors.eastLon = this.$t('mapping.bboxSelect.error.invalidLon');
      }

      // Longitude order: westLon must be < eastLon unless crossing the antimeridian.
      // Antimeridian crossing is when west is in positive longitudes and east is in
      // negative longitudes (e.g., westLon=170, eastLon=-170 wraps across 180°).
      if (!errors.westLon && !errors.eastLon) {
        const crossesAntimeridian = westLon > 0 && eastLon < 0;
        if (westLon >= eastLon && !crossesAntimeridian) {
          errors.westLon = this.$t('mapping.bboxSelect.error.lonOrder');
        }
      }
      
      // Check latitude values (must be between -90 and 90)
      if (southLat < -90 || southLat > 90) {
        errors.southLat = this.$t('mapping.bboxSelect.error.invalidLat');
      }
      if (northLat < -90 || northLat > 90) {
        errors.northLat = this.$t('mapping.bboxSelect.error.invalidLat');
      }
      
      // Check latitude order (southLat must be < northLat)
      if (southLat >= northLat) {
        errors.southLat = this.$t('mapping.bboxSelect.error.latOrder');
      }

      this.validationErrors = errors;
      return Object.values(errors).every(error => !error);
    },
    applyManualBbox() {
      const valid = this.validateBbox();
      if (!valid) {
        return;
      }
      
      // Clear any previous errors
      this.validationErrors = getBoxDefaults();
      
      if (!this.map || !this.interaction) {
        return;
      }
      
      const extent = [
        this.bboxValues.westLon,
        this.bboxValues.southLat,
        this.bboxValues.eastLon,
        this.bboxValues.northLat
      ];
      
      // Update local state and emit STAC-compliant bbox to parent
      this.extent = extent;
      this.$emit('update:modelValue', extent);

      // Update map to show the extent
      const projectedExtent = this.stacToOlExtent(extent);
      this.map.getView().fit(projectedExtent, { padding: [50,50,50,50], maxZoom: this.maxZoom });
      // Update the interaction to show the extent on the map
      this.interaction.setExtent(projectedExtent);
    },
    stacToOlExtent(extent) {
      if (!Array.isArray(extent) || extent.length !== 4) {
        return null;
      }
      const mapExtent = [...extent];
      // For antimeridian-crossing bboxes (westLon > eastLon), shift eastLon
      // by +360 so OpenLayers gets a valid extent where minX < maxX.
      if (mapExtent[0] > mapExtent[2]) {
        mapExtent[2] += 360;
      }
      return transformExtent(mapExtent, this.crs, this.map.getView().getProjection());
    }
  }
};
</script>

<style lang="scss">
@import "ol/ol.css";
</style>

<style lang="scss" scoped>
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
  padding: 0.5rem;
  background-color: $light;
  border-top: 1px solid darken($light, 10%);
}

.compass-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(80px, 1fr));
  grid-template-rows: auto auto auto auto;
  gap: 0.25rem;
  align-items: start;
  justify-items: center;
  width: 100%;

  .compass-input {
    margin: 0 auto;
    padding: 0;
    width: 90%;

    :deep(label) {
      margin: 0;
      font-size: 0.75rem;
      text-align: center;
    }

    :deep(input) {
      font-size: 0.875rem;
      padding: 0.25rem 0.5rem;
    }

    :deep(.invalid-feedback) {
      font-size: 0.7rem;
      margin-top: 0.125rem;
    }

    &.compass-top {
      grid-column: 2;
      grid-row: 1;
    }

    &.compass-left {
      margin-top: -1rem;
      grid-column: 1;
      grid-row: 2;
      text-align: left;
      justify-self: start;
    }

    &.compass-right {
      margin-top: -1rem;
      grid-column: 3;
      grid-row: 2;
      text-align: right;
      justify-self: end;
    }

    &.compass-bottom {
      margin-top: -0.5rem;
      grid-column: 2;
      grid-row: 3;
    }
  }
  .validation {
    text-align: center;
    margin-top: 0;

    &.error-top {
        grid-column: 2;
        grid-row: 2;
    }
    &.error-bottom {
        grid-column: 2;
        grid-row: 4;
    }
    &.error-left {
        grid-column: 1;
        grid-row: 3;
    }
    &.error-right {
        grid-column: 3;
        grid-row: 3;
    }
  }
}
</style>
