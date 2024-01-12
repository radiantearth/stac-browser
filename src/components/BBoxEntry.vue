<template>
  <b-container>
    <b-form-row>
      <b-col>
        <b-form-group :label="$t('boundingBox.swLatitude')" label-for="sw_latitude">
          <b-form-input
            id="sw_latitude"
            @input="updateBBoxArray($event, 0)" 
            :value="bboxArray[0]"
            type="number"
            no-wheel
            step="any"
            min="-180"
            max="180"
          />
        </b-form-group>
      </b-col>
      <b-col>
        <b-form-group :label="$t('boundingBox.swLongitude')" label-for="sw_longitude">
          <b-form-input
            id="sw_longitude"
            @input="updateBBoxArray($event, 1)" 
            :value="bboxArray[1]"
            type="number"
            no-wheel
            step="any"
            min="-90"
            max="90"
          />
        </b-form-group>
      </b-col>
    </b-form-row>
    <b-form-row>
      <b-col>
        <b-form-group :label="$t('boundingBox.neLatitude')" label-for="ne_latitude">  
          <b-form-input
            id="ne_latitude"
            @input="updateBBoxArray($event, 2)" 
            :value="bboxArray[2]"
            type="number"
            no-wheel
            step="any"
            min="-180"
            max="180"
          />
        </b-form-group>
      </b-col>
      <b-col>
        <b-form-group :label="$t('boundingBox.neLongitude')" label-for="ne_longitude">
          <b-form-input
            id="ne_longitude"
            @input="updateBBoxArray($event, 3)"
            :value="bboxArray[3]"
            type="number"
            no-wheel
            step="any"
            min="-90"
            max="90"
          />
        </b-form-group>
      </b-col>
    </b-form-row>
  </b-container>
</template>

<script>
import { BFormInput, BFormGroup} from 'bootstrap-vue';

export default {
  name: 'BBoxEntry',
  components: {
    BFormGroup,
    BFormInput,
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
  computed: {
    bboxArray() {
      return this.bbox || [-180, -80, 180, 80];
    }
  },
  methods: {
    updateBBoxArray($event, position) {
     this.$emit('updateBBoxArray', $event, position);
   }
  },
};
</script>
