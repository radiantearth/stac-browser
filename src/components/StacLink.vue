<template>
  <component :is="component" v-bind="attributes">{{ displayTitle }}</component>
</template>

<script>
import { mapGetters } from 'vuex';
import Utils from '../utils';
import STAC from '../stac';

const STAC_MEDIA_TYPES = [
  'application/json',
  'application/geo+json',
  'text/json'
];

export default {
  name: "StacLink",
  props: {
    link: {
      type: Object,
      required: true
    },
    title: {
      type: String,
      default: null
    }
  },
  computed: {
    ...mapGetters(['toBrowserPath']),
    isStacBrowserLink() {
      if (this.link instanceof STAC) {
        return true;
      }
      if (this.link.type && !STAC_MEDIA_TYPES.includes(this.link.type)) {
        return false;
      }
      switch(this.link.rel) {
        case 'root': // STAC hierarchical links v
        case 'child':
        case 'parent':
        case 'item':
        case 'related': // Links to other catalogs or items v
        case 'derived_from':
        case 'canonical':
        case 'first': // Pagination v
        case 'prev':
        case 'previous':
        case 'next':
        case 'last':
          return true;
        default:
          return false;
      }
    },
    attributes() {
      if (this.isStacBrowserLink) {
        return {
          to: this.href,
          rel: this.rel
        };
      }
      else {
        return {
          href: this.href,
          target: '_blank',
          rel: this.rel
        };
      }
    },
    component() {
      return this.isStacBrowserLink ? 'router-link' : 'a';
    },
    href() {
      if (this.link instanceof STAC) {
        return this.link.getBrowserPath();
      }
      else if (this.isStacBrowserLink) {
          return this.toBrowserPath(this.link.href);
      }
      else {
          return this.link.href;
      }
    },
    displayTitle() {
      if (this.title) {
        return this.title;
      }
      else if (this.link instanceof STAC) {
        return this.link.getDisplayTitle(STAC.DEFAULT_TITLE);
      }
      else {
        return this.link.title || Utils.titleForHref(this.link.href);
      }
    }
  }
};
</script>