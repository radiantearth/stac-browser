<template>
  <b-form-group>
    <b-form-row>
      <b-col>
        <b-form-group label="x_min" label-for="x_min">
          <b-form-input
            id="x_min"
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
        <b-form-group label="y_min" label-for="y_min">
          <b-form-input
            id="y_min"
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
      <b-col>
        <b-form-group label="x_max" label-for="x_max">  
          <b-form-input
            id="x_max"
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
        <b-form-group label="y_max" label-for="y_max">
          <b-form-input
            id="y_max"
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
  </b-form-group>
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
