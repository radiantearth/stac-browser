<template>
  <b-container id="stac-browser">
    <Authentication v-if="showLogin" />
    <ErrorAlert v-if="globalError" dismissible class="global-error" v-bind="globalError" @close="hideError" />
    <Sidebar v-if="sidebar" />
    <!-- Header -->
    <header>
      <div class="logo">{{ displayCatalogTitle }}</div>
      <StacHeader @enableSidebar="sidebar = true" />
    </header>
    <!-- Content (Item / Catalog) -->
    <router-view />
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
import Vuex, { mapActions, mapGetters, mapState } from 'vuex';
import CONFIG from './config';
import getRoutes from "./router";
import getStore from "./store";

import {
  AlertPlugin, BadgePlugin, ButtonGroupPlugin, ButtonPlugin,
  CardPlugin, LayoutPlugin, SpinnerPlugin,
  VBToggle, VBVisible } from "bootstrap-vue";
import "bootstrap/dist/css/bootstrap.css";
import "bootstrap-vue/dist/bootstrap-vue.css";

import ErrorAlert from './components/ErrorAlert.vue';
import StacHeader from './components/StacHeader.vue';

import STAC from './models/stac';
import Utils from './utils';
import URI from 'urijs';

import { API_LANGUAGE_CONFORMANCE } from './i18n';
import { getBest, prepareSupported } from './locale-id';
import BrowserStorage from "./browser-store";
import Authentication from "./components/Authentication.vue";

Vue.use(AlertPlugin);
Vue.use(ButtonGroupPlugin);
Vue.use(ButtonPlugin);
Vue.use(BadgePlugin);
Vue.use(CardPlugin);
Vue.use(LayoutPlugin);
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
    handler: async function(newValue) {
      await this.$store.dispatch('config', {
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
    Authentication,
    ErrorAlert,
    Sidebar: () => import('./components/Sidebar.vue'),
    StacHeader
  },
  props: {
    ...Props
  },
  data() {
    return {
      sidebar: false,
      error: null,
      onDataLoaded: null
    };
  },
  computed: {
    ...mapState(['allowSelectCatalog', 'data', 'dataLanguage', 'description', 'globalError', 'stateQueryParameters', 'title', 'uiLanguage', 'url']),
    ...mapState({
      detectLocaleFromBrowserFromVueX: 'detectLocaleFromBrowser',
      supportedLocalesFromVueX: 'supportedLocales',
      storeLocaleFromVueX: 'storeLocale'
    }),
    ...mapGetters(['displayCatalogTitle', 'fromBrowserPath', 'isExternalUrl', 'root', 'supportsConformance', 'toBrowserPath']),
    ...mapGetters('auth', ['showLogin']),
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
    description(description) {
      let element = document.getElementById('meta-description');
      if (element) {
        element.setAttribute("content", Utils.summarizeMd(description, 200));
      }
    },
    uiLanguage: {
      immediate: true,
      async handler(locale) {
        if (!locale) {
          return;
        }

        // Set the locale for vue-i18n
        this.$root.$i18n.locale = locale;

        // Update the HTML lang tag
        document.documentElement.setAttribute("lang", locale);

        this.$root.$emit('uiLanguageChanged', locale);
      }
    },
    dataLanguage: {
      immediate: true,
      async handler(locale) {
        if (!locale) {
          return;
        }
        if (this.data instanceof STAC) {
          let link = this.data.getLocaleLink(locale);
          if (link) {
            let state = Object.assign({}, this.stateQueryParameters);
            this.$router.push(this.toBrowserPath(link.href));
            this.$store.commit('state', state);
          }
          else if (this.supportsConformance(API_LANGUAGE_CONFORMANCE)) {
            // this.url gets reset with resetCatalog so store the url for use in load
            let url = this.url;
            // Todo: Resetting the catalogs is not ideal. 
            // A better way would be to combine the language code and URL as the index in the browser database
            // This needs a database refactor though: https://github.com/radiantearth/stac-browser/issues/231
            this.$store.commit('resetCatalog', true);
            await this.$store.dispatch("load", { url, loadApi: true, show: true });
          }
        }
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
    },
    root(root, oldRoot) {
      const canChange = [
        'apiCatalogPriority',
        'authConfig', // except for the 'formatter', which can't be encoded in JSON
        'cardViewMode',
        'cardViewSort',
        'crossOriginMedia',
        'defaultThumbnailSize',
        'displayGeoTiffByDefault',
        'showThumbnailsAsAssets'
      ];

      let doReset = !root || (oldRoot && Utils.isObject(oldRoot['stac_browser']));
      let doSet = root && Utils.isObject(root['stac_browser']);

      for(let key of canChange) {
        let value;
        if (doReset) {
          value = CONFIG[key]; // Original value
        }
        if (doSet && typeof root['stac_browser'][key] !== 'undefined') {
          value = root['stac_browser'][key]; // Custom value from root
        }

        // Update config in store
        if (typeof value !== 'undefined') {
          this.$store.dispatch('config', { [key]: value })
            .catch(error => console.error(error));
        }
      }
    },
    data(data) {
      if (!this.onDataLoaded) {
        return;
      }
      if (data instanceof STAC) {
        this.onDataLoaded();
      }
    }
  },
  async created() {
    this.$router.onReady(() => {
      this.detectLocale();
      this.parseQuery(this.$route);
    });

    this.$router.afterEach((to, from) => {
      if (to.path === from.path) {
        return;
      }

      // Handle catalog change: https://github.com/radiantearth/stac-browser/issues/250
      let resetOp = 'resetPage';
      if (this.allowSelectCatalog && to.path) {
        let next = this.fromBrowserPath(to.path);
        if (this.isExternalUrl(next)) {
          resetOp = 'resetCatalog';
        }
      }

      this.$store.commit(resetOp);
      this.parseQuery(to);
    });

    const storage = new BrowserStorage(true);
    const authConfig = storage.get('authConfig');
    if (authConfig) {
      storage.remove('authConfig');
      await this.$store.dispatch('config', { authConfig });
    }
  },
  mounted() {
    this.$root.$on('error', this.showError);
    setInterval(() => this.$store.dispatch('loadBackground', 3), 200);
  },
  methods: {
    ...mapActions(['switchLocale']),
    detectLocale() {
      let locale;
      if (this.storeLocaleFromVueX) {
        const storage = new BrowserStorage();
        locale = storage.get('locale');
      }
      if (!locale && this.detectLocaleFromBrowserFromVueX && Array.isArray(navigator.languages)) {
        // Detect the most suitable locale
        const supported = prepareSupported(this.supportedLocalesFromVueX);
        for(let l of navigator.languages) {
          const best = getBest(supported, l, null);
          if (best) {
            locale = best;
            break;
          }
        }
      }
      if (locale && this.supportedLocalesFromVueX.includes(locale)) {
        // This may only change the UI language, but does not change the data language if the data is not loaded yet
        this.switchLocale({locale});
        if (!this.data) {
          // Thus try switching the (data) language again once the data is loaded.
          this.onDataLoaded = () => {
            this.switchLocale({locale});
            this.onDataLoaded = null;
          };
        }
      }
    },
    parseQuery(route) {
      let privateFromHash = {};
      if (this.historyMode === 'history') {
        let uri = URI(route.hash.replace(/^#/, ''));
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
          if (!Utils.isObject(params.localRequest)) {
            params.localRequest = {};
          }
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
        this.switchLocale({locale: params.state.language});
      }
      if (Utils.size(params.private) > 0) {
        this.$router.replace({ query });
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
