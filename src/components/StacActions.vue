<template>
  <template v-if="bare">
    <ActionButton v-for="action of actions" :key="action.id" :action="action" :variant="variant" :size="size" :compact="compactButtons" />
  </template>
  <b-button-group v-else-if="hasButtons" class="stac-actions" :vertical="!compact" :size="size">
    <ActionButton v-for="action of actions" :key="action.id" :action="action" :variant="variant" :compact="compactButtons" />
  </b-button-group>
</template>

<script>
import { defineComponent } from 'vue';
import ActionButton from './ActionButton.vue';
import Favorite from '../actions/stac/Favorite';
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
    compact: {
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
      // The built-in Favorite action is always available (its own `show`
      // gates it on the showFavorites config), followed by configured actions.
      const plugins = { favorite: Favorite, ...StacActionsConfig };
      return Object.entries(plugins)
        .map(([id, plugin]) => new plugin(this.data, this, id))
        .filter(plugin => plugin.show);
    },
    hasButtons() {
      return this.actions.length > 0;
    },
    // Save space by collapsing multiple actions to icons in a row
    compactButtons() {
      return this.compact && this.actions.length > 1;
    }
  }
});
</script>
