<template>
  <b-container id="stac-browser">
    <b-sidebar id="sidebar" title="Browse" shadow lazy>
      <Sidebar />
    </b-sidebar>
    <!-- Header -->
    <header>
      <div class="logo">{{ rootTitle }}</div>
      <StacHeader />
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
import {
  AlertPlugin, BadgePlugin, BreadcrumbPlugin, ButtonGroupPlugin, ButtonPlugin,
  CardPlugin, LayoutPlugin, SidebarPlugin, SpinnerPlugin, TablePlugin, VBToggle } from "bootstrap-vue";
import "bootstrap/dist/css/bootstrap.css";
import "bootstrap-vue/dist/bootstrap-vue.css";

import Clipboard from 'v-clipboard'

import router from "./router";
import store from "./store";
import { mapGetters, mapState } from 'vuex';

import StacFields from '@radiantearth/stac-fields';

import Sidebar from './components/Sidebar.vue';
import StacHeader from './components/StacHeader.vue';

Vue.use(AlertPlugin);
Vue.use(ButtonGroupPlugin);
Vue.use(ButtonPlugin);
Vue.use(BadgePlugin);
Vue.use(BreadcrumbPlugin);
Vue.use(CardPlugin);
Vue.use(LayoutPlugin);
Vue.use(SidebarPlugin);
Vue.use(SpinnerPlugin);
Vue.use(TablePlugin);

Vue.directive('b-toggle', VBToggle);

Vue.use(Clipboard);

Vue.prototype.fields = StacFields;

export default {
  name: 'StacBrowser',
  router,
  store,
  components: {
    Sidebar,
    StacHeader
  },
  props: {
    url: {
      type: String,
      default: CATALOG_URL
    },
    defaultTitle: {
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
    title(title) {
      document.title = title;
    },
    url: {
      immediate: true,
      handler(url) {
        this.$store.commit('baseUrl', url);
      }
    },
    baseUrl: {
      immediate: true,
      handler(path, oldPath) {
        if (path !== oldPath) {
          this.$store.dispatch("load", { path });
        }
      },
    },
    defaultTitle: {
      immediate: true,
      handler(title) {
        this.$store.commit('defaultTitle', title);
        document.title = title;
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
    ...mapState(['baseUrl']),
    ...mapGetters(['rootTitle']),
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