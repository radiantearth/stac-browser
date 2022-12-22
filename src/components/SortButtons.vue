<template>
  <b-button-group :title="$t('sort.title')" size="sm">
    <b-button @click="toggle(1)" variant="outline-primary" :title="$t('sort.asc.title')" :pressed="value === 1 || (enforce && value !== -1)">
      <b-icon-sort-alpha-down /> <span class="button-label">{{ $t('sort.asc.label') }}</span>
    </b-button>
    <b-button @click="toggle(-1)" variant="outline-primary" :title="$t('sort.desc.title')" :pressed="value === -1">
      <b-icon-sort-alpha-up /> <span class="button-label">{{ $t('sort.desc.label') }}</span>
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
      type: Number,
      default: 0
    },
    enforce: {
      type: Boolean,
      default: false
    }
  },
  methods: {
    toggle(selectedValue) {
      let newValue = this.enforce ? 1 : 0;
      if(this.value !== selectedValue) {
        newValue = selectedValue;
      }
      this.$emit('input', newValue);
    }
  }
};
</script>