<template>
  <div class="header-title">
    <AuthImage v-if="logo" :src="logo.getAbsoluteUrl()" :alt="logo.title" :title="logo.title" class="logo" />
    <span role="banner" :title="shortTitle">{{ shortTitle }}</span>
  </div>
</template>

<script>
import { mapState, mapGetters } from "vuex";
import Utils from "../utils";
import { getDisplayTitle } from "../models/stac";
import AuthImage from "./AuthImage.vue";

export default {
  name: "HeaderTitle",
  components: {
    AuthImage
  },
  computed: {
    ...mapState(['catalogImage', 'catalogTitle', 'catalogTitleAfterImage', 'loading', 'url']),
    ...mapGetters(['root', 'rootLink']),
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
    }
  }
};
</script>
