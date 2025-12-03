import { createStore } from "vuex";

import URI from "urijs";

import i18n, { getDataLanguages, translateFields, executeCustomFunctions, loadMessages } from '../i18n';
import Utils, { BrowserError } from '../utils';
import { addMissingChildren, getDisplayTitle, createSTAC } from '../models/stac';
import { CatalogLike, STAC } from 'stac-js';

import auth from './auth.js';
import { addQueryIfNotExists, hasAuthority, isAuthenticationError, Loading, processSTAC, stacRequest } from './utils';
import { getBest } from 'stac-js/src/locales';
import fieldsI18n from '@radiantearth/stac-fields/I18N';
import { TYPES } from "../components/ApiCapabilitiesMixin";
import BrowserStorage from "../browser-store.js";

function getStore(config, router) {
  // Local settings (e.g. for currently loaded STAC entity)
  const localDefaults = () => ({
    url: '',
    page: null, // Function that returns title and optionally description of the current page as object
    data: null,
    loading: true,
    parents: null,
    globalError: null,

    localRequestQueryParameters: {},
    stateQueryParameters: {
      language: null,
      asset: [],
      itemdef: []
    },

    apiItems: [],
    apiItemsLink: null,
    apiItemsPagination: {},
    apiItemsNumberMatched: null,
  });

  const catalogDefaults = () => ({
    queue: [],
    privateQueryParameters: {},
    authActions: [],
    conformsTo: [],
    dataLanguage: null,

    apiCollections: [],
    apiItemsLoading: {},
    nextCollectionsLink: null
  });

  return createStore({
    strict: import.meta.env.NODE_ENV !== 'production',
    modules: {
      auth: auth(router)
    },
    state: Object.assign({}, config, localDefaults(), catalogDefaults(), {
      // Global settings
      database: {}, // STAC object, Error object or Loading object or Promise (when loading)
      allowSelectCatalog: !config.catalogUrl,
      globalRequestQueryParameters: config.requestQueryParameters,
      uiLanguage: config.locale
    }),
    getters: {
      isRoot: (state, getters) => {
        if (state.data instanceof STAC) {
          return state.data.equals(getters.root);
        }
        return false;
      },
      title: (state, getters) => {
        if (state.page) {
          const meta = state.page();
          return meta.title;
        }
        else if (state.data instanceof STAC) {
          const fallback = getters.isRoot ? state.catalogTitle : '';
          return getDisplayTitle(state.data, fallback);
        }
        else {
          return "";
        }
      },
      description: state => {
        let description;
        if (state.page) {
          const meta = state.page();
          description = meta.description;
        }
        else if (state.data instanceof STAC) {
          description = state.data.getMetadata('description');
        }
        return Utils.hasText(description) ? description : "";
      },
      getApiItemsLoading: state => data => {
        let id = '';
        if (data instanceof Loading) {
          return true;
        }
        else if (data instanceof STAC) {
          id = data.id;
        }
        else if (typeof data === 'string') {
          id = data;
        }
        return state.apiItemsLoading[id] || false;
      },
      error: state => state.database[state.url] instanceof Error ? state.database[state.url] : null,
      getStac: state => (source, returnErrorObject = false) => {
        if (source instanceof STAC) {
          return source;
        }
        if (Utils.isObject(source) && Utils.hasText(source.href)) {
          source = source.href;
        }
        if (!Utils.hasText(source)) {
          return null;
        }
        let absoluteUrl = Utils.toAbsolute(source, state.url);
        let data = state.database[absoluteUrl];
        if (data instanceof STAC || (returnErrorObject && data instanceof Error)) {
          return data;
        }
        else {
          return null;
        }
      },

      isCollection: state => state.data?.isCollection() || false,
      isCatalog: state => state.data?.isCatalog() || false,
      isCatalogLike: state => state.data?.isCatalogLike() || false,
      isItem: state => state.data?.isItem() || false,

      root: (_, getters) => getters.getStac(getters.rootLink),

      rootLink: state => {
        if (state.catalogUrl) {
          return Utils.createLink(state.catalogUrl, 'root', state.catalogTitle);
        }
        const link = state.data?.getStacLinkWithRel('root');
        if (link) {
          return link;
        }
        else if (state.url && state.data instanceof STAC && state.data.getLinksWithRels(['conformance', 'service-desc', 'service-doc', 'data', 'search']).length > 0) {
          return Utils.createLink(state.url, 'root', getDisplayTitle(state.data, state.catalogTitle));
        }
        else if (state.url) {
          // Fallback: If we detect OGC API like paths, try to guess the paths
          const uri = URI(state.url);
          const path = uri.segment(-2);
          if (['collections', 'items'].includes(path)) {
            uri.segment(-1, "");
            uri.segment(-1, "");
            if (path === 'items') {
              uri.segment(-1, "");
              uri.segment(-1, "");
            }
            return Utils.createLink(uri.toString(), 'root', state.catalogTitle);
          }
        }
        return null;
      },
      parentLink: state => {
        if (state.data instanceof STAC) {
          let link = state.data.getStacLinkWithRel('parent');
          if (link) {
            return link;
          }
        }

        // Fallback: If we detect OGC API like paths, try to guess the paths
        if (state.url) {
          let uri = URI(state.url);
          let path = uri.segment(-2);
          if (['collections', 'items'].includes(path)) {
            uri.segment(-1, "");
            uri.segment(-1, "");
            return Utils.createLink(uri.toString(), 'parent');
          }
        }

        return null;
      },
      collectionLink: state => {
        if (state.data instanceof STAC) {
          let link = state.data?.getStacLinkWithRel('collection');
          if (link) {
            return link;
          }
        }

        // Fallback: If we detect OGC API like paths, try to guess the paths
        if (state.url) {
          let uri = URI(state.url);
          let path = uri.segment(-2);
          if (path == 'items') {
            uri.segment(-1, "");
            uri.segment(-1, "");
            return Utils.createLink(uri.toString(), 'collection');
          }
        }

        return null;
      },
      supportsConformance: state => classes => {
        if(!Array.isArray(classes)) {
          return classes;
        }
        let classRegexp = classes
          .map(c => c.replaceAll('*', '[^/]+').replace(/\/?#/, '/?#'))
          .join('|');
        let regexp = new RegExp('^(' + classRegexp + ')$');
        return Boolean(state.conformsTo.find(uri => uri.match(regexp)));
      },

      canSearch: (state, getters) => {
        return getters.canSearchCollections || getters.canSearchItems;
      },
      canSearchItems: (state, getters) => {
        return getters.supportsConformance(TYPES.Global.BasicFilters);
      },
      canSearchCollections: (state, getters) => {
        return getters.supportsConformance(TYPES.Collections.BasicFilters);
      },

      items: state => {
        if (state.apiItems.length > 0) {
          return state.apiItems;
        }
        else if (state.data) {
          return state.data.getStacLinksWithRel('item');
        }
        return [];
      },
      catalogs: state => {
        let hasCollections = Boolean(state.data instanceof CatalogLike && state.data.getApiCollectionsLink() && state.apiCollections.length > 0);
        let hasChilds = Boolean(state.data instanceof CatalogLike);
        let showCollections = !state.apiCatalogPriority || state.apiCatalogPriority === 'collections';
        let showChilds = !state.apiCatalogPriority || state.apiCatalogPriority === 'childs';
        let catalogs = [];
        if (hasCollections && showCollections) {
          catalogs = catalogs.concat(state.apiCollections);
        }
        if (hasChilds && showChilds) {
          catalogs = addMissingChildren(catalogs, state.data);
        }
        return catalogs;
      },

      toBrowserPath: (state, getters) => url => {
        if (!Utils.hasText(url)) {
          url = '/';
        }

        let absolute = Utils.toAbsolute(url, state.url, false);
        let relative;
        if (!state.allowSelectCatalog && state.catalogUrl) {
          relative = absolute.relativeTo(state.catalogUrl);
        }

        if (typeof relative === 'undefined' || getters.isExternalUrl(absolute, false)) {
          if (!state.allowExternalAccess) {
            return absolute.toString();
          }
          let parts = ['/external'];
          let protocol = absolute.protocol();
          if (protocol !== 'https') {
            parts.push(protocol + ':');
          }
          parts.push(absolute.authority());
          parts.push(absolute.path().replace(/^\//, ''));
          let path = parts.join('/');
          let q = absolute.query();
          if (q) {
            path += `?${q}`;
          }
          return path;
        }
        else {
          return '/' + relative.toString();
        }
      },
      fromBrowserPath: (state, getters) => url => {
        const externalRE = /^\/((search|validation)\/)?external\//;
        if (!Utils.hasText(url) || url === '/') {
          url = state.catalogUrl;
        }
        else if (url.match(externalRE)) {
          let parts = url.replace(externalRE, '').split('/');
          let protocol;
          if (!parts[0].endsWith(':')) {
            protocol = 'https:';
          }
          else {
            protocol = parts.shift();
          }
          url = `${protocol}//${parts.join('/')}`;
        }
        else if (!state.allowSelectCatalog && state.catalogUrl) {
          url = Utils.toAbsolute(url, state.catalogUrl, false);
        }
        return getters.getRequestUrl(url, null, true);
      },
      isExternalUrl: state => (absoluteUrl, whitelist = true) => {
        if (!state.catalogUrl) {
          return false;
        }
        if (!(absoluteUrl instanceof URI)) {
          absoluteUrl = URI(absoluteUrl);
        }
        if (whitelist && Array.isArray(state.allowedDomains) && state.allowedDomains.some(d => hasAuthority(d, absoluteUrl))) {
          return false;
        }
        let relative;
        if (absoluteUrl.is("relative")) {
          relative = absoluteUrl;
        }
        else {
          relative = absoluteUrl.relativeTo(state.catalogUrl);
          if (relative.equals(absoluteUrl)) {
            return true;
          }
        }
        let relativeStr = relative.toString();
        return relativeStr.startsWith('//') || relativeStr.startsWith('../');
      },
      getRequestUrl: (state, getters) => (url, baseUrl = null, addLocalQueryParams = false) => {
        let absoluteUrl = Utils.toAbsolute(url, baseUrl ? baseUrl : state.url, false);
        if (!getters.isExternalUrl(absoluteUrl)) {
          // Check whether private params are present and add them if the URL is part of the catalog
          addQueryIfNotExists(absoluteUrl, state.privateQueryParameters);
          // Check if we need to add global request params
          addQueryIfNotExists(absoluteUrl, state.globalRequestQueryParameters);
          if (addLocalQueryParams) {
            // Check if we need to add local request params
            addQueryIfNotExists(absoluteUrl, state.localRequestQueryParameters);
          }
        }
        return absoluteUrl.toString();
      },

      acceptedLanguages: state => {
        const languages = {};
        // Implement in ascending order so that the higher priority entries override previous ones
        // Wildcard has the lowest priority
        languages['*'] = 0.1;
        // The fallback locale for STAC Browser
        if (Utils.hasText(state.fallbackLocale)) {
          languages[state.fallbackLocale] = 0.2;
        }
        // Locales defined by the browser in ascending order
        // For example, if the browser has "de-CH,de,en" configured,
        // the priority would be: de-CH (0.8), de (0.7), en (0.6)
        // The priority never goes below 0.3
        if (Array.isArray(navigator.languages)) {
          navigator.languages.forEach((locale, i) => languages[locale] = 0.8 - Math.min((i * 0.1), 0.5));
        }
        if (Utils.hasText(state.locale)) {
          // Add the more generic locale code as well.
          // For example, 'de' in addition to 'de-CH'.
          if (state.locale.includes('-')) {
            languages[state.locale.substring(0, 2)] = 0.9;
          }
          // The currently selected locale has the highest priority
          languages[state.locale] = 1;
        }
        return Object.entries(languages)
          .sort((a,b) => {
            if (a[1] > b[1]) {
              return -1;
            }
            else if (a[1] < b[1]) {
              return 1;
            }
            return 0;
          })
          .map(([l, q]) => q >= 1 ? l : `${l};q=${q.toFixed(1)}`)
          .join(',');
      }
    },
    mutations: {
      config(state, config) {
        // This should only be called from the config action
        for (let key in config) {
          let value = config[key];
          switch (key) {
            case 'catalogTitle':
              state.catalogTitle = value;
              break;
            case 'catalogUrl':
              if (typeof value === 'function') {
                state.catalogUrl = value();
              }
              else if (typeof value === 'string') {
                state.catalogUrl = value;
              }
              break;
            case 'crossOriginMedia':
              state.crossOriginMedia = ['anonymous', 'use-credentials'].includes(value) ? value : null;
              break;
            default:
              state[key] = value;
          }
        }
      },
      languages(state, {uiLanguage, dataLanguage}) {
        i18n.global.locale = uiLanguage;
        state.dataLanguage = dataLanguage || null;
        state.uiLanguage = uiLanguage || null;
      },
      setQueryParameter(state, { type, key, value }) {
        type = `${type}QueryParameters`;
        if (typeof value === 'undefined') {
          delete state[type][key];
        }
        else {
          state[type][key] = value;
        }
      },
      setRequestHeader(state, { key, value }) {
        if (typeof value === 'undefined') {
          delete state.requestHeaders[key];
        }
        else {
          state.requestHeaders[key] = value;
        }
      },
      requestAuth(state, callback) {
        if (typeof callback === 'function') {
          state.doAuth.push(callback);
        }
        else {
          state.doAuth = [];
        }
      },
      setAuthData(state, value) {
        state.authData = value;
      },
      state(state, newState) {
        state.stateQueryParameters = newState;
      },
      updateState(state, {type, value}) {
        if (value === null || typeof value === 'undefined') {
          delete state.stateQueryParameters[type];
        }
        else {
          state.stateQueryParameters[type] = value;
        }
      },
      openCollapsible(state, { type, uid }) {
        const idx = state.stateQueryParameters[type].indexOf(uid);
        // need to prevent duplicates because of the way the collapse v-model works
        if (idx === -1) {
          state.stateQueryParameters[type].push(uid);
        }
      },
      closeCollapsible(state, { type, uid }) {
        const idx = state.stateQueryParameters[type].indexOf(uid);
        if (idx > -1) {
          state.stateQueryParameters[type].splice(idx, 1);
        }
      },
      updateLoading(state, { url, show }) {
        let data = state.database[url];
        data.show = show || data.show;
      },
      loading(state, { url, loading }) {
        state.database[url] = loading;
        if (loading.show) {
          state.loading = true;
          state.url = url;
        }
      },
      loaded(state, { url, data }) {
        state.database[url] = processSTAC(state, data);
      },
      clear(state, url) {
        delete state.database[url];
      },
      resetCatalog(state, clearAll) {
        Object.assign(state, catalogDefaults());
        Object.assign(state, localDefaults());
        if (!state.supportedLocales.includes(state.locale)) {
          state.locale = config.locale;
        }
        if (clearAll) {
          state.catalogUrl = config.catalogUrl;
          state.catalogTitle = config.catalogTitle;
          state.database = {};
        }
      },
      resetPage(state) {
        Object.assign(state, localDefaults());
      },
      showPage(state, { url, stac, page }) {
        if (!stac) {
          stac = state.database[url] || null;
        }
        state.url = url || null;
        state.data = stac instanceof STAC ? stac : null;
        state.page = page;
        state.loading = false;
      },
      errored(state, { url, error }) {
        const status = state.database[url];
        if (status instanceof Loading && status.show) {
          state.loading = false;
          state.page = () => ({
            title: i18n.global.t('errors.title')
          });
        }
        if (!(error instanceof Error)) {
          error = new Error(error);
        }
        state.database[url] = error;
      },
      queue(state, url) {
        state.queue.push(url);
      },
      unqueue(state, url) {
        let i = state.queue.indexOf(url);
        if (i !== -1) {
          state.queue.splice(i, 1);
        }
      },
      removeFromQueue(state, num) {
        state.queue.splice(0, num);
      },
      setConformanceClasses(state, classes) {
        if (Array.isArray(classes)) {
          state.conformsTo = classes;
        }
      },
      setApiItemsLink(state, link) {
        state.apiItemsLink = link;
      },
      toggleApiItemsLoading(state, collectionId = '') {
        if (state.apiItemsLoading[collectionId]) {
          delete state.apiItemsLoading[collectionId];
        }
        else {
          state.apiItemsLoading[collectionId] = true;
        }
      },
      setApiItems(state, { data, stac, show }) {
        if (!Utils.isObject(data) || !Array.isArray(data.features)) {
          return;
        }
        let apiItems = data.features.map(feature => processSTAC(state, feature));

        if (show) {
          state.apiItems = apiItems;
        }

        // Handle pagination links
        let pages = Utils.getPaginationLinks(data);

        if (show) {
          state.apiItemsPagination = pages;
        }

        if (show) {
          if (typeof data.numberMatched === 'number') {
            state.apiItemsNumberMatched = data.numberMatched;
          } else {
            state.apiItemsNumberMatched = null;
          }
        }

        if (stac instanceof STAC) {
          // ToDo: Prev link only required when state.apiItems is not cached(?) -> cache apiItems?
          stac.setApiData(apiItems, pages.next, pages.prev);
        }
      },
      addApiCollections(state, { data, stac, show }) {
        if (!Utils.isObject(data) || !Array.isArray(data.collections)) {
          return;
        }

        let collections = data.collections.map(collection => processSTAC(state, collection));
        let nextLink = Utils.getLinkWithRel(data.links, 'next');
        if (show) {
          state.nextCollectionsLink = nextLink;
          state.apiCollections = state.apiCollections.concat(collections);
        }
        if (stac instanceof STAC) {
          stac.setApiData(collections, nextLink);
        }
      },
      resetApiCollections(state) {
        state.apiCollections = [];
        state.apiItemsLoading = {};
        state.nextCollectionsLink = null;
      },
      resetApiItems(state, link) {
        state.apiItems = [];
        state.apiItemsLink = link;
        state.apiItemsPagination = {};
      },
      parents(state, parents) {
        state.parents = parents;
      },
      showGlobalError(state, error) {
        if(error) {
          console.trace(error);
        }
        state.globalError = error;
      }
    },
    actions: {
      async config(cx, config) {
        const oldConfig = Object.assign({}, cx.state);
        cx.commit('config', config);
        // React on config changes
        for (let key in config) {
          let value = cx.state[key];
          if (value !== oldConfig[key]) {
            continue;
          }
          switch (key) {
            case 'authConfig':
              await cx.dispatch('auth/updateMethod', value);
              break;
          }
        }
      },
      async switchLocale(cx, {locale, userSelected}) {
        await cx.dispatch('config', {locale});

        if (cx.state.storeLocale && userSelected) {
          const storage = new BrowserStorage();
          storage.set('locale', locale);
        }

        // Locale for UI
        const uiLanguage = getBest(cx.state.supportedLocales, locale, cx.state.fallbackLocale);
        // Locale for data
        const dataLanguages = getDataLanguages(cx.state.data);
        const dataLanguageCodes = dataLanguages.map(l => l.code);
        const dataLanguageFallback = dataLanguages.length > 0 ? dataLanguages[0].code : uiLanguage;
        const dataLanguage = getBest(dataLanguageCodes, locale, dataLanguageFallback);

        // Load messages
        await loadMessages(uiLanguage);

        // Update stac-fields
        fieldsI18n.setLocales([uiLanguage, cx.state.fallbackLocale]);
        fieldsI18n.setTranslator(translateFields);

        // Execute other custom functions required to localize
        await executeCustomFunctions(uiLanguage);

        cx.commit('languages', {dataLanguage, uiLanguage});
        cx.commit('setQueryParameter', { type: 'state', key: 'language', value: locale });
      },
      async loadBackground(cx, count) {
        let urls = cx.state.queue.slice(0, count);
        if (urls.length > 0) {
          let promises = [];
          for (let url of urls) {
            promises.push(cx.dispatch('load', { url, omitApi: true }));
          }
          cx.commit('removeFromQueue', count);
          return await Promise.all(promises);
        }
      },
      async loadParents(cx) {
        if (!(cx.state.data instanceof STAC)) {
          cx.commit('parents', []);
          return;
        }

        let parents = [];
        let stac = cx.state.data;
        while (stac) {
          let parentLink = stac.getLinkWithRel('parent') || stac.getLinkWithRel('root');
          if (!parentLink) {
            break;
          }
          let url = Utils.toAbsolute(parentLink.href, stac.getAbsoluteUrl());
          await cx.dispatch('load', { url, omitApi: true });
          let parentStac = cx.getters.getStac(url, true);
          if (parentStac instanceof Error) {
            cx.commit('parents', parentStac);
            return;
          }
          if (parentStac === stac) {
            break;
          }
          parents.push(parentStac);
          stac = parentStac;
        }
        cx.commit('parents', parents);
      },
      async tryLogin(cx, {url, action}) {
        cx.commit('clear', url);
        cx.commit('errored', { url, error: new BrowserError(i18n.global.t('authentication.unauthorized')) });
        if (action) {
          cx.commit('auth/addAction', action);
        }
        await cx.dispatch('auth/requestLogin');
      },
      async load(cx, args) {
        let {
          url, // URL to load
          show, // Show the page when loading is finished, otherwise it's likely loaded in the background for completing specific parts of the page
          force, // Force reloading the data, omit the cache
          noRetry, // Don't retry on authentication errors
          omitApi, // Don't load API collections or API items yet
          isRoot // Is a request for the root catalog initiated by this function, avoiding endless loops in some mis-configured instances (see https://github.com/radiantearth/stac-browser/issues/580)
        } = args;

        const path = cx.getters.toBrowserPath(url);
        url = Utils.toAbsolute(url, cx.state.url);

        // Make sure we have all authentication details
        await cx.dispatch("auth/waitForAuth");

        if (force) {
          cx.commit('clear', url);
        }

        let loading = new Loading(show);
        let data = cx.state.database[url];
        if (data instanceof Loading) {
          cx.commit('updateLoading', { url, show });
          return;
        }

        const hasData = data instanceof STAC && !data._incomplete;
        if (!hasData) {
          cx.commit('loading', { url, loading });
          try {
            const response = await stacRequest(cx, url);
            if (!Utils.isObject(response.data)) {
              throw new BrowserError(i18n.global.t('errors.invalidJsonObject'));
            }
            data = createSTAC(response.data, url, path);
            cx.commit('loaded', { url, data });

            if (show) {
              // If we prefer another language abort redirect to the new language
              let localeLink = data.getLocaleLink(cx.state.dataLanguage);
              if (localeLink) {
                router.replace(cx.getters.toBrowserPath(localeLink.href));
                return;
              }
            }

            // Handle conformance classes
            let conformanceLink = data.getStacLinkWithRel('conformance');
            if (Array.isArray(data.conformsTo) && data.conformsTo.length > 0) {
              cx.commit('setConformanceClasses', data.conformsTo);
            }
            else if (conformanceLink) {
              await cx.dispatch('loadOgcApiConformance', conformanceLink);
            }
          } catch (error) {
            if (!noRetry && cx.state.authConfig && isAuthenticationError(error)) {
              await cx.dispatch('tryLogin', {
                url,
                action: () => cx.dispatch('load', Object.assign({noRetry: true, force: true, show: true}, args))
              });
              return;
            }
            console.error(error);
            cx.commit('errored', { url, error });
            return;
          }
        }

        // Load API Collections
        const apiCollectionLink = data instanceof CatalogLike && data.getApiCollectionsLink();
        const apiItemLink = data instanceof CatalogLike && data.getApiItemsLink();
        if (!omitApi && apiCollectionLink) {
          const hasAuthRefs = Utils.size(apiCollectionLink['auth:refs']) > 0;
          const authSchemes = data.getMetadata('auth:schemes');

          if (hasAuthRefs && Utils.size(authSchemes) > 0) {
            await cx.dispatch('auth/configureFromSchemes', authSchemes);
          }

          const shouldLoadCollections = !hasAuthRefs || !Utils.size(authSchemes) || cx.rootGetters['auth/isLoggedIn'];

          if (shouldLoadCollections) {
            let args = { stac: data, show: loading.show };
            try {
              await cx.dispatch('loadNextApiCollections', args);
            } catch (error) {
              cx.commit('showGlobalError', {
                message: i18n.global.t('errors.loadApiCollectionsFailed'),
                error
              });
            }
          } else {
            // Auth required but user not logged in
            cx.commit('showGlobalError', {
              message: i18n.global.t('authentication.unauthorized')
            });
          }
        }
        // Load API Items
        else if (!omitApi && apiItemLink) {
          let args = { stac: data, show: loading.show };
          try {
            await cx.dispatch('loadApiItems', args);
          } catch (error) {
            cx.commit('showGlobalError', {
              message: i18n.global.t('errors.loadApiItemsFailed'),
              error
            });
          }
        }

        // Load the root catalog data if not available (e.g. after page refresh or external access)
        if (!cx.getters.root && !isRoot) {
          let catalogUrl = cx.state.catalogUrl;
          if (!catalogUrl) {
            const root = data.getLinkWithRel('root');
            if (root) {
              catalogUrl = Utils.toAbsolute(root.href, url);
              await cx.dispatch('config', { catalogUrl });
            }
          }
          if (catalogUrl) {
            await cx.dispatch("load", { url: catalogUrl, omitApi: true, isRoot: true });
          }
        }

        // All tasks finished, show the page if requested
        if (loading.show) {
          cx.commit('showPage', { url });
        }
      },
      async loadApiItems(cx, args) {
        let { link, stac, show, filters, noRetry } = args;
        let collectionId = stac instanceof STAC ? stac.id : '';
        cx.commit('toggleApiItemsLoading', collectionId);

        try {
          let baseUrl = cx.state.url;
          if (stac instanceof STAC) {
            link = stac.getApiItemsLink();
            baseUrl = stac.getAbsoluteUrl();
          }
          if (baseUrl) {
            baseUrl = new URI(baseUrl);
          }

          link = Utils.addFiltersToLink(link, filters, cx.state.itemsPerPage);

          let response = await stacRequest(cx, link);
          if (!Utils.isObject(response.data) || !Array.isArray(response.data.features)) {
            throw new BrowserError(i18n.global.t('errors.invalidStacItems'));
          }
          else {
            response.data.features = response.data.features.map(item => {
              try {
                if (!Utils.isObject(item) || item.type !== 'Feature') {
                  return null;
                }
                // See https://github.com/radiantearth/stac-browser/issues/486
                let selfLink = Utils.getLinkWithRel(item.links, 'self');
                let url;
                if (selfLink?.href) {
                  url = Utils.toAbsolute(selfLink.href, baseUrl, false);
                }
                else if (typeof item.id !== 'undefined') {
                  let apiCollectionsLink = cx.getters.root?.getApiCollectionsLink()?.href;
                  if (apiCollectionsLink) {
                    apiCollectionsLink = new URI(apiCollectionsLink);
                  }
                  if (baseUrl && baseUrl.path().endsWith('/')) {
                    url = Utils.toAbsolute(`items/${item.id}`, baseUrl, false);
                  }
                  else if (baseUrl) {
                    url = Utils.toAbsolute(`${collectionId}/items/${item.id}`, baseUrl, false);
                  }
                  else if (apiCollectionsLink?.path().endsWith('/')) {
                    url = Utils.toAbsolute(`${collectionId}/items/${item.id}`, apiCollectionsLink, false);
                  }
                  else if (apiCollectionsLink) {
                    url = Utils.toAbsolute(`collections/${collectionId}/items/${item.id}`, apiCollectionsLink, false);
                  }
                  else if (cx.state.catalogUrl) {
                    url = Utils.toAbsolute(`collections/${collectionId}/items/${item.id}`, cx.state.catalogUrl, false);
                  }
                  else {
                    return null;
                  }
                }
                else {
                  return null;
                }
                url = url.toString();
                let data = cx.getters.getStac(url);
                if (data) {
                  return data;
                }
                else {
                  let itemPath = cx.getters.toBrowserPath(url);
                  data = createSTAC(item, url, itemPath);
                  data._incomplete = true;
                  cx.commit('loaded', { data, url });
                  return data;
                }
              } catch (error) {
                console.error(error);
                return null;
              }
            }).filter(item => item instanceof STAC);
            if (show) {
              cx.commit('setApiItemsLink', link);
            }
            cx.commit('setApiItems', { data: response.data, stac, show });
            cx.commit('toggleApiItemsLoading', collectionId);
            return response;
          }
        } catch (error) {
          cx.commit('toggleApiItemsLoading', collectionId);
          if (!noRetry && cx.state.authConfig && isAuthenticationError(error)) {
            await cx.dispatch('tryLogin', {
              url: link.href,
              action: () => cx.dispatch('loadApiItems', Object.assign({noRetry: true, force: true}, args))
            });
            return;
          }
          throw error;
        }
      },
      async loadNextApiCollections(cx, args) {
        let { stac, show, noRetry } = args;
        let link;
        if (stac) { // First page
          // If we load from new collections, reset list of collections.
          // Otherwise we may append to collections from a parent entity.
          // https://github.com/radiantearth/stac-browser/issues/617
          cx.commit('resetApiCollections');
          link = stac.getLinkWithRel('data');
          link = Utils.addFiltersToLink(link, {}, cx.state.collectionsPerPage);
        }
        else { // Second page and after
          stac = cx.state.data;
          link = cx.state.nextCollectionsLink;
        }
        if (!link) {
          return;
        }
        try {
          let response = await stacRequest(cx, link);
          if (!Utils.isObject(response.data) || !Array.isArray(response.data.collections)) {
            throw new BrowserError(i18n.global.t('errors.invalidStacCollections'));
          }
          else {
            response.data.collections = response.data.collections.map(collection => {
              let selfLink = Utils.getLinkWithRel(collection.links, 'self');
              let url;
              if (selfLink?.href) {
                url = Utils.toAbsolute(selfLink.href, cx.state.url || stac.getAbsoluteUrl(), false);
              }
              else {
                // see https://github.com/radiantearth/stac-browser/issues/486
                let baseUrl = cx.state.catalogUrl || stac.getAbsoluteUrl();
                if (baseUrl) {
                  baseUrl = new URI(baseUrl);
                  if (!baseUrl.path().endsWith('/')) {
                    baseUrl.path(baseUrl.path() + '/');
                  }
                  url = Utils.toAbsolute(`collections/${collection.id}`, baseUrl, false);
                }
              }
              if (!url) {
                return null; // We can't detect a URL, skip this flawed collection
              }
              url = url.toString();
              let data = cx.getters.getStac(url);
              if (data) {
                return data;
              }
              else {
                let collectionPath = cx.getters.toBrowserPath(url);
                data = createSTAC(collection, url, collectionPath);
                data._incomplete = true;
                cx.commit('loaded', { data, url });
                return data;
              }
            });
            cx.commit('addApiCollections', { data: response.data, stac, show });
          }
        } catch (error) {
          if (!noRetry && cx.state.authConfig && isAuthenticationError(error)) {
            await cx.dispatch('tryLogin', {
              url: link.href,
              action: () => cx.dispatch('loadNextApiCollections', Object.assign({noRetry: true, force: true}, args))
            });
            return;
          }
          throw error;
        }
      },
      async loadOgcApiConformance(cx, link) {
        let response = await stacRequest(cx, link);
        if (Utils.isObject(response.data) && Array.isArray(response.data.conformsTo)) {
          cx.commit('setConformanceClasses', response.data.conformsTo);
        }
      },
      async retryAfterAuth(cx) {
        let errorFn = error => cx.commit('showGlobalError', {
          error,
          message: i18n.global.t('errors.authFailed')
        });

        for (let callback of cx.state.doAuth) {
          try {
            let p = callback();
            if (p instanceof Promise) {
              p.catch(errorFn);
            }
          } catch (error) {
            errorFn(error);
          }
        }
      }
    },
  });
}

export default getStore;
