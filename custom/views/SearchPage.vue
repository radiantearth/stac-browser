<template>
  <div class="iframe-wrapper">
    <iframe
      id="searchIframe"
      :src="iframeSrc"
      title="Search"
      width="100%"
      height="100%"
      style="border: none; width: 100%; height: 100%;"
    ></iframe>
  </div>
</template>

<script>
import CONFIG from '@/merged-config';

export default {
  name: "SearchPage",
  data() {
    return {
      productBaseUrl: "",
    };
  },
  computed: {
    iframeSrc() {
      const params = new URLSearchParams({
        baseUrl: CONFIG.staticEndpoint,
        apiUrl: CONFIG.apiUrl,
        fontUrl: `${window.location.origin}${CONFIG.pathPrefix}css/fonts/notesesabold/NotesESAbold.ttf`,
      });

      if (this.productBaseUrl) {
        params.set("productBaseUrl", this.productBaseUrl);
      }

      return `${CONFIG.pathPrefix}search.html?${params.toString()}`;
    },
  },
  mounted() {
    // Set the productBaseUrl to point back to the catalog browse view
    this.productBaseUrl = window.location.origin + CONFIG.pathPrefix;
  },
};
</script>

<style scoped>
.iframe-wrapper {
  width: 100%;
  height: calc(100vh - var(--esa-shell-offset, 177px));
}
</style>
