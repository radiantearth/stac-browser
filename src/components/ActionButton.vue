<template>
  <b-button :variant="variant" :size="size" v-bind="action.btnOptions" @click="action.onClick">
    <component v-if="action.icon" :is="action.icon" class="me-1" />
    {{ action.text }}
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
    }
  }
});
</script>
