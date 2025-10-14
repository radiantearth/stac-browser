<template>
  <b-container id="stac-browser">
    <!-- New Top Bar -->
    <div class="top-bar">
      <!-- Left Section -->
      <div class="top-bar__left" @click="goHome" title="Go to Open Data Home">
        <img
          class="top-bar__logo"
          src="https://guide.wyvern.space/img/wyvern-logo-all-blue-no-tagline.png"
          alt="Wyvern Logo"
        />
        <span class="top-bar__title">Open Data Program</span>
      </div>

      <!-- Center Section (Toggle Buttons) -->
      <div class="top-bar__center">
        <button
          :class="['toggle-btn', { active: showMap }]"
          @click="showMap = true; persistPreference();"
          aria-pressed="showMap"
        >🗺️ Map Browser</button>
        <button
          :class="['toggle-btn', { active: !showMap }]"
          @click="showMap = false; persistPreference();"
          aria-pressed="!showMap"
        >🌐 STAC Browser</button>
      </div>

      <!-- Right Section (External Links) -->
      <div class="top-bar__right">
        <a
          href="https://knowledge.wyvern.space"
          target="_blank"
          rel="noopener"
          class="top-link"
        >
          Knowledge Centre
          <svg class="ext-icon" aria-hidden="true" viewBox="0 0 24 24">
            <path d="M14 3h7v7m0-7L10 14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M5 5v14h14v-5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </a>
        <a
          href="https://guide.wyvern.space"
          target="_blank"
          rel="noopener"
          class="top-link"
        >
          Product Guide
          <svg class="ext-icon" aria-hidden="true" viewBox="0 0 24 24">
            <path d="M14 3h7v7m0-7L10 14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M5 5v14h14v-5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </a>
      </div>
    </div>

    <!-- Main Content Areas -->
    <div :class="['map-wrapper', { 'is-hidden': !showMap }]">
      <ArchiveMap @open-stac="openStacFromMap" ref="archiveMap" />
    </div>

    <div :class="['browser-wrapper', { 'is-hidden': showMap }]">
      <Authentication v-if="showLogin" />
      <ErrorAlert
        v-if="globalError"
        dismissible
        class="global-error"
        v-bind="globalError"
        @close="hideError"
      />
      <Sidebar v-if="sidebar" />
      <!-- Existing STAC Browser header (optional to keep/remove) -->
      <header>
        <div class="logo">{{ displayCatalogTitle }}</div>
        <StacHeader @enableSidebar="sidebar = true" />
      </header>
      <router-view />
      <footer>
        <i18n tag="small" path="poweredBy" class="poweredby text-muted">
          <template #link>
            <a href="https://github.com/radiantearth/stac-browser" target="_blank">STAC Browser</a> {{ browserVersion }}
          </template>
        </i18n>
      </footer>
    </div>
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
  VBToggle, VBVisible
} from "bootstrap-vue";
import "bootstrap/dist/css/bootstrap.css";
import "bootstrap-vue/dist/bootstrap-vue.css";

import ErrorAlert from './components/ErrorAlert.vue';
import StacHeader from './components/StacHeader.vue';
import { STAC } from 'stac-js';
import Utils from './utils';
import URI from 'urijs';
import { API_LANGUAGE_CONFORMANCE } from './i18n';
import { getBest, prepareSupported } from 'stac-js/src/locales';
import BrowserStorage from "./browser-store";
import Authentication from "./components/Authentication.vue";
import ArchiveMap from './components/ArchiveMap.vue';
import VueGtag from 'vue-gtag';

Vue.use(AlertPlugin);
Vue.use(ButtonGroupPlugin);
Vue.use(ButtonPlugin);
Vue.use(BadgePlugin);
Vue.use(CardPlugin);
Vue.use(LayoutPlugin);
Vue.use(SpinnerPlugin);
Vue.directive('b-toggle', VBToggle);
Vue.directive('b-visible', VBVisible);

