<template>
  <b-container>
    <b-form-row>
      <b-col>
        <b-form-group label="Southwest Latitude" label-for="sw_latitude">
          <b-form-input
            id="sw_latitude"
            @input="updateBBoxArray($event, 0)" 
            :value="bbox[0]"
            type="number"
            no-wheel
            step="any"
            min="-180"
            max="180"
          />
        </b-form-group>
      </b-col>
      <b-col>
        <b-form-group label="Southwest Longitude" label-for="sw_longitude">
          <b-form-input
            id="sw_longitude"
            @input="updateBBoxArray($event, 1)" 
            :value="bbox[1]"
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
        <b-form-group label="Northeast Latitude" label-for="ne_latitude">  
          <b-form-input
            id="ne_latitude"
            @input="updateBBoxArray($event, 2)" 
            :value="bbox[2]"
            type="number"
            no-wheel
            step="any"
            min="-180"
            max="180"
          />
        </b-form-group>
      </b-col>
      <b-col>
        <b-form-group label="Northeast Longitude" label-for="ne_longitude">
          <b-form-input
            id="ne_longitude"
            @input="updateBBoxArray($event, 3)"
            :value="bbox[3]"
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
      type: Array,
      required: true
    }
  },
  methods: {
    updateBBoxArray($event, position) {
     this.$emit('updateBBoxArray', $event, position);
   }
 }
};
</script>

<style lang="scss">
@import "../theme/variables.scss";

legend {
  font-size: 1.3em
}
</style>
