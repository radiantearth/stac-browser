<template>
  <Loading v-if="!browserReady" fill />
  <b-container v-else id="stac-browser" ref="container" :lang="uiLanguage">
    <WidgetHook id="root-start" />
    <Authentication v-if="showLogin" />
    <ErrorAlert v-if="globalError" dismissible class="global-error" v-bind="globalError" @close="hideError" />
    <Sidebar v-if="sidebar !== null" v-model="sidebar" />
    <!-- Header -->
    <header ref="header" :class="{ scrolled, 'hide-site-header': hideSite }">
      <b-row class="site">
        <b-col md="12">
          <nav class="actions navigation">
            <b-button-group v-if="canSearch || !isServerSelector || showFavorites">
              <b-button v-if="!isServerSelector" variant="header" :title="$t('browse')" @click="sidebar = !sidebar">
                <b-icon-list />
              </b-button>
              <b-button v-if="canSearch" variant="header" :to="searchBrowserLink" :title="$t('search.title')" :pressed="isSearchPage">
                <b-icon-search /><span class="button-label">{{ $t('search.title') }}</span>
              </b-button>
              <b-button v-if="showFavorites" variant="header" to="/favorites" :title="$t('favorites.title')" :pressed="isFavoritesPage">
                <b-icon-star /><span class="button-label">{{ $t('favorites.title') }}</span>
              </b-button>
              <b-button v-if="root" variant="header" id="popover-root-btn" :ref="el => setTriggerRef('rootTriggerEl', el)" tabindex="0">
                <b-icon-database /><span class="button-label">{{ serviceType }}</span>
              </b-button>
            </b-button-group>
          </nav>
          <div class="title">
            <StacLink v-if="root" :data="root">
              <HeaderTitle />
            </StacLink>
            <HeaderTitle v-else />
          </div>
          <nav class="actions user">
            <b-button-group>
              <b-button v-if="canAuthenticate" variant="header" @click="logInOut" :title="authTitle">
                <component :is="authIcon" /><span class="button-label">{{ authLabel }}</span>
              </b-button>
              <LanguageChooser
                v-if="supportedLocales.length > 1"
                :data="data" :currentLocale="locale" :locales="supportedLocales"
                @set-locale="locale => switchLocale({locale, userSelected: true})"
              />
              <b-button
                v-if="!enforcedColorMode || enforcedColorMode === 'auto'"
                variant="header"
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
            <AuthImage v-if="icon && !isRoot" :src="icon.getAbsoluteUrl()" :alt="icon.title" :title="icon.title" class="icon" />
            <h1 :title="title">{{ title }}</h1>
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
          <StacSource v-if="!isFavoritesPage" class="actions" :title="title" />
        </b-col>
      </b-row>
    </header>
    <!-- Content -->
    <WidgetHook id="root-before-content" />
    <router-view />
    <!-- Footer -->
    <footer>
      <WidgetHook id="footer-start" />
      <ul v-if="Array.isArray(footerLinks) && footerLinks.length > 0" class="footer-links text-body-secondary">
        <li v-for="link in footerLinks" :key="link.url">
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
      v-if="root" id="popover-root" class="popover-large" :target="triggerRefs.rootTriggerEl"
      placement="bottom" :title="serviceType"
      click focus :boundary-padding="10" strategy="fixed"
    >
      <RootStats />
    </b-popover>
    <WidgetHook id="root-end" />
  </b-container>
</template>

<script>
import { defineComponent, defineAsyncComponent, markRaw } from 'vue';
import { isNavigationFailure, NavigationFailureType } from 'vue-router';
import { mapMutations, mapActions, mapGetters, mapState } from 'vuex';
import { useColorMode } from 'bootstrap-vue-next';

// Import icons needed for dynamic component usage
import BIconLock from '~icons/bi/lock';
import BIconUnlock from '~icons/bi/unlock';

import ErrorAlert from './components/ErrorAlert.vue';
import HeaderTitle from './components/HeaderTitle.vue';
import Loading from './components/Loading.vue';
import StacLink from './components/StacLink.vue';

import { STAC } from 'stac-js';
import { hasText, isObject, size, URI } from 'stac-js/src/utils.js';
import Utils, { languageConformance } from './utils';

