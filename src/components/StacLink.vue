<template>
  <component :is="component" class="stac-link" v-bind="attributes" :title="tooltip">
    <template v-if="icon">
      <img :src="icon.href" :alt="icon.title" :title="icon.title" class="icon mr-2" />
    </template>
    <span class="title">{{ displayTitle }}</span>
    <template v-if="!isStacBrowserLink">
      <small><b-icon-box-arrow-up-right class="ml-1 align-baseline" /></small>
    </template>
  </component>
</template>

<script>
import { mapState, mapGetters } from 'vuex';
import Utils from '../utils';
import STAC from '../stac';
import { BIconBoxArrowUpRight } from 'bootstrap-vue';
import URI from 'urijs';

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
    },
    tooltip: {
      type: String
    }
  },
  computed: {
    ...mapState(['privateQueryParameters']),
    ...mapGetters(['toBrowserPath', 'getRequestUrl']),
    icon() {
      if (this.stac) {
        let icons = this.stac.getIcons();
        if (icons.length > 0) {
          return icons[0];
        }
      }
      return null;
    },
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
        case 'collection':
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
      let href;
      if (this.stac) {
        href = this.stac.getBrowserPath();
      }
      else if (this.isStacBrowserLink) {
        href = this.toBrowserPath(this.link.href);
      }
      else {
        href = this.getRequestUrl(this.link.href);
      }

      // Add private query parameters to links: https://github.com/radiantearth/stac-browser/issues/142
      if (Utils.size(this.privateQueryParameters) > 0) {
        let uri = new URI(href);
        for(let key in this.privateQueryParameters) {
          uri.addQuery(`~${key}`, this.privateQueryParameters[key]);
        }
        href = uri.toString();
      }

      return href;
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