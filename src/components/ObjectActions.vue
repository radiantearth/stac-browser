<template>
  <b-button-group class="obj-actions" :vertical="vertical" :size="size" v-if="hasButtons">
    <b-button v-for="action of actions" v-bind="action.btnOptions" :key="action.id" variant="primary" @click="action.onClick">
      <component v-if="action.icon" :is="action.icon" class="mr-1" />
      {{ action.text }}
    </b-button>
  </b-button-group>
</template>


<script>
import { BIconBoxArrowUpRight } from 'bootstrap-vue';
import ObjectActions from '../../objectActions.config';

let i = 0;

export default {
  name: 'ObjectActions',
  components: {
    BIconBoxArrowUpRight
  },
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
      return Object.entries(ObjectActions)
        .map(([id, plugin]) => new plugin(this.data, this, id))
        .filter(plugin => plugin.show);
    },
    hasButtons() {
      return this.actions && this.actions.length > 0;
    }
  }
};
</script>
