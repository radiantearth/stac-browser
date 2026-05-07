<template>
  <div class="map-container">
    <div ref="map" class="map">
      <TextControl :text="help" />
      <UserLocationControl :map="map" :maxZoom="maxZoom" />
      <LayerControl :map="map" :basemaps="basemaps" :activeBasemapIndex="activeBasemapIndex" @switch-basemap="switchBasemap" />
      <TerrainControl :is3D="is3D" @toggle="toggle3D" />
    </div>
    <div class="bbox-controls">
      <b-form class="compass-grid" @change="applyManualBbox" @submit.prevent="applyManualBbox">
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
import TerrainControl from './TerrainControl.vue';
import UserLocationControl from './UserLocationControl.vue';
import BboxDrawInteraction from './BboxDrawInteraction.js';
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
    TerrainControl,
    UserLocationControl,
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
      extent: this.modelValue,
      validationErrors: getBoxDefaults(),
      bboxValues: getBoxDefaults(),
      bboxDraw: null,
    };
  },
  computed: {
    ...mapState(['uiLanguage']),
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

      this.bboxDraw = new BboxDrawInteraction(this.map, (extent) => {
        this.extent = extent;
        this.updateBboxValues();
        this.$emit('update:modelValue', extent);
        this.validationErrors = getBoxDefaults();
      });

      if (this.extent) {
        this.bboxDraw.setExtent(this.extent);
      }

      this.map.on('click', (e) => {
        if (this.extent) {
          const bounds = [[this.extent[0], this.extent[1]], [this.extent[2], this.extent[3]]];
          const lngLat = e.lngLat;
          if (lngLat.lng >= bounds[0][0] && lngLat.lng <= bounds[1][0] &&
              lngLat.lat >= bounds[0][1] && lngLat.lat <= bounds[1][1]) {
            this.extent = null;
            this.clearBboxValues();
            this.$emit('update:modelValue', null);
            this.bboxDraw.setExtent(null);
            this.validationErrors = getBoxDefaults();
          }
        }
      });

      if (this.stac) {
        this.addMask(this.stac);
      }

      if (this.extent) {
        this.map.fitBounds(
          [[this.extent[0], this.extent[1]], [this.extent[2], this.extent[3]]],
          { padding: 50, maxZoom: this.maxZoom }
        );
      } else if (this.stac) {
        const bbox = this.stac.getBoundingBox();
        if (bbox) {
          this.map.fitBounds(
            [[bbox[0], bbox[1]], [bbox[2], bbox[3]]],
            { padding: 50, maxZoom: this.maxZoom }
          );
        }
      }
    },

    addMask(stac) {
      if (!stac || typeof stac.toGeoJSON !== 'function') return;

      const geojson = stac.toGeoJSON();
      if (!geojson) return;

      const world = toGeoJSON([-180, -90, 180, 90]);
      const masked = mask(geojson, world);

      this.map.addSource('stac-mask', {
        type: 'geojson',
        data: masked,
      });
      this.map.addLayer({
        id: 'stac-mask-layer',
        type: 'fill',
        source: 'stac-mask',
        paint: {
          'fill-color': 'rgba(0, 0, 0, 0.5)',
        },
      });
    },

    fixX(x) {
      while (x > 180) { x -= 360; }
      while (x < -180) { x += 360; }
      return x;
    },
    fixY(y) {
      return Math.max(-90, Math.min(90, y));
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

      if (westLon === '') { errors.westLon = incompleteMsg; }
      if (southLat === '') { errors.southLat = incompleteMsg; }
      if (eastLon === '') { errors.eastLon = incompleteMsg; }
      if (northLat === '') { errors.northLat = incompleteMsg; }

      if (Object.values(this.bboxValues).some(value => value === '' || value === null)) {
        this.validationErrors = errors;
        return false;
      }

      if (westLon < -180 || westLon > 180) {
        errors.westLon = this.$t('mapping.bboxSelect.error.invalidLon');
      }
      if (eastLon < -180 || eastLon > 180) {
        errors.eastLon = this.$t('mapping.bboxSelect.error.invalidLon');
      }

      if (!errors.westLon && !errors.eastLon) {
        const crossesAntimeridian = westLon > 0 && eastLon < 0;
        if (westLon >= eastLon && !crossesAntimeridian) {
          errors.westLon = this.$t('mapping.bboxSelect.error.lonOrder');
        }
      }

      if (southLat < -90 || southLat > 90) {
        errors.southLat = this.$t('mapping.bboxSelect.error.invalidLat');
      }
      if (northLat < -90 || northLat > 90) {
        errors.northLat = this.$t('mapping.bboxSelect.error.invalidLat');
      }

      if (southLat >= northLat) {
        errors.southLat = this.$t('mapping.bboxSelect.error.latOrder');
      }

      this.validationErrors = errors;
      return Object.values(errors).every(error => !error);
    },
    applyManualBbox() {
      const valid = this.validateBbox();
      if (!valid) return;

      this.validationErrors = getBoxDefaults();

      if (!this.map) return;

      const extent = [
        this.bboxValues.westLon,
        this.bboxValues.southLat,
        this.bboxValues.eastLon,
        this.bboxValues.northLat
      ];

      this.extent = extent;
      this.$emit('update:modelValue', extent);

      this.map.fitBounds(
        [[extent[0], extent[1]], [extent[2], extent[3]]],
        { padding: 50, maxZoom: this.maxZoom }
      );

      if (this.bboxDraw) {
        this.bboxDraw.setExtent(extent);
      }
    },
  }
};
</script>

<style lang="scss">
@import "maplibre-gl/dist/maplibre-gl.css";
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
