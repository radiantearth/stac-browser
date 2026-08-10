<template>
  <b-button :variant="variant" :size="size" :title="action.title" v-bind="action.btnOptions" @click="action.onClick">
    <component v-if="action.icon" :is="action.icon" />
    <span v-if="!compact" class="button-label">{{ action.text }}</span>
  </b-button>
</template>

<script>
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'ActionButton',
  props: {
    action: {
      type: Object,
      required: true
    },
    variant: {
      type: String,
      default: 'primary'
    },
    size: {
      type: String,
      default: null,
      validator: value => value === null || ['sm', 'md', 'lg'].includes(value)
    },
    compact: {
      type: Boolean,
      default: false
    }
  }
});
</script>
