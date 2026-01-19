<template>
  <b-container id="stac-browser">
    <Authentication v-if="showLogin" />
    <ErrorAlert v-if="globalError" dismissible class="global-error" v-bind="globalError" @close="hideError" />
    <Sidebar v-if="sidebar" />
    <!-- Header -->
    <header>
      <b-row class="site">
        <b-col md="12">
          <nav class="actions navigation">
            <b-button-group v-if="canSearch || isServerSelector">
              <b-button v-if="isServerSelector" variant="primary" size="sm" :title="$t('browse')" v-b-toggle.sidebar @click="sidebar = true">
                <b-icon-list /><span class="button-label">{{ $t('browse') }}</span>
              </b-button>
              <b-button v-if="canSearch" variant="primary" size="sm" :to="searchBrowserLink" :title="$t('search.title')" :pressed="isSearchPage">
                <b-icon-search /><span class="button-label">{{ $t('search.title') }}</span>
              </b-button>
            </b-button-group>
          </nav>
          <div class="title">
            <img v-if="logo" :src="logo.getAbsoluteUrl()" :alt="logo.title" :title="logo.title" class="logo">
            <span role="banner">
              <StacLink v-if="root" :data="root" hideIcon />
              <template v-else>{{ catalogTitle }}</template>
            </span>
            <b-button
              v-if="root" size="sm" variant="outline-primary" id="popover-root-btn"
              :title="serviceType" tag="a" tabindex="0"
            >
              <b-icon-caret-down-fill />
            </b-button>
          </div>
          <nav class="actions user">
            <b-button-group>
              <b-button v-if="canAuthenticate" variant="primary" size="sm" @click="logInOut" :title="authTitle">
                <component :is="authIcon" /><span class="button-label">{{ authLabel }}</span>
              </b-button>
              <LanguageChooser
                :data="data" :currentLocale="localeFromVueX" :locales="supportedLocalesFromVueX"
                @setLocale="locale => switchLocale({locale, userSelected: true})"
              />
            </b-button-group>
          </nav>
        </b-col>
      </b-row>
      <b-row class="page" v-if="!loading">
        <b-col md="12">
          <div class="title">
            <img v-if="icon && !isRoot" :src="icon.getAbsoluteUrl()" :alt="icon.title" :title="icon.title" class="icon">
            <h1>{{ title }}</h1>
          </div>
          <nav class="actions navigation">
            <b-button-group>
              <b-button v-if="back" :to="selfBrowserLink" :title="$t('goBack.description', {type})" variant="outline-primary" size="sm">
                <b-icon-arrow-left /><span class="button-label">{{ $t('goBack.label') }}</span>
              </b-button>
              <b-button v-if="collectionLink" :to="toBrowserPath(collectionLink.href)" :title="collectionLinkTitle" variant="outline-primary" size="sm">
                <b-icon-folder-symlink /><span class="button-label">{{ $t('goToCollection.label') }}</span>
              </b-button>
              <b-button v-if="parentLink" :to="toBrowserPath(parentLink.href)" :title="parentLinkTitle" variant="outline-primary" size="sm">
                <b-icon-arrow-90deg-up /><span class="button-label">{{ $t('goToParent.label') }}</span>
              </b-button>
            </b-button-group>
          </nav>
          <Source class="actions" :title="title" :stacUrl="url" :stac="data" />
        </b-col>
      </b-row>
    </header>
    <!-- Content (Item / Catalog) -->
    <router-view />
    <footer>
      <ul v-if="Array.isArray(footerLinksFromVueX) && footerLinksFromVueX.length > 0" class="footer-links text-muted">
        <li v-for="link in footerLinksFromVueX" :key="link.url">
          <a :href="link.url" target="_blank">{{ $te(`footerLinks.${link.label}`) ? $t(`footerLinks.${link.label}`) : link.label }}</a>
        </li>
      </ul>
      <i18n tag="small" path="poweredBy" class="poweredby text-muted">
        <template #link>
          <a href="https://github.com/radiantearth/stac-browser" target="_blank">STAC Browser</a> {{ browserVersion }}
        </template>
      </i18n>
    </footer>
    <b-popover
      v-if="root" id="popover-root" custom-class="popover-large" target="popover-root-btn"
      triggers="focus" placement="bottom" container="stac-browser"
    >
      <template #title>
        {{ serviceType }}
      </template>
      <RootStats />
    </b-popover>
  </b-container>
</template>

<script>
import Vue from "vue";
import VueRouter from "vue-router";
import Vuex, { mapMutations, mapActions, mapGetters, mapState } from 'vuex';
import CONFIG from './config';
import getRoutes from "./router";
import getStore from "./store";

import {
  AlertPlugin, BadgePlugin, BPopover,
  BIconArrow90degUp, BIconArrowLeft, BIconCaretDownFill,
  BIconFolderSymlink, BIconInfoLg, BIconList, BIconLock,
  BIconSearch, BIconUnlock,
  ButtonGroupPlugin, ButtonPlugin, CardPlugin, LayoutPlugin, SpinnerPlugin,
  VBToggle, VBVisible } from "bootstrap-vue";
import "bootstrap/dist/css/bootstrap.css";
import "bootstrap-vue/dist/bootstrap-vue.css";

import ErrorAlert from './components/ErrorAlert.vue';
import StacLink from './components/StacLink.vue';

import { CatalogLike, STAC } from 'stac-js';
import Utils from './utils';
import URI from 'urijs';

