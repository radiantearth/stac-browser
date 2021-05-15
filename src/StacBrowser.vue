<template>
  <b-container id="stac-browser">
    <!-- Header -->
    <header>
      <div class="logo">{{ title }}</div>
      <Breadcrumb />
    </header>
    <!-- Content (Item / Catalog) -->
    <main>
      <router-view />
    </main>
    <footer>
      <small class="poweredby text-muted">
        Powered by <a href="https://github.com/radiantearth/stac-browser">STAC Browser</a> v{{ browserVersion }}
      </small>
    </footer>
  </b-container>
</template>

<script>
import Vue from "vue";

import Breadcrumb from './components/Breadcrumb.vue';

import { AlertPlugin, BadgePlugin, BreadcrumbPlugin, ButtonGroupPlugin, ButtonPlugin, LayoutPlugin, SpinnerPlugin } from "bootstrap-vue";
import "bootstrap/dist/css/bootstrap.css";
import "bootstrap-vue/dist/bootstrap-vue.css";

import Clipboard from 'v-clipboard'

import router from "./router";
import store from "./store";

Vue.use(AlertPlugin);
Vue.use(ButtonGroupPlugin);
Vue.use(ButtonPlugin);
Vue.use(BadgePlugin);
Vue.use(BreadcrumbPlugin);
Vue.use(LayoutPlugin);
Vue.use(SpinnerPlugin);

Vue.use(Clipboard)

export default {
  name: 'StacBrowser',
  router,
  store,
  components: {
    Breadcrumb
  },
  props: {
    url: {
      type: String,
      default: CATALOG_URL
    },
    title: {
      type: String,
      default: CATALOG_TITLE
    },
    tileSourceTemplate: {
      type: String,
      default: TILE_SOURCE_TEMPLATE
    },
    stacProxyUrl: {
      type: String,
      default: STAC_PROXY_URL
    },
    tileProxyUrl: {
      type: String,
      default: TILE_PROXY_URL
    }
  },
  watch: {
    url: {
      immediate: true,
      handler(url) {
        this.$store.commit('baseUrl', url);
      }
    },
    title: {
      immediate: true,
      handler(title) {
        this.$store.commit('title', title);
      }
    },
    tileSourceTemplate: {
      immediate: true,
      handler(tileSourceTemplate) {
        this.$store.commit('tileSourceTemplate', tileSourceTemplate);
      }
    },
    stacProxyUrl: {
      immediate: true,
      handler(stacProxyUrl) {
        this.$store.commit('stacProxyUrl', stacProxyUrl);
      }
    },
    tileProxyUrl: {
      immediate: true,
      handler(tileProxyUrl) {
        this.$store.commit('tileProxyUrl', tileProxyUrl);
      }
    }
  },
  computed: {
    browserVersion() {
      return STAC_BROWSER_VERSION;
    }
  }
}
</script>

<style lang="scss">
  @import "./theme/variables.scss";
  @import "./theme/page.scss";
</style>