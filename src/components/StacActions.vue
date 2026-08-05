<template>
  <template v-if="bare">
    <ActionButton v-for="action of actions" :key="action.id" :action="action" :variant="variant" :size="size" />
  </template>
  <b-button-group v-else-if="hasButtons" class="stac-actions" :vertical="vertical" :size="size">
    <ActionButton v-for="action of actions" :key="action.id" :action="action" :variant="variant" />
  </b-button-group>
</template>

<script>
import { defineComponent } from 'vue';
import ActionButton from './ActionButton.vue';
import StacActionsConfig from '../../stacActions.config';

export default defineComponent({
  name: 'StacActions',
  components: {
    ActionButton
  },
  props: {
    data: {
      type: Object,
      required: true
    },
    variant: {
      type: String,
      default: 'primary'
    },
    vertical: {
      type: Boolean,
      default: false
    },
    size: {
      type: String,
      default: 'md',
      validator: value => ['sm', 'md', 'lg'].includes(value)
    },
    // Renders the action buttons without the wrapping button-group, for
    // embedding into a button-group owned by the caller.
    bare: {
      type: Boolean,
      default: false
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
