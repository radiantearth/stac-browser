<template>
  <component :is="component" class="stac-link" v-bind="attributes" :title="tooltip">
    <template v-if="icon">
      <img :src="icon.href" :alt="icon.title" :title="icon.title" class="icon mr-2">
    </template>
    <span class="title">{{ displayTitle }}</span>
  </component>
</template>

<script>
import { mapState, mapGetters } from 'vuex';
import { stacBrowserNavigatesTo } from "../rels";
import Utils from '../utils';
import STAC from '../models/stac';
import URI from 'urijs';

export default {
  name: "StacLink",
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
      type: String,
      default: null
    },
    button: {
      type: [Boolean, Object],
      default: false
    },
    state: {
      type: Object,
      default: null
    }
  },
  computed: {
    ...mapState(['allowExternalAccess', 'privateQueryParameters']),
    ...mapGetters(['toBrowserPath', 'getRequestUrl', 'isExternalUrl']),
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
      if (!this.allowExternalAccess && this.isExternalUrl(this.link.href)) {
        return false;
      }
      return stacBrowserNavigatesTo.includes(this.link.rel);
    },
    attributes() {
      if (this.isStacBrowserLink || this.button) {
        let obj = {
          to: this.href,
          rel: this.rel
        };
        if (Utils.isObject(this.button)) {
          Object.assign(obj, this.button);
        }
        return obj;
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
      if (this.button) {
        return 'b-button';
      }
      return this.isStacBrowserLink ? 'router-link' : 'a';
    },
    href() {
      if (this.stac || this.isStacBrowserLink) {
        let href;
        if (this.stac) {
          href = this.stac.getBrowserPath();
        }
        else {
          href = this.toBrowserPath(this.link.href);
        }
        if (!href.startsWith('/')) {
          href = '/' + href;
        }

        // Add private query parameters to links: https://github.com/radiantearth/stac-browser/issues/142
        if (Utils.size(this.privateQueryParameters) > 0 || Utils.size(this.state) > 0) {
          let uri = URI(href);
          let addParameters = (obj, prefix) => {
            for(let key in obj) {
              let queryKey = `${prefix}${key}`;
              if (!uri.hasQuery(queryKey)) {
                uri.addQuery(queryKey, obj[key]);
              }
            }
          };
          addParameters(this.privateQueryParameters, '~');
          addParameters(this.state, '.');
          href = uri.toString();
        }

        return href;
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
