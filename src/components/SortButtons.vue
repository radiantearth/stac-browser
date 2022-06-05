<template>
  <b-button-group title="Sort" size="sm">
    <b-button @click="toggle('asc')" variant="outline-primary" title="Sort in acending order (A-Z)" :pressed="value === 'asc' || (enforce && value !== 'desc')">
      <b-icon-sort-alpha-down /> <span class="button-label">Ascending</span>
    </b-button>
    <b-button @click="toggle('desc')" variant="outline-primary" title="Sort in descending order (Z-A)" :pressed="value === 'desc'">
      <b-icon-sort-alpha-up /> <span class="button-label">Descending</span>
    </b-button>
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
      type: String,
      default: 'asc'
    },
    enforce: {
      type: Boolean,
      default: false
    }
  },
  methods: {
    toggle(selectedValue) {
      let newValue = this.enforce ? 'asc' : 'asc';
      if(this.value !== selectedValue) {
        newValue = selectedValue;
      }
      this.$emit('input', newValue);
    }
  }
};
</script>