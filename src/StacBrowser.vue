<template>
  <b-container id="stac-browser">
    <b-sidebar id="sidebar" title="Browse" shadow lazy>
      <Sidebar />
    </b-sidebar>
    <!-- Header -->
    <header>
      <div class="logo">{{ catalogTitle }}</div>
      <StacHeader />
    </header>
    <!-- Content (Item / Catalog) -->
    <main>
      <ErrorAlert class="global-error" v-if="globalError" v-bind="globalError" @close="hideError" />
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
import VueRouter from "vue-router";
import { mapGetters, mapState } from 'vuex';
import getRoutes from "./router";
import getStore from "./store";

import {
  AlertPlugin, BadgePlugin, ButtonGroupPlugin, ButtonPlugin,
  CardPlugin, LayoutPlugin, SidebarPlugin, SpinnerPlugin, TablePlugin,
  VBToggle, VBVisible } from "bootstrap-vue";
import "bootstrap/dist/css/bootstrap.css";
import "bootstrap-vue/dist/bootstrap-vue.css";

import Clipboard from 'v-clipboard'

import { Formatters } from '@radiantearth/stac-fields';

import ErrorAlert from './components/ErrorAlert.vue';
import Sidebar from './components/Sidebar.vue';
import StacHeader from './components/StacHeader.vue';

import Utils from './utils';
import URI from 'urijs';

const CONFIG_FILE = require(CONFIG_PATH);

Vue.use(Clipboard);

Vue.use(AlertPlugin);
Vue.use(ButtonGroupPlugin);
Vue.use(ButtonPlugin);
Vue.use(BadgePlugin);
Vue.use(CardPlugin);
Vue.use(LayoutPlugin);
Vue.use(SidebarPlugin);
Vue.use(SpinnerPlugin);
Vue.use(TablePlugin);

// For collapsibles / accordions
Vue.directive('b-toggle', VBToggle);
// Used to detect when a catalog/item becomes visible so that further data can be loaded
Vue.directive('b-visible', VBVisible);

// Add StacField formatters as filters
for(let name in Formatters) {
  if (name.startsWith('format')) {
    Vue.filter(name.replace(/^format/, ''), Formatters[name]);
  }
}

const CONFIG = Object.assign(CONFIG_FILE, CONFIG_CLI);

// Setup router
Vue.use(VueRouter);
const router = new VueRouter({
  mode: CONFIG.historyMode,
  base: CONFIG.pathPrefix,
  routes: getRoutes(CONFIG)
});

// Pass Config through from props to vuex
let Props = {};
let Watchers = {};
for(let key in CONFIG) {
  Props[key] = {
    default: ['object', 'function'].includes(typeof CONFIG[key]) ? () => CONFIG[key] : CONFIG[key]
  }
  Watchers[key] = {
    immediate: true,
    handler: function(newValue) {
      this.$store.commit('config', {
        [key]: newValue
      });
    }
  };
}

export default {
  name: 'StacBrowser',
  router,
  store: getStore(CONFIG),
  components: {
    ErrorAlert,
    Sidebar,
    StacHeader
  },
  props: {
    ...Props
  },
  data() {
    return {
      error: null
    };
  },
  watch: {
    ...Watchers,
    title(title) {
      document.title = title;
    },
    catalogUrlFromVueX(url) {
      if (url) {
        // Load the root catalog data if not available (e.g. after page refresh or external access)
        this.$store.dispatch("load", { url, loadApi: true });
      }
    }
  },
  created() {
    this.$router.onReady(() => this.parseQuery(this.$route));
    this.$router.afterEach(to => this.parseQuery(to));

    // Load the root catalog data if not available (e.g. after page refresh or external access)
    if (this.catalogUrl) {
      this.$store.dispatch("load", { url: this.catalogUrl, loadApi: true });
    }
  },
  mounted() {
    this.$root.$on('error', this.showError);
    setInterval(() => this.$store.dispatch('loadBackground', 3), 200);
  },
  computed: {
    ...mapState(['title', 'globalError']),
    ...mapState({catalogUrlFromVueX: 'catalogUrl'}),
    ...mapGetters(['displayCatalogTitle']),
    browserVersion() {
      return STAC_BROWSER_VERSION;
    }
  },
  methods: {
    parseQuery(route) {
      let privateFromHash = {};
      if (this.historyMode === 'history') {
        let uri = new URI(route.hash.replace(/^#/, ''));
        privateFromHash = uri.query(true);
      }
      let query = Object.assign({}, route.query, privateFromHash);
      let params = {};
      for(let key in query) {
        // Store all private query parameters (start with ~) and replace them in the shown URI
        if (key.startsWith('~')) {
          params.private = Utils.isObject(params.private) ? params.private : {};
          params.private[key.substr(1)] = query[key];
          delete query[key];
        }
        // Store all state related parameters (start with .)
        else if (key.startsWith('.')) {
          params.state = Utils.isObject(params.state) ? params.state : {};
          params.state[key.substr(1)] = query[key];
        }
        // All other parameters should be appended to the catalog requests
        else {
          params.catalog = Utils.isObject(params.catalog) ? params.catalog : {};
          params.catalog[key] = query[key];
        }
      }
      if (Utils.size(params) > 0) {
        this.$store.commit("queryParameters", params);
      }
      if (Utils.size(params.private) > 0) {
        this.$router.replace({
          ...route,
          query
        });
      }
    },
    showError(error, message) {
      this.$store.commit('showGlobalError', {
        error, 
        message
      });
    },
    hideError() {
      this.$store.commit('showGlobalError', null);
    }
  }
}
</script>

<style lang="scss">
@import "./theme/variables.scss";
@import '~bootstrap/scss/bootstrap.scss';
@import '~bootstrap-vue/src/index.scss';
@import "./theme/page.scss";
</style>