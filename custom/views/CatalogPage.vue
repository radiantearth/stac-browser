<template>
  <div class="iframe-wrapper">
    <iframe
      ref="iframe"
      id="stacBrowser"
      :src="iframeSrc"
      style="width: 100%; height: 100%; border: none;"
    ></iframe>
  </div>
</template>

<script>
import CONFIG from '@/merged-config';

export default {
  name: "CatalogPage",
  data() {
    return {
      iframeSrc: "",
      firstLoadDone: false,
    };
  },
  mounted() {
    this.iframeSrc = this.stacBrowserPath(this.$route.params.pathMatch);
    window.addEventListener("message", this.navigationListener);
  },
  beforeUnmount() {
    window.removeEventListener("message", this.navigationListener);
  },
  methods: {
    navigationListener(evt) {
      if (evt.data && evt.data.navigate && this.firstLoadDone) {
        let innerPath = evt.data.navigate.replace(".json", "");
        if (innerPath === "/" || innerPath === "/index" || innerPath === "") {
          innerPath = "/catalog";
        } else if (!innerPath.startsWith("/")) {
          innerPath = "/" + innerPath;
        }
        
        // Sync the parent address bar URL directly (no prefixed subfolder)
        this.$router.replace(innerPath);
      } else {
        this.firstLoadDone = true;
      }
    },
    stacBrowserPath(path) {
      let relativePath = path;
      if (Array.isArray(relativePath)) {
        relativePath = relativePath.join("/");
      }
      
      // Map root catalog browsing directly to catalog.json
      if (!relativePath || relativePath === "catalog" || relativePath === "catalog/") {
        relativePath = "/catalog";
      }

      let hashPath = "";
      if (relativePath && relativePath !== "/") {
        if (!relativePath.startsWith("/")) {
          relativePath = "/" + relativePath;
        }
        hashPath = `#${relativePath}.json`;
      }
      
      return `${CONFIG.pathPrefix}catalog.html${hashPath}`;
    },
  },
  watch: {
    // Sync outer back/forward history clicks back into the STAC Browser iframe
    "$route.params.pathMatch"(newPath) {
      const targetSrc = this.stacBrowserPath(newPath);
      const iframe = this.$refs.iframe;
      if (iframe && iframe.contentWindow) {
        const currentHash = iframe.contentWindow.location.hash || "";
        const targetHash = targetSrc.includes("#") ? targetSrc.substring(targetSrc.indexOf("#")) : "";
        if (currentHash !== targetHash) {
          iframe.contentWindow.location.hash = targetHash;
        }
      }
    }
  }
};
</script>

<style scoped>
.iframe-wrapper {
  width: 100%;
  height: calc(100vh - var(--esa-shell-offset, 177px));
}
</style>
