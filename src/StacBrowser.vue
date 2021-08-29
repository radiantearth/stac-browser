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
      <ErrorAlert class="global-error" v-if="error" v-bind="error" @close="error = null" />
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

import routes from "./router";
import { mapGetters, mapState } from 'vuex';
import store from "./store";

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

// Setup router
Vue.use(VueRouter);
const router = new VueRouter({
  mode: CONFIG.historyMode,
  base: CONFIG.pathPrefix,
  routes,
});

// Pass Config through from props to vuex
let Props = {};
let Watchers = {};
for(let key in CONFIG) {
  Props[key] = {
    default: CONFIG[key]
  }
  Watchers[key] = function(newValue) {
    this.$store.commit('config', {
      key: newValue
    });
    if (key === 'catalogUrl' && newValue) {
      // Load the root catalog data if not available (e.g. after page refresh or external access)
      this.$store.dispatch("load", { url: newValue });
    }
  };
}

export default {
  name: 'StacBrowser',
  router,
  store,
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
        this.$store.dispatch("load", { url });
      }
    }
  },
  mounted() {
    this.$root.$on('error', this.showError);
    setInterval(() => this.$store.dispatch('loadBackground', 3), 200);
  },
  computed: {
    ...mapState(['title']),
    ...mapState({catalogUrlFromVueX: 'catalogUrl'}),
    ...mapGetters(['displayCatalogTitle']),
    browserVersion() {
      return STAC_BROWSER_VERSION;
    }
  },
  methods: {
    showError(error, message) {
      this.error = {
        error,
        message
      };
    }
  }
}
</script>

<style lang="scss">
@import '~bootstrap/scss/bootstrap.scss';
@import '~bootstrap-vue/src/index.scss';
@import "./theme/variables.scss";
@import "./theme/page.scss";
</style>