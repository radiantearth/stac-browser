<template>
  <li class="link">
    <StacLink :id="popoverId" :data="link" :fallbackTitle="fallbackTitle" class="pr-1" />
    <b-popover :target="popoverId" triggers="hover" placement="right" container="#stac-browser" custom-class="link-more">
      <Description v-if="link.description" :description="link.description" compact />
      <section class="link-actions">
        <h3 class="first">{{ $t('additionalActions') }}</h3>
        <HrefActions vertical :data="link" size="sm" />
      </section>
      <Metadata :data="link" type="Link" headerTag="h3" :ignoreFields="ignore" />
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
    StacLink,
    Description: () => import('./Description.vue'),
    Metadata: () => import('./Metadata.vue')
  },
  props: {
    link: {
      type: Object,
      required: true
    },
    fallbackTitle: {
      type: Function,
      required: true
    },
    context: {
      type: Object,
      default: null
    }
  },
  data() {
    return {
      ignore: ['href', 'type', 'rel', 'title', 'description']
    };
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

<style lang="scss">
#stac-browser .link-more {
  width: auto;
  max-width: 600px;

  .styled-description {
    margin-bottom: 1rem;
  }

  h3 {
    font-size: 0.85rem;
    color: #6c757d;
    text-align: center;
    padding: 0;
    font-weight: 600;
    margin: 1rem 0 0.7rem;

    &.first {
      margin-top: 0;
    }
  }
  
  .metadata {
    min-width: 400px;

    h4 {
      font-size: 0.85rem;
      font-weight: normal;
      margin-top: 0;
      margin-bottom: 0.5rem;
    }

    .card-columns {
      column-count: 1;
    }
    .card {
      border: 0;
      margin-top: 0;
      font-size: 0.8rem;
    }
    .card-body {
      padding: 0;
    }
  }
}
</style>
