<template>
  <b-container id="stac-browser">
    <Authentication v-if="doAuth.length > 0" />
    <b-sidebar id="sidebar" :title="$t('browse')" shadow lazy>
      <Sidebar />
    </b-sidebar>
    <!-- Header -->
    <header>
      <div class="logo">{{ displayCatalogTitle }}</div>
      <StacHeader />
    </header>
    <!-- Content (Item / Catalog) -->
    <main>
      <ErrorAlert class="global-error" v-if="globalError" v-bind="globalError" @close="hideError" />
      <router-view />
    </main>
    <footer>
      <i18n tag="small" path="poweredBy" class="poweredby text-muted">
        <template #link>
          <a href="https://github.com/radiantearth/stac-browser" target="_blank">STAC Browser</a> {{ browserVersion }}
        </template>
      </i18n>
    </footer>
  </b-container>
</template>

<script>
import Vue from "vue";
import VueRouter from "vue-router";
import Vuex, { mapGetters, mapState } from 'vuex';
import CONFIG from './config';
import getRoutes from "./router";
import getStore from "./store";

import {
  AlertPlugin, BadgePlugin, ButtonGroupPlugin, ButtonPlugin,
  CardPlugin, LayoutPlugin, SidebarPlugin, SpinnerPlugin,
  VBToggle, VBVisible } from "bootstrap-vue";
import "bootstrap/dist/css/bootstrap.css";
import "bootstrap-vue/dist/bootstrap-vue.css";

import Clipboard from 'v-clipboard';

import ErrorAlert from './components/ErrorAlert.vue';
import Sidebar from './components/Sidebar.vue';
import StacHeader from './components/StacHeader.vue';

import STAC from './models/stac';
import Utils from './utils';
import URI from 'urijs';

Vue.use(Clipboard);

Vue.use(AlertPlugin);
Vue.use(ButtonGroupPlugin);
Vue.use(ButtonPlugin);
Vue.use(BadgePlugin);
Vue.use(CardPlugin);
Vue.use(LayoutPlugin);
Vue.use(SidebarPlugin);
Vue.use(SpinnerPlugin);

// For collapsibles / accordions
Vue.directive('b-toggle', VBToggle);
// Used to detect when a catalog/item becomes visible so that further data can be loaded
Vue.directive('b-visible', VBVisible);

// Setup router
Vue.use(VueRouter);
const router = new VueRouter({
  mode: CONFIG.historyMode,
  base: CONFIG.pathPrefix,
  routes: getRoutes(CONFIG)
});

// Setup store
Vue.use(Vuex);
const store = getStore(CONFIG, router);

// Pass Config through from props to vuex
let Props = {};
let Watchers = {};
for(let key in CONFIG) {
  Props[key] = {
    default: ['object', 'function'].includes(typeof CONFIG[key]) ? () => CONFIG[key] : CONFIG[key]
  };
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
  store,
  components: {
    Authentication: () => import('./components/Authentication.vue'),
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
  computed: {
    ...mapState(['data', 'doAuth', 'globalError', 'stateQueryParameters', 'title']),
    ...mapState({
      catalogUrlFromVueX: 'catalogUrl',
      localeFromVueX: 'locale',
      detectLocaleFromBrowserFromVueX: 'detectLocaleFromBrowser',
      fallbackLocaleFromVueX: 'fallbackLocale'
    }),
    ...mapGetters(['displayCatalogTitle', 'toBrowserPath']),
    browserVersion() {
      if (typeof STAC_BROWSER_VERSION !== 'undefined') {
        return STAC_BROWSER_VERSION;
      }
      else {
        return "";
      }
    }
  },
  watch: {
    ...Watchers,
    title(title) {
      document.title = title;
    },
    localeFromVueX: {
      immediate: true,
      async handler (locale) {
        this.$root.$i18n.locale = locale;
        require(`./locales/${locale}/datepicker.js`);

        if (this.data instanceof STAC) {
          let link = this.data.getLocaleLink(locale, this.fallbackLocaleFromVueX);
          if (link) {
            let state = Object.assign({}, this.stateQueryParameters);
            this.$router.push(this.toBrowserPath(link.href));
            this.$store.commit('state', state);
          }
        }
      }
    },
    catalogUrlFromVueX(url) {
      if (url) {
        // Load the root catalog data if not available (e.g. after page refresh or external access)
        this.$store.dispatch("load", { url, loadApi: true });
      }
    },
    stateQueryParameters: {
      deep: true,
      handler() {
        let query = {};
        for (const [key, value] of Object.entries(this.$route.query)) {
          if (!key.startsWith('.')) {
            query[key] = value;
          }
        }
        for (const [key, value] of Object.entries(this.stateQueryParameters)) {
          let name = `.${key}`;
          if (Array.isArray(value)) {
            if (value.length > 0) {
              query[name] = value.join(',');
            }
          }
          else if (value !== null) {
              query[name] = value;
          }
        }

        this.$router.replace({ query }).catch(error => {
          if (!VueRouter.isNavigationFailure(error, VueRouter.NavigationFailureType.duplicated)) {
            throw Error(error);
          }
        });
      }
    }
  },
  created() {
    this.$router.onReady(() => {
      if (this.detectLocaleFromBrowserFromVueX && Array.isArray(navigator.languages)) {
        this.$store.dispatch('switchLocale', navigator.languages);
      }
      
      this.parseQuery(this.$route);
    });

    this.$router.afterEach((to, from) => {
      if (to.path === from.path) {
        return;
      }
      
      this.$store.commit('resetPage');
      this.parseQuery(to);
    });
  },
  mounted() {
    this.$root.$on('error', this.showError);
    setInterval(() => this.$store.dispatch('loadBackground', 3), 200);
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
        let value = query[key];
        // Store all private query parameters (start with ~) and replace them in the shown URI
        if (key.startsWith('~')) {
          params.private = Utils.isObject(params.private) ? params.private : {};
          params.private[key.substr(1)] = value;
          delete query[key];
        }
        // Store all state related parameters (start with .)
        else if (key.startsWith('.')) {
          let realKey = key.substr(1);
          params.state = Utils.isObject(params.state) ? params.state : {};
          if (Array.isArray(this.stateQueryParameters[realKey]) && !Array.isArray(value)) {
            value = value.split(',');
          }
          params.state[realKey] = value;
        }
        // All other parameters should be appended to the main STAC requests
        else {
          params.localRequest = Utils.isObject(params.request) ? params.request : {};
          params.localRequest[key] = value;
        }
      }
      if (Utils.size(params) > 0) {
        for (let type in params) {
          for (let key in params[type]) {
            this.$store.commit('setQueryParameter', {type, key, value: params[type][key]});
          }
        }
      }
      if (params?.state?.language) {
        this.$store.dispatch('switchLocale', params.state.language);
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
};
</script>

<style lang="scss">
@import "./theme/variables.scss";
@import '~bootstrap/scss/bootstrap.scss';
@import '~bootstrap-vue/src/index.scss';
@import "./theme/page.scss";
@import "./theme/custom.scss";
</style>