import { API_LANGUAGE_CONFORMANCE } from './i18n';
import { getBest, prepareSupported } from 'stac-js/src/locales';
import BrowserStorage from "./browser-store";
import Authentication from "./components/Authentication.vue";
import LanguageChooser from "./components/LanguageChooser.vue";
import { getDisplayTitle } from "./models/stac";

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
    BIconArrow90degUp,
    BIconArrowLeft,
    BIconCaretDownFill,
    BIconFolderSymlink,
    BIconInfoLg,
    BIconList,
    BIconLock,
    BIconSearch,
    BIconUnlock,
    BPopover,
    ErrorAlert,
    LanguageChooser,
    RootStats: () => import('./components/RootStats.vue'),
    Sidebar: () => import('./components/Sidebar.vue'),
    StacLink,
    Source: () => import('./components/Source.vue')
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
    ...mapState(['allowSelectCatalog', 'conformsTo', 'data', 'dataLanguage', 'globalError', 'loading', 'stateQueryParameters', 'uiLanguage', 'url']),
    ...mapState({
      catalogImageFromVueX: 'catalogImage',
      footerLinksFromVueX: 'footerLinks',
      localeFromVueX: 'locale',
      detectLocaleFromBrowserFromVueX: 'detectLocaleFromBrowser',
      supportedLocalesFromVueX: 'supportedLocales',
      storeLocaleFromVueX: 'storeLocale'
    }),
    ...mapGetters(['canSearch', 'collectionLink', 'description', 'fromBrowserPath', 'isExternalUrl', 'isRoot', 'parentLink', 'root', 'rootLink', 'supportsConformance', 'title', 'toBrowserPath']),
    ...mapGetters('auth', { authMethod: 'method' }),
    ...mapGetters('auth', ['canAuthenticate', 'isLoggedIn', 'showLogin']),
    browserVersion() {
      if (typeof STAC_BROWSER_VERSION !== 'undefined') {
        return STAC_BROWSER_VERSION;
      }
      else {
        return "";
      }
    },
    isSearchPage() {
      return this.$route.name === 'search';
    },
    isServerSelector() {
      return this.$route.name !== 'select';
    },
    authIcon() {
      return this.isLoggedIn ? 'b-icon-unlock' : 'b-icon-lock';
    },
    authTitle() {
      return this.authMethod.getButtonTitle();
    },
    authLabel() {
      return this.isLoggedIn ? this.authMethod.getLogoutLabel() : this.authMethod.getLoginLabel();
    },
    searchBrowserLink() {
      if (!this.canSearch) {
        return null;
      }
      let searchLink;
      if (this.data instanceof CatalogLike && !this.data.equals(this.root)) {
        searchLink = this.data.getSearchLink();
      }
      if (searchLink) {
        return `/search${this.data.getBrowserPath()}`;
      }
      else if (this.root && this.allowSelectCatalog) {
        return `/search${this.root.getBrowserPath()}`;
      }
      return '/search';
    },
    isApi() {
      // todo: This gives false results for a statically hosted OGC API - Records, which may include conformance classes
      return Array.isArray(this.conformsTo) && this.conformsTo.length > 0;
    },
    serviceType() {
      return this.isApi ? this.$t('index.api') : this.$t('index.catalog');
    },
    back() {
      return this.$route.name === 'validation';
    },
    selfBrowserLink() {
      return this.toBrowserPath(this.url);
    },
    type() {
      if (this.data instanceof STAC) {
        if (this.data.isItem()) {
          return this.$tc('stacItem');
        }
        else if (this.data.isCollection()) {
          return this.$tc(`stacCollection`);
        }
        else if (this.data.isCatalog()) {
          return this.$tc(`stacCatalog`);
        }
        else if (Utils.hasText(this.data.type)) {
          return this.data.type;
        }
      }
      return null;
    },
    collectionLinkTitle() {
      if (this.collectionLink && Utils.hasText(this.collectionLink.title)) {
        return this.$t('goToCollection.descriptionWithTitle', this.collectionLink);
      }
      else {
        return this.$t('goToCollection.description');
      }
    },
    parentLinkTitle() {
      if (this.parentLink && Utils.hasText(this.parentLink.title)) {
        return this.$t('goToParent.descriptionWithTitle', this.parentLink);
      }
      else {
        return this.$t('goToParent.description');
      }
    },
    icon() {
      return this.getIcon(this.data);
    },
    logo() {
      if (this.catalogImageFromVueX) {
        return Utils.createLink(this.catalogImageFromVueX, 'icon', this.rootLink?.title);
      }
      else {
        return this.getIcon(this.root);
      }
    }
  },
  watch: {
    ...Watchers,
    title(title) {
      if (this.root) {
        const rootTitle = getDisplayTitle(this.root);
        if (rootTitle !== title) {
          title += ` - ${rootTitle}`;
        }
      }
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

        // Set the locale for vue-i18n
        this.$root.$i18n.locale = locale;

        // Update the HTML lang tag
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
            // this.url gets reset with resetCatalog so store the url for use in load
            let url = this.url;
            // Todo: Resetting the catalogs is not ideal. 
            // A better way would be to combine the language code and URL as the index in the browser database
            // This needs a database refactor though: https://github.com/radiantearth/stac-browser/issues/231
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

      // Reset the callback for updating the data locale
      // see https://github.com/radiantearth/stac-browser/issues/683
      this.onDataLoaded = null;

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
    ...mapMutations('auth', ['addAction']),
    ...mapActions('auth', ['requestLogin', 'requestLogout']),
    getIcon(data) {
      if (data instanceof STAC) {
        const icons = data.getIcons();
        if (icons.length > 0) {
          return icons[0];
        }
      }
      return null;
    },
    async logInOut() {
      if (this.url) {
        this.addAction(() => this.$store.dispatch("load", {
          url: this.url,
          show: true,
          force: true,
          noRetry: true
        }));
      }
      if (this.isLoggedIn) {
        await this.requestLogout();
      }
      else {
        await this.requestLogin();
      }
    },
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

