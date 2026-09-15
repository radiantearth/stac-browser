<template>
  <div class="iframe-wrapper">
    <iframe
      id="metricsIframe"
      :src="iframeSrc"
      title="Metrics"
      width="100%"
      height="100%"
      style="border: none; width: 100%; height: 100%;"
    ></iframe>
  </div>
</template>

<script>
import CONFIG from '@/merged-config';

export default {
  name: "MetricsPage",
  computed: {
    iframeSrc() {
      const params = new URLSearchParams({
        baseUrl: CONFIG.staticEndpoint,
        apiUrl: CONFIG.apiUrl,
        fontUrl: `${window.location.origin}${CONFIG.pathPrefix}css/fonts/notesesabold/NotesESAbold.ttf`,
      });

      return `${CONFIG.pathPrefix}metrics.html?${params.toString()}`;
    },
  },
};
</script>

<style scoped>
.iframe-wrapper {
  width: 100%;
  height: calc(100vh - var(--esa-shell-offset, 177px));
}
</style>
