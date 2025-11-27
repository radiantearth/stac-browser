<template>
  <!-- add card footer (for items search) -->
  <b-card-footer v-if="footer && hasButtons">
    <b-button-group class="obj-actions" :vertical="vertical" :size="size">
      <b-button v-for="action of actions" v-bind="action.btnOptions" :key="action.id" variant="primary" @click="action.onClick">
        <component v-if="action.icon" :is="action.icon" class="mr-1" />
        {{ action.text }}
      </b-button>
    </b-button-group>
  </b-card-footer>
  <!-- add only button group (for item/collection vue) -->
  <b-button-group v-else-if="hasButtons" class="obj-actions" :vertical="vertical" :size="size">
    <b-button v-for="action of actions" v-bind="action.btnOptions" :key="action.id" variant="primary" @click="action.onClick">
      <component v-if="action.icon" :is="action.icon" class="mr-1" />
      {{ action.text }}
    </b-button>
  </b-button-group>
</template>


<script>
import { BIconBoxArrowUpRight } from 'bootstrap-vue';
import StacActions from '../../stacActions.config';

let i = 0;

export default {
  name: 'StacActions',
  components: {
    BIconBoxArrowUpRight
  },
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
  data() {
    return {
      id: i++
    };
  },
  computed: {
    actions() {
      return Object.entries(StacActions)
        .map(([id, plugin]) => new plugin(this.data, this, id))
        .filter(plugin => plugin.show);
    },
    hasButtons() {
      return this.actions && this.actions.length > 0;
    }
  }
};
</script>
