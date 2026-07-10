<template>
  <Loading v-if="!browserReady" fill />
  <b-container v-else id="stac-browser">
    <WidgetHook id="root-start" />
    <Authentication v-if="showLogin" />
    <ErrorAlert v-if="globalError" dismissible class="global-error" v-bind="globalError" @close="hideError" />
    <Sidebar v-if="sidebar !== null" v-model="sidebar" />
    <!-- Header -->
    <header>
      <b-row class="site">
        <b-col md="12">
          <nav class="actions navigation">
            <b-button-group v-if="canSearch || !isServerSelector">
              <b-button v-if="!isServerSelector" variant="primary" :title="$t('browse')" @click="sidebar = !sidebar">
                <b-icon-list /><span class="button-label">{{ $t('browse') }}</span>
              </b-button>
              <b-button v-if="canSearch" variant="primary" :to="searchBrowserLink" :title="$t('search.title')" :pressed="isSearchPage">
                <b-icon-search /><span class="button-label">{{ $t('search.title') }}</span>
              </b-button>
              <b-button v-if="root" variant="primary" id="popover-root-btn" tabindex="0">
                <b-icon-database /><span class="button-label">{{ serviceType }}</span>
              </b-button>
            </b-button-group>
          </nav>
          <div class="title">
            <StacLink v-if="root" :data="root">
              <HeaderTitle ref="header" />
            </StacLink>
            <HeaderTitle v-else ref="header" />
          </div>
          <nav class="actions user">
            <b-button-group>
              <b-button v-if="canAuthenticate" variant="primary" @click="logInOut" :title="authTitle">
                <component :is="authIcon" /><span class="button-label">{{ authLabel }}</span>
              </b-button>
              <LanguageChooser
                v-if="supportedLocalesFromVueX.length > 1"
                :data="data" :currentLocale="localeFromVueX" :locales="supportedLocalesFromVueX"
                @set-locale="locale => switchLocale({locale, userSelected: true})"
              />
              <b-button
                v-if="!enforcedColorModeFromVueX || enforcedColorModeFromVueX === 'auto'"
                variant="primary"
                @click="toggleColorMode"
              >
                <b-icon-sun v-if="colorMode === 'light'" :title="$t('switchToDarkMode')" />
                <b-icon-moon-stars v-else :title="$t('switchToLightMode')" />
              </b-button>
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
              <b-button v-if="collectionLink" :to="toBrowserPath(collectionLink)" :title="collectionLinkTitle" variant="outline-primary" size="sm">
                <b-icon-folder-symlink /><span class="button-label">{{ $t('goToCollection.label') }}</span>
              </b-button>
              <b-button v-if="parentLink" :to="toBrowserPath(parentLink)" :title="parentLinkTitle" variant="outline-primary" size="sm">
                <b-icon-arrow-90deg-up /><span class="button-label">{{ $t('goToParent.label') }}</span>
              </b-button>
            </b-button-group>
          </nav>
          <StacSource class="actions" :title="title" :stacUrl="url" :stac="data" />
        </b-col>
      </b-row>
    </header>
    <!-- Content -->
    <WidgetHook id="root-before-content" />
    <router-view />
    <!-- Footer -->
    <footer>
      <WidgetHook id="footer-start" />
      <ul v-if="Array.isArray(footerLinksFromVueX) && footerLinksFromVueX.length > 0" class="footer-links text-body-secondary">
        <li v-for="link in footerLinksFromVueX" :key="link.url">
          <a :href="link.url" target="_blank" rel="noopener noreferrer">{{ $te(`footerLinks.${link.label}`) ? $t(`footerLinks.${link.label}`) : link.label }}</a>
        </li>
      </ul>
      <i18n-t tag="small" keypath="poweredBy" class="poweredby text-body-secondary" scope="global">
        <template #link>
          <a href="https://github.com/radiantearth/stac-browser" target="_blank" rel="noopener noreferrer">STAC Browser</a> {{ browserVersion }}
        </template>
      </i18n-t>
    </footer>
    <b-popover
      v-if="root" id="popover-root" class="popover-large" target="popover-root-btn"
      placement="bottom" :title="serviceType" teleport-to="#stac-browser"
      click focus :boundary-padding="10"
    >
      <RootStats />
    </b-popover>
    <WidgetHook id="root-end" />
  </b-container>
</template>

<script>
import { defineComponent, defineAsyncComponent } from 'vue';
import { isNavigationFailure, NavigationFailureType } from 'vue-router';
import { mapMutations, mapActions, mapGetters, mapState } from 'vuex';
import { useColorMode } from 'bootstrap-vue-next';
import CONFIG from './merged-config';

// Import icons needed for dynamic component usage
import BIconLock from '~icons/bi/lock';
import BIconUnlock from '~icons/bi/unlock';

import ErrorAlert from './components/ErrorAlert.vue';
import HeaderTitle from './components/HeaderTitle.vue';
import Loading from './components/Loading.vue';
import StacLink from './components/StacLink.vue';

