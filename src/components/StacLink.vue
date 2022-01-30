<template>
  <component :is="component" v-bind="attributes">
    {{ displayTitle }}
    <b-icon-box-arrow-up-right v-if="!isStacBrowserLink" />
  </component> 
</template>

<script>
import { mapGetters } from 'vuex';
import Utils from '../utils';
import STAC from '../stac';
import { links } from '@radiantearth/stac-fields/fields.json';
import { BIconBoxArrowUpRight } from 'bootstrap-vue';

export default {
  name: "StacLink",
  components: {
    BIconBoxArrowUpRight
  },
  props: {
    link: {
      type: Object,
      required: true
    },
    title: {
      type: String,
      default: null
    },
    fallbackTitle: {
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
      if (!Utils.isStacMediaType(this.link.type, true)) {
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
        case 'latest-version': // version extension v
        case 'predecessor-version':
        case 'successor-version':
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
      else if (this.link.title) {
        return this.link.title;
      }
      else if (this.fallbackTitle) {
        return this.fallbackTitle;
      }
      else {
        let rel = this.link.rel;
        if (rel in links.rel.mapping) {
          rel = links.rel.mapping[rel];
        }
        let title = Utils.titleForHref(this.link.href);
        return `${rel} (${title})`
      }
    }
  }
};
</script>