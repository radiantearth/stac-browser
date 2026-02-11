<template>
  <b-button-group :title="$t('sort.title')" size="sm">
    <b-button @click="toggle(1)" variant="outline-primary" :title="$t('sort.asc.title')" :pressed="modelValue === 1 || (enforce && modelValue !== -1)">
      <b-icon-sort-alpha-down /> <span class="button-label">{{ $t('sort.asc.label') }}</span>
    </b-button>
    <b-button @click="toggle(-1)" variant="outline-primary" :title="$t('sort.desc.title')" :pressed="modelValue === -1">
      <b-icon-sort-alpha-up /> <span class="button-label">{{ $t('sort.desc.label') }}</span>
    </b-button>
  </b-button-group>
</template>

<script>
import { defineComponent } from 'vue';

export default defineComponent({
  name: "SortButtons",
  props: {
    modelValue: {
      type: Number,
      default: 0
    },
    enforce: {
      type: Boolean,
      default: false
    }
  },
  emits: ['update:modelValue'],
  methods: {
    toggle(selectedValue) {
      let newValue = this.enforce ? 1 : 0;
      if(this.modelValue !== selectedValue) {
        newValue = selectedValue;
      }
      this.$emit('update:modelValue', newValue);
    }
  }
});
</script>