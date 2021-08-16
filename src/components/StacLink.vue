<template>
  <router-link :to="href" :rel="link.rel" :target="target">{{ displayTitle }}</router-link>
</template>

<script>
import { mapGetters } from 'vuex';
import Utils from '../utils';
import STAC from '../stac';

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
    target() {
      if (this.isStacBrowserLink) {
        return null;
      }
      else {
        return '_blank';
      }
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
      return this.title || this.link.title || this.link.id || Utils.titleForHref(this.link.href);
    }
  }
};
</script>