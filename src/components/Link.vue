<template>
  <li>
    <StacLink :id="popoverId" :data="link" :fallbackTitle="fallbackTitle" />
    <b-popover v-if="actions.length > 0" :target="popoverId" triggers="hover" placement="bottom">
      <b-button-group vertical>
        <b-button v-for="action of actions" v-bind="action.btnOptions" :key="action.id" variant="primary" @click="action.onClick">
          <component v-if="action.icon" :is="action.icon" class="mr-1" />
          {{ action.text }}
        </b-button>
      </b-button-group>
    </b-popover>
  </li>
</template>

<script>
import StacLink from './StacLink.vue';
import LinkActions from '../../linkActions.config';
import { BPopover } from 'bootstrap-vue';

let linkId = 0;

export default {
  name: "Link",
  components: {
    BPopover,
    StacLink
  },
  props: {
    link: {
      type: Object,
      required: true
    },
    fallbackTitle: {
      type: Function,
      required: true
    }
  },
  computed: {
    popoverId() {
      return "popover-link-" + linkId;
    },
    actions() {
      return Object.entries(LinkActions)
        .map(([id, plugin]) => new plugin(this.link, id))
        .filter(plugin => plugin.show);
    },
  },
  beforeCreate() {
    linkId++;
  }
};
</script>

<style>

</style>