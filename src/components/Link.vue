<template>
  <li>
    <StacLink :id="popoverId" :data="link" :fallbackTitle="fallbackTitle" class="pr-1" />
    <b-popover :target="popoverId" triggers="hover" placement="right" container="#stac-browser">
      <h6 class="small text-muted text-center">{{ $t('additionalActions') }}</h6>
      <HrefActions vertical :data="link" size="sm" />
    </b-popover>
  </li>
</template>

<script>
import HrefActions from './HrefActions.vue';
import StacLink from './StacLink.vue';
import { BPopover } from 'bootstrap-vue';

let linkId = 0;

export default {
  name: "Link",
  components: {
    BPopover,
    HrefActions,
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
    }
  },
  beforeCreate() {
    linkId++;
  }
};
</script>
