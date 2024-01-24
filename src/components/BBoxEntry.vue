<template>
  <b-container>
    <b-form-row>
      <b-col>
        <b-form-group :label="$t('boundingBox.swLatitude')" label-for="sw_latitude">
          <b-form-input
            id="sw_latitude"
            lazy
            @change="updateBBoxArray($event, 1)"
            v-model="sw_latitude"
            :state="isSwLatitudeValid"
            type="number"
            no-wheel
            step="1"
          />
          <b-form-invalid-feedback id="input-live-feedback">
            {{ sw_latitude < -90 || sw_latitude > 90 ?
              $t('boundingBox.latitudeRangeError'):
              $t('boundingBox.swLatitudeSizeError') 
            }}
          </b-form-invalid-feedback>
        </b-form-group>
      </b-col>
      <b-col>
        <b-form-group :label="$t('boundingBox.swLongitude')" label-for="sw_longitude">
          <b-form-input
            id="sw_longitude"
            lazy
            @change="updateBBoxArray($event, 0)"
            v-model="sw_longitude"
            :state="isSwLongitudeValid"
            type="number"
            no-wheel
            step="1"
          />
          <b-form-invalid-feedback id="input-live-feedback">
            {{ sw_longitude < -180 || sw_longitude > 180 ?
              $t('boundingBox.longitudeRangeError'):
              $t('boundingBox.swLongitudeSizeError') 
            }}
          </b-form-invalid-feedback>
        </b-form-group>
      </b-col>
    </b-form-row>
    <b-form-row>
      <b-col>
        <b-form-group :label="$t('boundingBox.neLatitude')" label-for="ne_latitude">  
          <b-form-input
            id="ne_latitude"
            lazy
            @change="updateBBoxArray($event, 3)"
            v-model="ne_latitude"
            :state="isNeLatitudeValid"
            type="number"
            no-wheel
            step="1"
          />
          <b-form-invalid-feedback id="input-live-feedback">
            {{ ne_latitude < -90 || ne_latitude > 90 ?
              $t('boundingBox.latitudeRangeError'):
              $t('boundingBox.neLatitudeSizeError') 
            }}
          </b-form-invalid-feedback>
        </b-form-group>
      </b-col>
      <b-col>
        <b-form-group :label="$t('boundingBox.neLongitude')" label-for="ne_longitude">
          <b-form-input
            id="ne_longitude"
            lazy
            @change="updateBBoxArray($event, 2)"
            v-model="ne_longitude"
            :state="isNeLongitudeValid"
            type="number"
            no-wheel
            step="1"
          />
          <b-form-invalid-feedback id="input-live-feedback">
            {{ ne_longitude < -180 || ne_longitude > 180 ?
              $t('boundingBox.longitudeRangeError'):
              $t('boundingBox.neLongitudeSizeError') 
            }}
          </b-form-invalid-feedback>
        </b-form-group>
      </b-col>
    </b-form-row>
  </b-container>
</template>

<script>
import { BFormInput, BFormGroup, BFormInvalidFeedback} from 'bootstrap-vue';

export default {
  name: 'BBoxEntry',
  components: {
    BFormGroup,
    BFormInput,
    BFormInvalidFeedback,
  },
  props: {
    bbox: {
      type: [Array, null],
      default: () => ([-180, -80, 180, 80]),
      validator(value) {
        return Array.isArray(value) && value.length === 4 && value.every((e) => typeof e === 'number');
      }
    }
  },
  data() {
    return {
      sw_latitude: Math.round(this.bbox[1]),
      sw_longitude: Math.round(this.bbox[0]),
      ne_latitude: Math.round(this.bbox[3]),
      ne_longitude: Math.round(this.bbox[2]),
    };
  },
  computed: {
    isSwLatitudeValid() {
      if (this.sw_latitude >= -90 && this.sw_latitude < this.ne_latitude) {
        return null;
      } else {
        return  false;
      }
    },
    isSwLongitudeValid() {
      if (this.sw_longitude >= -180 && this.sw_longitude < this.ne_longitude) {
        return null;
      } else {
        return  false;
      }
    },
    isNeLatitudeValid() {
      if (this.ne_latitude <= 90 && this.ne_latitude > this.sw_latitude) {
        return null;
      } else {
        return  false;
      }
    },
    isNeLongitudeValid() {
      if (this.ne_longitude <= 180 && this.ne_longitude > this.sw_longitude) {
        return null;
      } else {
        return  false;
      }
     }
  },
  methods: {
    updateBBoxArray(entry, position) {
      const startingBbox = this.bbox;
      const nextBbox = [...startingBbox];
      nextBbox[position] = Number(entry);
      this.$emit('bounds', nextBbox);
   },
  }
};
</script>