Vue.use(VueRouter);
const router = new VueRouter({
  mode: CONFIG.historyMode,
  base: CONFIG.pathPrefix,
  routes: getRoutes(CONFIG),
  scrollBehavior: (to, from, savedPosition) => {
    if (to.path !== from.path) {
      return { x: 0, y: 0 };
    }
    else {
      return savedPosition;
    }
  }
});

Vue.use(VueGtag, {
  config: {
    id: 'G-SJ7Y1HXN04'
  }
}, router);

Vue.use(Vuex);
const store = getStore(CONFIG, router);

let Props = {};
let Watchers = {};
for (let key in CONFIG) {
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
    StacHeader,
    ArchiveMap
  },
  props: {
    ...Props
  },
  data() {
    return {
      sidebar: false,
      error: null,
      onDataLoaded: null,
      showMap: false
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
      document.getElementById('og-title').setAttribute("content", title);
    },
    description(description) {
      const summary = Utils.summarizeMd(description, 200);
      document.getElementById('meta-description').setAttribute("content", summary);
      document.getElementById('og-description').setAttribute("content", summary);
    },
    uiLanguage: {
      immediate: true,
      async handler(locale) {
        if (!locale) {
          return;
        }
        this.$root.$i18n.locale = locale;
        document.documentElement.setAttribute("lang", locale);
        document.getElementById('og-locale').setAttribute("content", locale);
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
            let url = this.url;
            this.$store.commit('resetCatalog', true);
            await this.$store.dispatch("load", { url, show: true });
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
        'authConfig',
        'cardViewMode',
        'cardViewSort',
        'crossOriginMedia',
        'defaultThumbnailSize',
        'displayGeoTiffByDefault',
        'showThumbnailsAsAssets'
      ];

      let doReset = !root || (oldRoot && Utils.isObject(oldRoot['stac_browser']));
      let doSet = root && Utils.isObject(root['stac_browser']);

      for (let key of canChange) {
        let value;
        if (doReset) {
          value = CONFIG[key];
        }
        if (doSet && typeof root['stac_browser'][key] !== 'undefined') {
          value = root['stac_browser'][key];
        }

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
    },
    showMap(isMap) {
      if (isMap) {
        this.$nextTick(() => {
          const mapComp = this.$refs.archiveMap;
          mapComp?.resizeMap?.();

          // NEW: Force a globe refresh to avoid black globe
          mapComp?.refreshGlobe?.(); 
        });
      }
    }
  },
  async created() {
    try {
      const pref = localStorage.getItem('wyvern-map-root-pref');
      if ((pref === 'map' || pref === null) && this.$route.path == '/') this.showMap = true;
    } catch (e) { /* ignore */ }

    this.$router.onReady(() => {
      this.detectLocale();
      this.parseQuery(this.$route);
    });

    this.$router.afterEach((to, from) => {
      if (to.path === from.path) {
        return;
      }

      let resetOp = 'resetPage';
      if (this.allowSelectCatalog && to.path) {
        let next = this.fromBrowserPath(to.path);
        if (this.isExternalUrl(next)) {
          resetOp = 'resetCatalog';
        }
      }

      this.$store.commit(resetOp);
      this.parseQuery(to);

      document.getElementById('og-url').setAttribute("content", window.location.href);
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
    openStacFromMap(id) {
      if (!id) return;
      this.showMap = false;
      const targetPath = `/${id}/${id}.json`;
      this.$router.push({ path: targetPath }).catch(() => {});
    },
    goHome() {
      if (!this.showMap) this.showMap = true;
    },
    detectLocale() {
      let locale;
      if (this.storeLocaleFromVueX) {
        const storage = new BrowserStorage();
        locale = storage.get('locale');
      }
      if (!locale && this.detectLocaleFromBrowserFromVueX && Array.isArray(navigator.languages)) {
        const supported = prepareSupported(this.supportedLocalesFromVueX);
        for (let l of navigator.languages) {
          const best = getBest(supported, l, null);
          if (best) {
            locale = best;
            break;
          }
        }
      }
      if (locale && this.supportedLocalesFromVueX.includes(locale)) {
        this.switchLocale({locale});
        if (!this.data) {
          this.onDataLoaded = () => {
            this.switchLocale({locale});
            this.onDataLoaded = null;
          };
        }
      }
    },
    persistPreference() {
      try {
        localStorage.setItem('wyvern-map-root-pref', this.showMap ? 'map' : 'browser');
      } catch (e) { /* ignore */ }
    },
    parseQuery(route) {
      let privateFromHash = {};
      if (this.historyMode === 'history') {
        let uri = URI(route.hash.replace(/^#/, ''));
        privateFromHash = uri.query(true);
      }
      let query = Object.assign({}, route.query, privateFromHash);
      let params = {};
      for (let key in query) {
        let value = query[key];
        if (key.startsWith('~')) {
          params.private = Utils.isObject(params.private) ? params.private : {};
          params.private[key.substr(1)] = value;
          delete query[key];
        }
        else if (key.startsWith('.')) {
          let realKey = key.substr(1);
          params.state = Utils.isObject(params.state) ? params.state : {};
          if (Array.isArray(this.stateQueryParameters[realKey]) && !Array.isArray(value)) {
            value = value.split(',');
          }
            params.state[realKey] = value;
        }
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

#stac-browser {
  padding: 0;
  max-width: 100%;
}

/* New Top Bar */
.top-bar {
  position: relative;
  z-index: 500;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 8px 18px;
  background: #ffffff;
  border-bottom: 1px solid #e1e1e1;
  box-shadow: 0 1px 2px rgba(0,0,0,0.04);
  font-family: "Roboto", sans-serif;
}

.top-bar__left {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  user-select: none;
}

.top-bar__logo {
  height: 34px;
  width: auto;
  object-fit: contain;
  display: block;
}

.top-bar__title {
  font-size: 1.05rem;
  font-weight: 600;
  letter-spacing: 0.5px;
  color: #222;
  white-space: nowrap;
  margin-left: 5px;
}

.top-bar__center {
  display: flex;
  align-items: center;
  gap: 8px;
}

.top-bar__right {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

.top-link {
  font-size: 0.85rem;
  font-weight: 500;
  color: #3b26f9;
  text-decoration: none;
  letter-spacing: 0.3px;
  padding: 4px 6px;
  border-radius: 4px;
  transition: background .18s, color .18s;
}
.top-link:hover {
  background: #f4f4ff;
  color: #301fd0;
  text-decoration: none;
}

.toggle-btn {
  cursor: pointer;
  background: #ffffff;
  border: 1px solid #ccc;
  padding: 6px 16px;
  font-size: 0.85rem;
  border-radius: 5px;
  font-weight: 500;
  color: #333;
  transition: background .18s, color .18s, box-shadow .18s, border-color .18s;
  line-height: 1.1;
}
.toggle-btn.active {
  background: #3b26f9;
  color: #fff;
  border-color: #3b26f9;
  box-shadow: 0 0 0 1px #3b26f9 inset;
}
.toggle-btn:hover {
  background: #ecebff;
}

@media (max-width: 850px) {
  .top-bar {
    flex-wrap: wrap;
    justify-content: center;
    padding: 10px 12px;
  }
  .top-bar__left {
    order: 1;
    display: inline-block;
  }
  .top-bar__center {
    order: 3;
  }
  .top-bar__right {
    order: 2;
  }
}

.map-wrapper, .browser-wrapper {
  position: relative;
  width: 100%;
  height: calc(100vh - 60px); /* account for top bar height */
  overflow: hidden;
}

.browser-wrapper {
  padding: 15px 15px 0 15px;
}

.ext-icon {
  width: 14px;
  height: 14px;
  flex-shrink: 0;
  stroke: currentColor;
}

.is-hidden {
  display: none !important;
}
</style>
