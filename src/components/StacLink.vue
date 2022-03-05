<template>
  <component :is="component" v-bind="attributes">
    {{ displayTitle }}<!-- avoid space
    --><small v-if="!isStacBrowserLink"><b-icon-box-arrow-up-right class="ml-1 align-baseline" /></small>
  </component> 
</template>

<script>
import { mapGetters } from 'vuex';
import Utils from '../utils';
import STAC from '../stac';
import { BIconBoxArrowUpRight } from 'bootstrap-vue';

export default {
  name: "StacLink",
  components: {
    BIconBoxArrowUpRight
  },
  props: {
    data: {
      type: [Object, Array],
      default: null
    },
    title: {
      type: String,
      default: null
    },
    fallbackTitle: {
      type: [String, Function],
      default: null
    }
  },
  computed: {
    ...mapGetters(['toBrowserPath', 'getRequestUrl']),
    stac() {
      if (this.data instanceof STAC) {
        return this.data;
      }
      else if (Array.isArray(this.data)) {
        return this.data.find(o => o instanceof STAC);
      }
      else {
        return null;
      }
    },
    link() {
      if (this.isLink(this.data)) {
        return this.data;
      }
      else if (Array.isArray(this.data)) {
        return this.data.find(o => this.isLink(o)) || {};
      }
      else {
        return {};
      }
    },
    isStacBrowserLink() {
      if (this.stac) {
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
        case 'source': // label extension
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
      if (this.stac) {
        return this.stac.getBrowserPath();
      }
      else if (this.isStacBrowserLink) {
        return this.toBrowserPath(this.link.href);
      }
      else {
        return this.getRequestUrl(this.link.href);
      }
    },
    displayTitle() {
      if (this.title) {
        return this.title;
      }

      let fallback = typeof this.fallbackTitle === 'function' ? this.fallbackTitle() : this.fallbackTitle;
      return STAC.getDisplayTitle(this.data, fallback);
    }
  },
  methods: {
    isLink(o) {
      return Utils.isObject(o) && !(o instanceof STAC);
    }
  }
};
</script>