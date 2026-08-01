<template>
  <b-card-footer v-if="footer && hasButtons">
    <b-button-group class="stac-actions" :vertical="vertical" :size="size">
      <b-button v-for="action of actions" :key="action.id" variant="primary" v-bind="action.btnOptions" @click="action.onClick">
        <component v-if="action.icon" :is="action.icon" class="me-1" />
        {{ action.text }}
      </b-button>
    </b-button-group>
  </b-card-footer>
  <b-button-group v-else-if="hasButtons" class="stac-actions" :vertical="vertical" :size="size">
    <b-button v-for="action of actions" :key="action.id" variant="primary" v-bind="action.btnOptions" @click="action.onClick">
      <component v-if="action.icon" :is="action.icon" class="me-1" />
      {{ action.text }}
    </b-button>
  </b-button-group>
</template>

<script>
import { defineComponent } from 'vue';
import StacActions from '../../stacActions.config';

export default defineComponent({
  name: 'StacActions',
  props: {
    data: {
      type: Object,
      required: true
    },
    footer: {
      type: Boolean,
      default: false
    },
    vertical: {
      type: Boolean,
      default: false
    },
    size: {
      type: String,
      default: 'md'
    }
  },
  computed: {
    actions() {
      return Object.entries(StacActions)
        .map(([id, plugin]) => new plugin(this.data, this, id))
        .filter(plugin => plugin.show);
    },
    hasButtons() {
      return this.actions.length > 0;
    }
  }
});
</script>