import { updateExternals } from './i18n';
import { getBest, prepareSupported } from 'stac-js/src/locales';
import BrowserStorage from "./browser-store";
import Authentication from "./components/Authentication.vue";
import Auth from './auth';
import TriggerRefMixin from './components/TriggerRefMixin';
import StickyHeaderMixin from './components/StickyHeaderMixin';

export default defineComponent({
  name: 'StacBrowser',
  components: {
    AuthImage: defineAsyncComponent(() => import('./components/AuthImage.vue')),
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
  mixins: [TriggerRefMixin, StickyHeaderMixin],
  inject: ['config', 'browserVersion', 'teleportTarget', 'embedded'],
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
    ...mapState(['allowSelectCatalog', 'browserReady', 'conformsTo', 'data', 'dataLanguage', 'detectLocaleFromBrowser', 'enforcedColorMode', 'fallbackLocale', 'footerLinks', 'globalError', 'historyMode', 'loading', 'locale', 'showFavorites', 'stateQueryParameters', 'storeLocale', 'supportedLocales', 'uiLanguage', 'url']),
    ...mapGetters(['canSearch', 'collectionLink', 'fromBrowserPath', 'isExternalUrl', 'isRoot', 'parentLink', 'root', 'searchBrowserLink', 'supportsConformance', 'title', 'toBrowserPath']),
    ...mapGetters('auth', { authMethod: 'method' }),
    ...mapGetters('auth', ['canAuthenticate', 'isLoggedIn', 'showLogin']),
    isSearchPage() {
      return this.$route.name === 'search';
    },
    isFavoritesPage() {
      return this.$route.name === 'favorites';
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
      return this.$route.name === 'validation' || Boolean(this.$route.name?.startsWith('management'));
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
          else if (this.supportsConformance(languageConformance)) {
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
        'maxDisplayPixels',
        'preferredAssets',
        'showThumbnailsAsAssets'
      ];

      let doReset = !root || (oldRoot && isObject(oldRoot.stac_browser));
      let doSet = root && isObject(root.stac_browser);

      for(let key of canChange) {
        let value;
        if (doReset) {
          value = this.config[key]; // Original value
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
    enforcedColorMode: {
      immediate: true,
      handler(value) {
        if (value && value !== 'auto') {
          this.colorMode = value;
        }
      }
    },
    colorMode(value) {
      this.$store.commit('setColorMode', value);
    },
    browserReady(ready) {
      // The container and header only exist once ready. markRaw: see TriggerRefMixin.
      if (ready) {
        this.$nextTick(() => {
          const container = this.$refs.container?.$el || this.$refs.container;
          if (container) {
            this.teleportTarget.el = markRaw(container);
          }
          this.setupStickyHeader(this.$refs.header);
        });
      }
    }
  },
  async created() {
    this.colorMode = useColorMode({
      selector: 'body',
      initialValue: this.enforcedColorMode,
      // Embedded, the shadow container is themed by the web component; don't
      // also write data-bs-theme onto the host document.
      ...(this.embedded && { onChanged: () => {} })
    });

    await updateExternals(this.$i18n, this.locale, this.fallbackLocale);
    await this.$router.isReady();
    await this.detectLocale();
    await this.parseQuery(this.$route);

    this.$router.afterEach((to, from, failure) => {
      // Aborted and cancelled navigations don't change the page,
      // e.g. when a navigation guard rejected the navigation
      if (failure || to.path === from.path) {
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
    });

    const authConfig = Auth.restoreLastMethod();
    if (authConfig) {
      await this.$store.dispatch('config', { authConfig });
    }

    this.$store.commit('browserReady');
  },
  mounted() {
    this.backgroundTimer = setInterval(() => this.$store.dispatch('loadBackground', 3), 200);
  },
  beforeUnmount() {
    clearInterval(this.backgroundTimer);
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
      if (this.storeLocale) {
        const storage = new BrowserStorage();
        locale = storage.get('locale');
      }
      if (!locale && this.detectLocaleFromBrowser && Array.isArray(navigator.languages)) {
        // Detect the most suitable locale
        const supported = prepareSupported(this.supportedLocales);
        for(let l of navigator.languages) {
          const best = getBest(supported, l, null);
          if (best) {
            locale = best;
            break;
          }
        }
      }
      if (locale && this.supportedLocales.includes(locale)) {
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
@import "./theme/runtime-helpers.scss";
@import "./theme/custom.scss";
</style>

