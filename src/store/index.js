import Vue from "vue";
import Vuex from "vuex";

import URI from "urijs";

import i18n from '../i18n';
import { stacBrowserSpecialHandling } from "../rels";
import Utils, { BrowserError } from '../utils';
import STAC from '../models/stac';

import auth from './auth.js';
import { addQueryIfNotExists, isAuthenticationError, Loading, processSTAC, proxyUrl, unproxyUrl, stacRequest } from './utils';
import { getBest } from '../locale-id';
import I18N from '@radiantearth/stac-fields/I18N';
import { translateFields, executeCustomFunctions, loadMessages } from '../i18n';
import { TYPES } from "../components/ApiCapabilitiesMixin";
import BrowserStorage from "../browser-store.js";

function getStore(config, router) {
  // Local settings (e.g. for currently loaded STAC entity)
  const localDefaults = () => ({
    url: '',
    title: config.catalogTitle,
    description: null,
    data: null,
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
    apiItemsPagination: {}
  });

  const catalogDefaults = () => ({
    queue: [],
    privateQueryParameters: {},
    authActions: [],
    conformsTo: [],
    dataLanguage: null,
    dataLanguages: [],

    apiCollections: [],
    apiItemsLoading: {},
    nextCollectionsLink: null
  });

  return new Vuex.Store({
    strict: process.env.NODE_ENV !== 'production',
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
      loading: state => !state.url || !state.data || state.database[state.url] instanceof Loading,
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

      displayCatalogTitle: (state, getters) => STAC.getDisplayTitle(getters.root, state.catalogTitle),

      isCollection: state => state.data?.isCollection() || false,
      isCatalog: state => state.data?.isCatalog() || false,
      isCatalogLike: state => state.data?.isCatalogLike() || false,
      isItem: state => state.data?.isItem() || false,

      root: (_, getters) => getters.getStac(getters.rootLink),

      rootLink: state => {
        let link = state.data?.getStacLinkWithRel('root');
        if (link) {
          return link;
        }
        else if (state.catalogUrl) {
          return Utils.createLink(state.catalogUrl, 'root');
        }
        else if (state.url && state.data instanceof STAC && state.data.getLinksWithRels(['conformance', 'service-desc', 'service-doc', 'data', 'search']).length > 0) {
          return Utils.createLink(state.url, 'root');
        }
        else if (state.url) {
          // Fallback: If we detect OGC API like paths, try to guess the paths
          let uri = URI(state.url);
          let path = uri.segment(-2);
          if (['collections', 'items'].includes(path)) {
            uri.segment(-1, "");
            uri.segment(-1, "");
            if (path === 'items') {
              uri.segment(-1, "");
              uri.segment(-1, "");
            }
            return Utils.createLink(uri.toString(), 'root');
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
      supportsExtension: state => schemaUri => {
        return Utils.supportsExtension(state.data, schemaUri);
      },

      canSearch: (state, getters) => {
        return getters.canSearchCollections || getters.canSearchItems;
      },
      canSearchItems: (state, getters) => {
        return getters.supportsConformance(TYPES.Items.BasicFilters);
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
        let hasCollections = Boolean(state.data instanceof STAC && state.data.getApiCollectionsLink() && state.apiCollections.length > 0);
        let hasChilds = Boolean(state.data instanceof STAC);
        let showCollections = !state.apiCatalogPriority || state.apiCatalogPriority === 'collections';
        let showChilds = !state.apiCatalogPriority || state.apiCatalogPriority === 'childs';
        let catalogs = [];
        if (hasCollections && showCollections) {
          catalogs = catalogs.concat(state.apiCollections);
        }
        if (hasChilds && showChilds) {
          catalogs = STAC.addMissingChildren(catalogs, state.data);
        }
        return catalogs;
      },

      // hasAsset also checks whether the assets have a href and thus are not item asset definitions
      hasAssets: (state, getters) => Boolean(Object.values(getters.assets).find(asset => Utils.isObject(asset) && typeof asset.href === 'string')),
      assets: (state, getters) => {
        if (!Utils.isObject(state.data?.assets)) {
          return {};
        }
        else if (state.showThumbnailsAsAssets) {
          return state.data.assets;
        }
        else {
          let assets = {};
          let thumbnails = getters.thumbnails;
          for (let key in state.data.assets) {
            let asset = state.data.assets[key];
            if (!thumbnails.includes(asset)) {
              assets[key] = asset;
            }
          }
          return assets;
        }
      },
      thumbnails: state => state.data ? state.data.getThumbnails(true) : [],
      additionalLinks: state => state.data ? state.data.getLinksWithOtherRels(stacBrowserSpecialHandling).filter(link => link.rel !== 'preview' || !Utils.canBrowserDisplayImage(link)) : [],

      toBrowserPath: (state, getters) => url => {
        if (!Utils.hasText(url)) {
          url = '/';
        }

        let absolute = Utils.toAbsolute(unproxyUrl(url, state.stacProxyUrl), state.url, false);
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
        const externalRE = /^\/(search\/)?external\//;
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
        if (whitelist && Array.isArray(state.allowedDomains) && state.allowedDomains.includes(absoluteUrl.domain())) {
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
        let absoluteUrl = Utils.toAbsolute(proxyUrl(url, state.stacProxyUrl), baseUrl ? baseUrl : state.url, false);
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
        // If we are proxying a STAC Catalog, replace any URI with the proxied address.
        return absoluteUrl.toString();
      },

      acceptedLanguages: state => {
        const languages = {};
        // Implement in ascending order:
        languages['en'] = 0.1;
        if (Array.isArray(state.supportedLocales)) {
          state.supportedLocales.forEach(locale => languages[locale] = 0.2);
        }
        if (Utils.hasText(state.fallbackLocale)) {
          languages[state.fallbackLocale] = 0.5;
        }
        if (Array.isArray(navigator.languages)) {
          navigator.languages.forEach(locale => languages[locale] = 0.7);
        }
        if (Utils.hasText(state.locale)) {
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
          .map(([l, q]) => q >= 1 ? l : `${l};q=${q}`)
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
            case 'cardViewSort':
              switch(value) {
                case 'asc':
                  state.cardViewSort = 1;
                  break;
                case 'desc':
                  state.cardViewSort = -1;
                  break;
                default:
                  state.cardViewSort = 0;
              }
              break;
            default:
              state[key] = value;
          }
        }
      },
      languages(state, {uiLanguage, dataLanguage}) {
        state.dataLanguage = dataLanguage || null;
        state.uiLanguage = uiLanguage || null;
      },
      setQueryParameter(state, { type, key, value }) {
        type = `${type}QueryParameters`;
        if (typeof value === 'undefined') {
          Vue.delete(state[type], key);
        }
        else {
          Vue.set(state[type], key, value);
        }
      },
      setRequestHeader(state, { key, value }) {
        if (typeof value === 'undefined') {
          Vue.delete(state.requestHeaders, key);
        }
        else {
          Vue.set(state.requestHeaders, key, value);
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
          Vue.delete(state.stateQueryParameters, type);
        }
        else {
          Vue.set(state.stateQueryParameters, type, value);
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
          Vue.delete(state.stateQueryParameters[type], idx);
        }
      },
      updateLoading(state, { url, show, loadApi }) {
        let data = state.database[url];
        Vue.set(data, 'show', show || data.show);
        Vue.set(data, 'loadApi', loadApi || data.loadApi);
      },
      loading(state, { url, loading }) {
        Vue.set(state.database, url, loading);
        if (loading.show) {
          state.url = url;
        }
      },
      loaded(state, { url, data }) {
        Vue.set(state.database, url, processSTAC(state, data));
      },
      clear(state, url) {
        Vue.delete(state.database, url);
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
      setPageMetadata(state, { title, description }) {
        state.title = title;
        if (typeof description !== 'undefined') {
          state.description = description;
        }
      },
      showPage(state, { url, title, description, stac }) {
        if (!stac) {
          stac = state.database[url] || null;
        }
        state.url = url || null;
        state.data = stac instanceof STAC ? stac : null;
        state.description = description;

        // Set title
        if (title) {
          state.title = title;
        }
        else {
          state.title = STAC.getDisplayTitle(state.data, state.catalogTitle);
          if (state.data) {
            let description = state.data.getMetadata('description');
            if (Utils.hasText(description)) {
              state.description = description;
            }
          }
        }

        if (state.data) {
          let source = state.data.isItem() ? state.data.properties : state.data;
          let languages = Array.isArray(source.languages) ? source.languages.slice() : [];
          if (Utils.isObject(source.language)) {
            languages.unshift(source.language);
          }
          state.dataLanguages = languages.filter(lang => Utils.isObject(lang) && typeof lang.code === 'string');
        }
      },
      errored(state, { url, error }) {
        if (!(error instanceof Error)) {
          error = new Error(error);
        }
        Vue.set(state.database, url, error);
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
          Vue.delete(state.apiItemsLoading, collectionId);
        }
        else {
          Vue.set(state.apiItemsLoading, collectionId, true);
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
        cx.commit('config', config);
        // React on config changes
        for (let key in config) {
          let value = cx.state[key];
          switch (key) {
            case 'catalogUrl':
              if (value) {
                // Load the root catalog data if not available (e.g. after page refresh or external access)
                await cx.dispatch("load", { url: value, loadApi: true });
              }
              break;
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
        let uiLanguage = getBest(cx.state.supportedLocales, locale, cx.state.fallbackLocale);
        // Locale for data
        let dataLanguageCodes = cx.state.dataLanguages.map(l => l.code);
        let dataLanguageFallback = cx.state.dataLanguages.length > 0 ? cx.state.dataLanguages[0].code : uiLanguage;
        let dataLanguage = getBest(dataLanguageCodes, locale, dataLanguageFallback);

        // Load messages
        await loadMessages(uiLanguage);

        // Update stac-fields
        I18N.setLocales([uiLanguage, cx.state.fallbackLocale]);
        I18N.setTranslator(translateFields);

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
            promises.push(cx.dispatch('load', { url }));
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
          await cx.dispatch('load', { url, loadApi: true });
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
        cx.commit('errored', { url, error: new BrowserError(i18n.t('authentication.unauthorized')) });
        if (action) {
          cx.commit('auth/addAction', action);
        }
        await cx.dispatch('auth/requestLogin');
      },
      async load(cx, args) {
        let { url, show, loadApi, loadRoot, force, noRetry } = args;

        let path = cx.getters.toBrowserPath(url);
        url = Utils.toAbsolute(url, cx.state.url);

        // Make sure we have all authentication details
        await cx.dispatch("auth/waitForAuth");

        // Load the root catalog data if not available (e.g. after page refresh or external access)
        if (!loadRoot && path !== '/' && cx.state.catalogUrl && !cx.getters.getStac(cx.state.catalogUrl)) {
          await cx.dispatch("load", { url: cx.state.catalogUrl, loadApi: true, loadRoot: true });
        }

        if (force) {
          cx.commit('clear', url);
        }

        let loading = new Loading(show, loadApi);
        let data = cx.state.database[url];
        if (data instanceof Loading) {
          cx.commit('updateLoading', { url, show, loadApi });
          return;
        }
        else if (!data || data instanceof Error || (data instanceof STAC && data.isPotentiallyIncomplete())) {
          cx.commit('loading', { url, loading });
          try {
            let response = await stacRequest(cx, url);
            if (!Utils.isObject(response.data)) {
              throw new BrowserError(i18n.t('errors.invalidJsonObject'));
            }
            data = new STAC(response.data, url, path);
            cx.commit('loaded', { url, data });

            if (show) {
              // If we prefer another language abort redirect to the new language
              let localeLink = data.getLocaleLink(cx.state.dataLanguage);
              if (localeLink) {
                router.replace(cx.getters.toBrowserPath(localeLink.href));
                return;
              }
            }

            if (!cx.getters.root) {
              let root = data.getLinkWithRel('root');
              if (root) {
                await cx.dispatch('config', { catalogUrl: Utils.toAbsolute(root.href, url) });
              }
            }

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
          }
        }

        if (loading.loadApi && data instanceof STAC) {
          // Load API Collections
          if (data.getApiCollectionsLink()) {
            let args = { stac: data, show: loading.show };
            try {
              await cx.dispatch('loadNextApiCollections', args);
            } catch (error) {
              cx.commit('showGlobalError', {
                message: i18n.t('errors.loadApiCollectionsFailed'),
                error
              });
            }
          }
          // Load API Items
          if (data.getApiItemsLink()) {
            let args = { stac: data, show: loading.show };
            try {
              await cx.dispatch('loadApiItems', args);
            } catch (error) {
              cx.commit('showGlobalError', {
                message: i18n.t('errors.loadApiItemsFailed'),
                error
              });
            }
          }
        }

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

          link = Utils.addFiltersToLink(link, filters, cx.state.itemsPerPage);

          let response = await stacRequest(cx, link);
          if (!Utils.isObject(response.data) || !Array.isArray(response.data.features)) {
            throw new BrowserError(i18n.t('errors.invalidStacItems'));
          }
          else {
            response.data.features = response.data.features.map(item => {
              try {
                if (!Utils.isObject(item) || item.type !== 'Feature') {
                  return null;
                }
                let selfLink = Utils.getLinkWithRel(item.links, 'self');
                let url;
                if (selfLink?.href) {
                  url = Utils.toAbsolute(selfLink.href, baseUrl);
                }
                else if (typeof item.id !== 'undefined') {
                  let apiCollectionsLink = cx.getters.root?.getApiCollectionsLink();
                  if (baseUrl) {
                    url = Utils.toAbsolute(`items/${item.id}`, baseUrl);
                  }
                  else if (apiCollectionsLink) {
                    url = Utils.toAbsolute(`${collectionId}/items/${item.id}`, apiCollectionsLink.href);
                  }
                  else if (cx.state.catalogUrl) {
                    url = Utils.toAbsolute(`collections/${collectionId}/items/${item.id}`, cx.state.catalogUrl);
                  }
                  else {
                    return null;
                  }
                }
                else {
                  return null;
                }
                let data = cx.getters.getStac(url);
                if (data) {
                  return data;
                }
                else {
                  data = new STAC(item, url, cx.getters.toBrowserPath(url));
                  data.markPotentiallyIncomplete();
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
        if (stac) {
          // First page
          if (cx.state.apiCollections.length > 0) {
            // If we have already loaded collections, skip loading the first page
            return;
          }
          link = stac.getLinkWithRel('data');
        }
        else {
          // Second page and after
          stac = cx.state.data;
          link = cx.state.nextCollectionsLink;
        }
        if (!link) {
          return;
        }
        try {
          let response = await stacRequest(cx, link);
          if (!Utils.isObject(response.data) || !Array.isArray(response.data.collections)) {
            throw new BrowserError(i18n.t('errors.invalidStacCollections'));
          }
          else {
            response.data.collections = response.data.collections.map(collection => {
              let selfLink = Utils.getLinkWithRel(collection.links, 'self');
              let url;
              if (selfLink?.href) {
                url = Utils.toAbsolute(selfLink.href, cx.state.url || stac.getAbsoluteUrl());
              }
              else {
                url = Utils.toAbsolute(`collections/${collection.id}`, cx.state.catalogUrl || stac.getAbsoluteUrl());
              }
              let data = cx.getters.getStac(url);
              if (data) {
                return data;
              }
              else {
                data = new STAC(collection, url, cx.getters.toBrowserPath(url));
                data.markPotentiallyIncomplete();
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
      async loadGeoJson(cx, link) {
        try {
          let response = await stacRequest(cx, link);
          return response.data; // Use data with $refs included as fallback anyway
        } catch (error) {
          return null;
        }
      },
      async retryAfterAuth(cx) {
        let errorFn = error => cx.commit('showGlobalError', {
          error,
          message: i18n.t('errors.authFailed')
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
