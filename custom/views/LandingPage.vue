<template>
  <div class="iframe-wrapper">
    <iframe
      id="indexIframe"
      :src="iframeSrc"
      title="Open Science Catalogue"
      width="100%"
      height="100%"
      style="border: none; width: 100%; height: 100%;"
    ></iframe>
  </div>
</template>

<script>
import CONFIG from '@/merged-config';

export default {
  name: "LandingPage",
  computed: {
    iframeSrc() {
      const params = new URLSearchParams({
        baseUrl: CONFIG.staticEndpoint,
        apiUrl: CONFIG.apiUrl,
        fontUrl: `${window.location.origin}${CONFIG.pathPrefix}css/fonts/notesesabold/NotesESAbold.ttf`,
      });

      return `${CONFIG.pathPrefix}index-static.html?${params.toString()}`;
    },
  },
};
</script>

<style scoped>
.iframe-wrapper {
  width: 100%;
  height: calc(100vh - 140px);
}
</style>
