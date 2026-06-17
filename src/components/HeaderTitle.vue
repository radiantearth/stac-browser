<template>
  <div class="header-title">
    <img v-if="logo" :src="logo.getAbsoluteUrl()" :alt="logo.title" :title="logo.title" class="logo">
    <span role="banner">{{ title }}</span>
  </div>
</template>

<script>
import { mapState, mapGetters } from "vuex";
import Utils from "../utils";
import { getDisplayTitle } from "../models/stac";

export default {
  name: "HeaderTitle",
  computed: {
    ...mapState(['catalogUrl', 'catalogImage', 'catalogTitle', 'catalogTitleAfterImage']),
    ...mapGetters(['root', 'rootLink']),
    logo() {
      if (this.catalogImage) {
        return Utils.createLink(this.catalogImage, 'icon', this.catalogTitle || this.rootLink?.title);
      }
      else {
        return Utils.getIcon(this.root);
      }
    },
    title() {
      if (this.logo && this.catalogTitleAfterImage !== null) {
        return this.catalogTitleAfterImage;
      }
      else if (this.catalogTitle) {
        return this.catalogTitle;
      }
      else if (this.root) {
        return getDisplayTitle(this.root);
      }
      else {
        // To change this default title, add "STAC Browser": "Your Title" to the custom.json locale file
        return this.$i18n.t('STAC Browser');
      }
    }
  }
};
</script>
