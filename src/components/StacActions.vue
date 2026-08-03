<template>
  <b-button-group v-if="hasButtons" class="stac-actions" :vertical="vertical" :size="size">
    <b-button v-for="action of actions" :key="action.id" variant="primary" v-bind="action.btnOptions" @click="action.onClick">
      <component v-if="action.icon" :is="action.icon" class="me-1" />
      {{ action.text }}
    </b-button>
  </b-button-group>
</template>

<script>
import { defineComponent } from 'vue';
import StacActionsConfig from '../../stacActions.config';

export default defineComponent({
  name: 'StacActions',
  props: {
    data: {
      type: Object,
      required: true
    },
    vertical: {
      type: Boolean,
      default: false
    },
    size: {
      type: String,
      default: 'md',
      validator: value => ['sm', 'md', 'lg'].includes(value)
    }
  },
  computed: {
    actions() {
      return Object.entries(StacActionsConfig)
        .map(([id, plugin]) => new plugin(this.data, this, id))
        .filter(plugin => plugin.show);
    },
    hasButtons() {
      return this.actions.length > 0;
    }
  }
});
</script>
