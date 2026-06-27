<template>
  <div class="header-title">
    <img v-if="logo" :src="logo.getAbsoluteUrl()" :alt="logo.title" :title="logo.title" class="logo">
    <span role="banner">{{ shortTitle }}</span>
  </div>
</template>

<script>
import { mapState, mapGetters } from "vuex";
import Utils from "../utils";
import { getDisplayTitle } from "../models/stac";

export default {
  name: "HeaderTitle",
  computed: {
    ...mapState(['catalogUrl', 'catalogImage', 'catalogTitle', 'catalogTitleAfterImage', 'description', 'loading', 'url', 'uiLanguage']),
    ...mapGetters(['description', 'root', 'rootLink', 'title']),
    logo() {
      if (this.catalogImage) {
        return Utils.createLink(this.catalogImage, 'icon', this.catalogTitle || this.rootLink?.title);
      }
      else {
        return Utils.getIcon(this.root);
      }
    },
    fallbackTitle() {
      return this.$t('STAC Browser');
    },
    shortTitle() {
      if (this.catalogImage && this.catalogTitleAfterImage !== null) {
        return this.catalogTitleAfterImage;
      }
      return this.longTitle;
    },
    longTitle() {
      if(this.catalogTitle) {
        return this.catalogTitle;
      }
      else if (this.root) {
        return getDisplayTitle(this.root);
      }
      else if (this.url && this.loading) {
        // If the page is still loading, we don't show a title to not have a quick flash
        // of the default title before the actual title is loaded.
        return '';
      }
      else {
        // To change this default title, add "STAC Browser": "Your Title" to the custom.json locale file
        return this.fallbackTitle;
      }
    },
    documentTitle() {
      const titles = new Set();
      if (this.title) {
        titles.add(this.title);
      }
      if (this.longTitle) {
        titles.add(this.longTitle);
      }
      return Array.from(titles).join(' - ');
    }
  },
  watch: {
    documentTitle: {
      immediate: true,
      handler(documentTitle) {
        const title = documentTitle || this.fallbackTitle;
        document.title = title;
        document.getElementById('og-title').setAttribute("content", title);
      }
    },
    description: {
      immediate: true,
      handler(description) {
        if (!description) {
          return;
        }
        const summary = Utils.summarizeMd(description, 200);
        document.getElementById('meta-description').setAttribute("content", summary);
        document.getElementById('og-description').setAttribute("content", summary);
      }
    },
    uiLanguage: {
      immediate: true,
      async handler(locale) {
        if (!locale) {
          return;
        }

        // Update the HTML lang tag
        document.documentElement.setAttribute("lang", locale);
        document.getElementById('og-locale').setAttribute("content", locale);
      }
    },
  },
  methods: {
    updateUrl() {
      document.getElementById('og-url').setAttribute("content", window.location.href);
    }
  }
};
</script>