import { STAC } from 'stac-js';
import { hasText, isObject, size, URI } from 'stac-js/src/utils.js';
import Utils from './utils';

import { API_LANGUAGE_CONFORMANCE, updateExternals } from './i18n';
import { getBest, prepareSupported } from 'stac-js/src/locales';
import BrowserStorage from "./browser-store";
import Authentication from "./components/Authentication.vue";
import Auth from './auth';

// Pass Config through from props to vuex
let Props = {};
let Watchers = {};
for(let key in CONFIG) {
  Props[key] = {
    default: ['object', 'function'].includes(typeof CONFIG[key]) ? () => CONFIG[key] : CONFIG[key]
  };
  Watchers[key] = {
    immediate: true,
    deep: ['object', 'array'].includes(typeof CONFIG[key]),
    handler: async function(newValue) {
      await this.$store.dispatch('config', {
        [key]: newValue
      });
    }
  };
}

export default defineComponent({
  name: 'StacBrowser',
  components: {
    Authentication,
    BIconLock,
    BIconUnlock,
    BPopover: defineAsyncComponent(() => import('bootstrap-vue-next').then(m => m.BPopover)),
    ErrorAlert,
    HeaderTitle,
    LanguageChooser: defineAsyncComponent(() => import('./components/LanguageChooser.vue')),
    Loading,
    RootStats: defineAsyncComponent(() => import('./components/RootStats.vue')),
    Sidebar: defineAsyncComponent(() => import('./components/Sidebar.vue')),
    StacLink,
    StacSource: defineAsyncComponent(() => import('./components/StacSource.vue'))
  },
  props: {
    ...Props
  },
  data() {
    return {
      colorMode: null,
      sidebar: null,
      error: null,
      onDataLoaded: null,
      isNavigatingLocale: false
    };
  },
  computed: {
    ...mapState(['allowSelectCatalog', 'browserReady', 'conformsTo', 'data', 'dataLanguage', 'downloads', 'globalError', 'loading', 'stateQueryParameters', 'url']),
    ...mapState({
      footerLinksFromVueX: 'footerLinks',
      localeFromVueX: 'locale',
      fallbackLocaleFromVueX: 'fallbackLocale',
      detectLocaleFromBrowserFromVueX: 'detectLocaleFromBrowser',
      supportedLocalesFromVueX: 'supportedLocales',
      storeLocaleFromVueX: 'storeLocale',
      enforcedColorModeFromVueX: 'enforcedColorMode',
      colorModeFromVueX: 'colorMode'
    }),
    ...mapGetters(['canSearch', 'collectionLink', 'fromBrowserPath', 'isExternalUrl', 'isRoot', 'parentLink', 'root', 'searchBrowserLink', 'supportsConformance', 'title', 'toBrowserPath']),
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
      return this.$route.name === 'select';
    },
    authIcon() {
      return this.isLoggedIn ? BIconUnlock : BIconLock;
    },
    authTitle() {
      return this.authMethod.getButtonTitle();
    },
    authLabel() {
      return this.isLoggedIn ? this.authMethod.getLogoutLabel() : this.authMethod.getLoginLabel();
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
        if (this.data.isItem) {
          return this.$t('stacItem', 1);
        }
        else if (this.data.isCollection) {
          return this.$t(`stacCollection`, 1);
        }
        else if (this.data.isCatalog) {
          return this.$t(`stacCatalog`, 1);
        }
        else if (hasText(this.data.type)) {
          return this.data.type;
        }
      }
      return null;
    },
    collectionLinkTitle() {
      if (this.collectionLink && hasText(this.collectionLink.title)) {
        return this.$t('goToCollection.descriptionWithTitle', this.collectionLink);
      }
      else {
        return this.$t('goToCollection.description');
      }
    },
    parentLinkTitle() {
      if (this.parentLink && hasText(this.parentLink.title)) {
        return this.$t('goToParent.descriptionWithTitle', this.parentLink);
      }
      else {
        return this.$t('goToParent.description');
      }
    },
    icon() {
      return Utils.getIcon(this.data);
    }
  },
  watch: {
    ...Watchers,
    dataLanguage: {
      immediate: true,
      async handler(locale) {
        if (!locale) {
          return;
        }
        if (this.data instanceof STAC) {
          const link = this.data.getLocaleLink(locale);
          if (link) {
            const state = Object.assign({}, this.stateQueryParameters);
            this.isNavigatingLocale = true;
            try {
              await this.$router.push(this.toBrowserPath(link));
            }
            catch (error) {
              if (!isNavigationFailure(error, NavigationFailureType.duplicated)) {
                throw error;
              }
            }
            finally {
              this.isNavigatingLocale = false;
            }
            this.$store.commit('state', state);
          }
          else if (this.supportsConformance(API_LANGUAGE_CONFORMANCE)) {
            // this.url gets reset with resetCatalog so store the url for use in load
            const url = this.url;
            // Todo: Resetting the catalogs is not ideal. 
            // A better way would be to combine the language code and URL as the index in the browser database
            // This needs a database refactor though: https://github.com/radiantearth/stac-browser/issues/231
            this.$store.commit('resetCatalog', true);
            await this.$store.dispatch('load', { url, show: true });
          }
        }
      }
    },
    stateQueryParameters: {
      deep: true,
      handler() {
        if (this.isNavigatingLocale) {
          return;
        }
        let query = {};
        for (const [key, value] of Object.entries(this.$route.query)) {
          if (!key.startsWith('.')) {
            query[key] = value;
          }
        }
        query = Utils.stateQueryParametersToObject(this.stateQueryParameters, query);

        this.$router.replace({ query }).catch(error => {
          if (!isNavigationFailure(error, NavigationFailureType.duplicated)) {
            throw Error(error);
          }
        });
      }
    },
    root(root, oldRoot) {
      const canChange = [
        'apiCatalogPriority',
        'cardViewMode',
        'crossOriginMedia',
        'defaultCollectionSort',
        'defaultItemSort',
        'defaultThumbnailSize',
        'displayGeoTiffByDefault',
        'preferredAssets',
        'showThumbnailsAsAssets'
      ];

      let doReset = !root || (oldRoot && isObject(oldRoot.stac_browser));
      let doSet = root && isObject(root.stac_browser);

      for(let key of canChange) {
        let value;
        if (doReset) {
          value = CONFIG[key]; // Original value
        }
        if (doSet && typeof root.stac_browser[key] !== 'undefined') {
          value = root.stac_browser[key]; // Custom value from root
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
    },
    enforcedColorModeFromVueX: {
      immediate: true,
      handler(value) {
        if (value && value !== 'auto') {
          this.colorMode = value;
        }
      }
    },
    colorModeFromVueX(value) {
      if (value && value !== this.colorMode) {
        this.colorMode = value;
      }
    },
    colorMode(value) {
      this.$store.commit('setColorMode', value);
    }
  },
  async created() {
    this.colorMode = useColorMode({
      selector: 'body',
      initialValue: this.enforcedColorModeFromVueX
    });

    await updateExternals(this.localeFromVueX, this.fallbackLocaleFromVueX);
    await this.$router.isReady();
    await this.detectLocale();
    await this.parseQuery(this.$route);

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

      if (this.$refs.header) {
        this.$refs.header.updateUrl();
      }
    });

    const authConfig = Auth.restoreLastMethod();
    if (authConfig) {
      await this.$store.dispatch('config', { authConfig });
    }

    this.$store.commit('browserReady');
  },
  mounted() {
    setInterval(() => this.$store.dispatch('loadBackground', 3), 200);

    // Prevent the user from leaving the page while the download is in progress
    // As this is not a normal download a user has to stay on the page for the download to complete
    window.addEventListener('unload', () => {
      Object.values(this.downloads)
        .filter(stream => stream && typeof stream.abort === 'function')
        .forEach(stream => stream.abort());
    });
    window.addEventListener('beforeunload', (evt) => {
      if (size(this.downloads) > 0) {
        evt.preventDefault();
      }
    });
  },
  methods: {
    ...mapActions(['switchLocale', 'switchDataLocale']),
    ...mapMutations('auth', ['addAction']),
    ...mapActions('auth', ['requestLogin', 'requestLogout']),
    toggleColorMode() {
      this.colorMode = this.colorMode === 'light' ? 'dark' : 'light';
    },
    async logInOut() {
      if (this.url) {
        this.addAction(() => this.$store.dispatch('load', {
          url: this.url,
          show: true,
          force: true
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
            this.switchDataLocale({locale});
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
          params.private = isObject(params.private) ? params.private : {};
          params.private[key.substr(1)] = value;
          delete query[key];
        }
        // Store all state related parameters (start with .)
        else if (key.startsWith('.')) {
          let realKey = key.substr(1);
          params.state = isObject(params.state) ? params.state : {};
          if (Array.isArray(this.stateQueryParameters[realKey]) && !Array.isArray(value)) {
            value = value.split(',');
          }
          params.state[realKey] = value;
        }
        // All other parameters should be appended to the main STAC requests
        else {
          if (!isObject(params.localRequest)) {
            params.localRequest = {};
          }
          params.localRequest[key] = value;
        }
      }
      if (size(params) > 0) {
        for (let type in params) {
          for (let key in params[type]) {
            this.$store.commit('setQueryParameter', {type, key, value: params[type][key]});
          }
        }
      }
      if (params?.state?.language) {
        this.switchLocale({locale: params.state.language});
      }
      if (size(params.private) > 0) {
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
});
</script>

<style lang="scss">
@import "./theme/variables.scss";
@import 'bootstrap/scss/bootstrap';
@import 'bootstrap-vue-next/dist/bootstrap-vue-next.css';
@import "./theme/page.scss";
@import "./theme/custom.scss";
</style>

