<template>
  <b-button-group :title="$t('sort.title')" size="sm">
    <b-button @click="toggle(1)" variant="outline-primary" :title="$t('sort.asc.title')" :pressed="value === 1 || (enforce && value !== -1)">
      <IBiSortAlphaDown /> <span class="button-label">{{ $t('sort.asc.label') }}</span>
    </b-button>
    <b-button @click="toggle(-1)" variant="outline-primary" :title="$t('sort.desc.title')" :pressed="value === -1">
      <IBiSortAlphaUp /> <span class="button-label">{{ $t('sort.desc.label') }}</span>
    </b-button>
  </b-button-group>
</template>

<script>
import { defineComponent } from 'vue';

export default defineComponent({
  name: "SortButtons",
  components: {},
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
  emits: ['input'],
  methods: {
    toggle(selectedValue) {
      let newValue = this.enforce ? 1 : 0;
      if(this.value !== selectedValue) {
        newValue = selectedValue;
      }
      this.$emit('input', newValue);
    }
  }
});
</script>