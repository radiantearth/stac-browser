<template>
  <b-container id="stac-browser" :lang="uiLanguage">
    <Authentication v-if="showLogin" />
    <ErrorAlert v-if="globalError" dismissible class="global-error" v-bind="globalError" @close="hideError" />
    <Sidebar v-if="sidebar !== null" v-model="sidebar" />
    <!-- Header -->
    <header>
      <b-row class="site">
        <b-col md="12">
          <nav class="actions navigation">
            <b-button-group v-if="canSearch || !isServerSelector">
              <b-button v-if="!isServerSelector" variant="primary" size="sm" :title="$t('browse')" @click="sidebar = !sidebar">
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
                :data="data" :currentLocale="locale" :locales="supportedLocales"
                @set-locale="locale => switchLocale({locale, userSelected: true})"
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
          <StacSource class="actions" :title="title" :stacUrl="url" :stac="data" />
        </b-col>
      </b-row>
    </header>
    <!-- Content (Item / Catalog) -->
    <router-view />
    <footer>
      <small class="poweredby text-muted" v-html="poweredByText" />
    </footer>
    <b-popover
      v-if="root" id="popover-root" class="popover-large" target="popover-root-btn"
      placement="bottom" :title="serviceType" teleport-to="#stac-browser"
      click focus :boundary-padding="10"
    >
      <RootStats />
    </b-popover>
  </b-container>
</template>

<script>
import { defineComponent, defineAsyncComponent } from 'vue';
import { isNavigationFailure, NavigationFailureType } from 'vue-router';
import { mapMutations, mapActions, mapGetters, mapState } from 'vuex';

// Import icons needed for dynamic component usage
import BIconLock from '~icons/bi/lock';
import BIconUnlock from '~icons/bi/unlock';

import ErrorAlert from './components/ErrorAlert.vue';
import StacLink from './components/StacLink.vue';

import { CatalogLike, STAC } from 'stac-js';
import Utils, { languageConformance } from './utils';
import URI from 'urijs';

import { getBest, prepareSupported } from 'stac-js/src/locales';
import BrowserStorage from "./browser-store";
import Authentication from "./components/Authentication.vue";
import { getDisplayTitle } from "./models/stac";

export default defineComponent({
  name: 'StacBrowser',
  components: {
    Authentication,
    BIconLock,
    BIconUnlock,
    BPopover: defineAsyncComponent(() => import('bootstrap-vue-next').then(m => m.BPopover)),
    ErrorAlert,
    LanguageChooser: defineAsyncComponent(() => import('./components/LanguageChooser.vue')),
    RootStats: defineAsyncComponent(() => import('./components/RootStats.vue')),
    Sidebar: defineAsyncComponent(() => import('./components/Sidebar.vue')),
    StacLink,
    StacSource: defineAsyncComponent(() => import('./components/StacSource.vue'))
  },
  inject: ['config', 'browserVersion'],
  data() {
    return {
      sidebar: null,
      error: null,
      onDataLoaded: null
    };
  },
  computed: {
    ...mapState(['allowSelectCatalog', 'catalogImage', 'conformsTo', 'data', 'dataLanguage', 'detectLocaleFromBrowser', 'globalError', 'loading', 'locale','stateQueryParameters', 'storeLocale', 'supportedLocales', 'uiLanguage', 'url']),
    ...mapGetters(['canSearch', 'collectionLink', 'description', 'fromBrowserPath', 'isExternalUrl', 'isRoot', 'parentLink', 'root', 'rootLink', 'supportsConformance', 'title', 'toBrowserPath']),
    ...mapGetters('auth', { authMethod: 'method' }),
    ...mapGetters('auth', ['canAuthenticate', 'isLoggedIn', 'showLogin']),
    poweredByText() {
      let link = `<a href="https://github.com/radiantearth/stac-browser" target="_blank">STAC Browser</a>`;
      if (this.browserVersion) {
        link += ` ${this.browserVersion}`;
      }
      return this.$t('poweredBy', { link });
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
      if (this.catalogImage) {
        return Utils.createLink(this.catalogImage, 'icon', this.rootLink?.title);
      }
      else {
        return this.getIcon(this.root);
      }
    }
  },
  watch: {
    title(title) {
      if (this.root) {
        const rootTitle = getDisplayTitle(this.root);
        if (rootTitle !== title) {
          title += ` - ${rootTitle}`;
        }
      }
      document.title = title;
      this.setHtmlContent('og-title', title);
    },
    description(description) {
      const summary = Utils.summarizeMd(description, 200);
      this.setHtmlContent('meta-description', summary);
      this.setHtmlContent('og-description', summary);
    },
    uiLanguage: {
      immediate: true,
      async handler(locale) {
        if (!locale) {
          return;
        }
        this.setHtmlContent('og-locale', locale);
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
          else if (this.supportsConformance(languageConformance)) {
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
          if (!isNavigationFailure(error, NavigationFailureType.duplicated)) {
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
          value = this.config[key]; // Original value
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
    await this.$router.isReady();
    this.detectLocale();
    this.parseQuery(this.$route);

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
    setInterval(() => this.$store.dispatch('loadBackground', 3), 200);
  },
  methods: {
    ...mapActions(['switchLocale']),
    ...mapMutations('auth', ['addAction']),
    ...mapActions('auth', ['requestLogin', 'requestLogout']),
    setHtmlContent(id, value) {
      const node = document.getElementById(id);
      if (node) {
        node.setAttribute("content", value);
      }
    },
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
});
</script>

<style lang="scss">
@import "./theme/variables.scss";
@import 'bootstrap/scss/bootstrap';
@import 'bootstrap-vue-next/dist/bootstrap-vue-next.css';
@import "./theme/page.scss";
@import "./theme/custom.scss";
</style>

