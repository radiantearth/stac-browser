<template>
  <component :is="component" class="stac-link" :id="id" :title="tooltip" v-bind="attributes">
    <img v-if="icon && !hideIcon" :src="icon.getAbsoluteUrl()" :alt="icon.title" :title="icon.title" class="icon me-2">
    <span class="title">{{ displayTitle }}</span>
  </component>
</template>

<script>
import { defineComponent } from 'vue';
import { mapState } from 'pinia';
import { useConfigStore } from '../store/config';
import { useCatalogStore } from '../store/catalog';
import { usePageStore } from '../store/page';
import { BButton } from 'bootstrap-vue-next';
import { stacBrowserNavigatesTo } from "../rels";
import Utils from '../utils';
import { getDisplayTitle } from '../models/stac';
import { STAC } from 'stac-js';
import URI from 'urijs';

export default defineComponent({
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
      default: ""
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
    },
    hideIcon: {
      type: Boolean,
      default: false
    },
    id: {
      type: String,
      default: null
    }
  },
  computed: {
    ...mapState(useConfigStore, ['allowExternalAccess']),
    ...mapState(useCatalogStore, ['privateQueryParameters']),
    ...mapState(usePageStore, ['toBrowserPath', 'getRequestUrl', 'isExternalUrl']),
    icon() {
      if (this.stac instanceof STAC) {
        const icons = this.stac.getIcons();
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
          rel: this.link.rel
        };
        if (Utils.isObject(this.button)) {
          Object.assign(obj, this.button);
        }
        return obj;
      }
      else {
        const obj = {
          href: this.href,
          target: '_blank',
          rel: this.link.rel,
        };
        if (this.id) {
          // Add tab index when an ID is given for popovers to make it clickable on MacOS (#655)
          obj.tabindex = 0;
        }
        return obj;
      }
    },
    component() {
      if (this.button) {
        return BButton;
      }
      return this.isStacBrowserLink ? 'router-link' : 'a';
    },
    href() {
      if (this.stac || this.isStacBrowserLink) {
        let href;
        if (this.stac instanceof STAC) {
          href = this.toBrowserPath(this.stac.getAbsoluteUrl());
        }
        else {
          href = this.toBrowserPath(this.link.href);
        }
        // Normalize to start with a slash for router-link navigation
        if (!href.startsWith('/')) {
          href = '/' + (href || '');
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
      return getDisplayTitle(this.data, fallback);
    }
  },
  methods: {
    isLink(o) {
      return Utils.isObject(o) && !(o instanceof STAC);
    }
  }
});
</script>
