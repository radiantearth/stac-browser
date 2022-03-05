<template>
  <b-button-group title="Sort" size="sm">
    <b-button @click="toggle(1)" variant="outline-primary" :pressed="value === 1"><b-icon-sort-alpha-down /></b-button>
    <b-button @click="toggle(-1)" variant="outline-primary" :pressed="value === -1"><b-icon-sort-alpha-up /></b-button>
  </b-button-group>
</template>

<script>
import { BIconSortAlphaDown, BIconSortAlphaUp } from 'bootstrap-vue';

export default {
  id: "SortButtons",
  components: {
    BIconSortAlphaDown,
    BIconSortAlphaUp
  },
  props: {
    value: {
      type: Number,
      default: 0
    }
  },
  methods: {
    toggle(selectedValue) {
      let newValue = 0;
      if(this.value !== selectedValue) {
        newValue = selectedValue;
      }
      this.$emit('input', newValue);
    }
  }
}
</script>