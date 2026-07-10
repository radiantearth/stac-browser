import { createStore } from "vuex";

import { hasText, isObject, size, URI } from 'stac-js/src/utils.js';
import urijs from 'urijs';

import i18n, { loadMessages, detectDataLanguage, updateExternals } from '../i18n';
import Utils, { BrowserError } from '../utils';
import { toAbsolute } from 'stac-js/src/http.js';
import { addMissingChildren, getDisplayTitle, createSTAC } from '../models/stac';
import { STAC } from 'stac-js';

import auth from './auth.js';
import { addQueryIfNotExists, hasAuthority, isAuthenticationError, Loading, stacRequest, stacRequestOptions } from './utils';
import { getBest } from 'stac-js/src/locales';
import { TYPES } from "../components/ApiCapabilitiesMixin";
import BrowserStorage from "../browser-store.js";

// type is either 'collections' or 'items', depending on which endpoint the list was loaded from
function updateApiChildrenState(state, stac, type, list, next = false, prev = false) {
  if (!stac?.isCatalogLike) {
    return;
  }
  const key = stac.getAbsoluteUrl();
  state.apiChildren[key] = {
    type,
    list: Array.isArray(list) ? list : [],
    prev: prev || false,
    next: next || false
  };
}

// Returns the Loading object if a page of children is currently
// being loaded for the given entity, otherwise null.
function getApiChildrenLoading(state, stac) {
  if (!stac?.isCatalogLike) {
    return null;
  }
  const children = state.apiChildren[stac.getAbsoluteUrl()];
  if (children instanceof Loading) {
    return children;
  }
  return children?.loading instanceof Loading ? children.loading : null;
}

// Combines a list of children received from the API with the children linked to
// from the STAC entity, depending on the given priority (see apiCatalogPriority).
// Optionally includes the item links of the entity and pagination links for the API list.
function combineChildren(stac, apiList, priority, { items = [], prev = false, next = false } = {}) {
  const showCollections = !priority || priority === 'collections';
  const showChilds = !priority || priority === 'childs';
  let children = [];
  if (showCollections && apiList.length > 0) {
    children = apiList.slice(0);
  }
  if (showChilds) {
    children = addMissingChildren(children, stac).concat(items);
  }
  if (showCollections && prev) {
    children = [prev].concat(children);
  }
  if (showCollections && next) {
    children.push(next);
  }
  return children;
}

// Fallback for APIs without proper links: If we detect OGC API like paths
// (i.e. `collections/xyz` or `collections/xyz/items/abc`), go up the number of
// levels configured for the detected endpoint to guess the URL of a parent entity.
// Returns the guessed URL as string, or null.
function guessParentUrlFromApiPath(url, levels) {
  const uri = URI(url);
  const path = uri.segment(-2);
  const count = levels[path];
  if (!count) {
    return null;
  }
  for (let i = 0; i < count * 2; i++) {
    uri.segment(-1, "");
  }
  return uri.toString();
}

// Returns the STAC object for the given URL from the cache,
// otherwise creates it from the given data and adds it to the cache.
function getOrCreateStac(cx, data, url) {
  let stac = cx.getters.getStac(url);
  if (!stac) {
    stac = createSTAC(data, url, cx);
    cx.commit('loaded', { url, data: stac });
  }
  return stac;
}

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
      // The currently selected language
      language: null,
      // Expanded Asset and Item Assets
      asset: [],
      itemdef: [],
      // Determine which search tab is active in the API Search view
      searchtype: null,
      // Used for free-text search
      q: []
    },

    apiItems: [],
    apiItemsLink: null,
    apiItemsPagination: {},
    apiItemsNumberMatched: null,
  });

  const catalogDefaults = () => ({
    queue: [],
    privateQueryParameters: {},
    conformsTo: [],
    dataLanguage: null,

    apiCollections: [],
    apiItemsLoading: {},
    nextCollectionsLink: null,
    currentApiCollectionsSearchId: null
  });

  return createStore({
    strict: import.meta.env.NODE_ENV !== 'production',
    modules: {
      auth: auth(router)
    },
    state: Object.assign({}, config, localDefaults(), catalogDefaults(), {
      // Global settings
      database: {}, // STAC object, Error object or Loading object or Promise (when loading)
      // Loading object (when loading the first page) or an object with the props
      // type, list, prev, next and optionally loading (a Loading object when loading another page)
      apiChildren: {},
      downloads: {},
      allowSelectCatalog: !config.catalogUrl,
      globalRequestQueryParameters: config.requestQueryParameters,
      uiLanguage: config.locale,
      colorMode: (config.enforcedColorMode && config.enforcedColorMode !== 'auto') ? config.enforcedColorMode : 'light',
      browserReady: false,
    }),
    getters: {
      isRoot: (state, getters) => {
        if (state.data instanceof STAC) {
          return state.data.is(getters.root);
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
        return hasText(description) ? description : "";
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
        return state.apiItemsLoading[id] instanceof Loading;
      },
      error: state => state.database[state.url] instanceof Error ? state.database[state.url] : null,
      getStac: state => (source, returnErrorObject = false) => {
        if (source instanceof STAC) {
          return source;
        }
        if (isObject(source) && hasText(source.href)) {
          source = source.href;
        }
        if (!hasText(source)) {
          return null;
        }
        let absoluteUrl = toAbsolute(source, state.url);
        let data = state.database[absoluteUrl];
        if (data instanceof STAC || (returnErrorObject && data instanceof Error)) {
          return data;
        }
        else {
          return null;
        }
      },

      isCollection: state => state.data?.isCollection || false,
      isCatalog: state => state.data?.isCatalog || false,
      isCatalogLike: state => state.data?.isCatalogLike || false,
      isItem: state => state.data?.isItem || false,

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
          const rootUrl = guessParentUrlFromApiPath(state.url, { collections: 1, items: 2 });
          if (rootUrl) {
            return Utils.createLink(rootUrl, 'root', state.catalogTitle);
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

        if (state.url) {
          const parentUrl = guessParentUrlFromApiPath(state.url, { collections: 1, items: 1 });
          if (parentUrl) {
            return Utils.createLink(parentUrl, 'parent');
          }
        }

        return null;
      },
      collectionLink: state => {
        if (state.data instanceof STAC) {
          let link = state.data.getStacLinkWithRel('collection');
          if (link) {
            return link;
          }
        }

        if (state.url) {
          const collectionUrl = guessParentUrlFromApiPath(state.url, { items: 1 });
          if (collectionUrl) {
            return Utils.createLink(collectionUrl, 'collection');
          }
        }

        return null;
      },
      supportsConformance: state => classes => {
        if (!Array.isArray(classes)) {
          return classes;
        }
        let classRegexp = classes
          .map(c => c.replaceAll('*', '[^/]+').replace(/\/?#/, '/?#'))
          .join('|');
        let regexp = new RegExp(`^(${classRegexp})$`);
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
      searchBrowserLink: (state, getters) => {
        if (!getters.canSearch) {
          return null;
        }
        let searchLink;
        if (state.data?.isCatalogLike && !state.data.is(getters.root)) {
          searchLink = state.data.getSearchLink();
        }
        if (searchLink) {
          return `/search${getters.toBrowserPath(state.data)}`;
        }
        else if (getters.root && state.allowSelectCatalog) {
          return `/search${getters.toBrowserPath(getters.root)}`;
        }
        return '/search';
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
        if (!state.data?.isCatalogLike) {
          return [];
        }
        // Only include API collections if the entity actually exposes a collections endpoint,
        // otherwise the list may contain stale data from a previously shown entity.
        const hasCollections = Boolean(state.data.getApiCollectionsLink() && state.apiCollections.length > 0);
        return combineChildren(state.data, hasCollections ? state.apiCollections : [], state.apiCatalogPriority);
      },
      isApiChildrenLoading: state => stac => Boolean(getApiChildrenLoading(state, stac)),
      getApiChildren: state => stac => {
        if (!stac?.isCatalogLike) {
          return null;
        }
        return state.apiChildren[stac.getAbsoluteUrl()] || {
          type: null,
          list: [],
          prev: false,
          next: false
        };
      },
      getChildren: (state, getters) => (stac, priority = null) => {
        let apiChildren = getters.getApiChildren(stac);
        if (!apiChildren) {
          return [];
        }
        if (apiChildren instanceof Loading) {
          // The first page of children is still being loaded
          apiChildren = { list: [], prev: false, next: false };
        }
        return combineChildren(stac, apiChildren.list, priority, {
          items: stac.getLinksWithRels(['item']),
          prev: apiChildren.prev,
          next: apiChildren.next
        });
      },

      toBrowserPath: (state, getters) => ref => {
        let url = ref;
        if (isObject(ref)) {
          if (typeof ref.getAbsoluteUrl === 'function') { // stac-js object
            url = ref.getAbsoluteUrl();
          } else if (ref instanceof urijs) { // urijs object
            url = ref.toString();
          } else if (hasText(ref.href)) { // plain STAC Link object
            url = ref.href;
          } else {
            throw new Error('Invalid reference provided to toBrowserPath. Must be a stac-js object, URI object or string URL.');
          }
        }
        if (!hasText(url)) {
          url = '/';
        }

        let absolute = toAbsolute(url, state.url, false);
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
            parts.push(`${protocol}:`);
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
          return `/${relative.toString()}`;
        }
      },
      fromBrowserPath: (state, getters) => url => {
        const externalRE = /^\/((search|validation)\/)?external\//;
        if (!hasText(url) || url === '/') {
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
          url = toAbsolute(url, state.catalogUrl, false);
        }
        return getters.getRequestUrl(url, null, true);
      },
      isExternalUrl: state => (absoluteUrl, whitelist = true) => {
        if (!state.catalogUrl) {
          return false;
        }
        if (!(absoluteUrl instanceof urijs)) {
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
        try {
          let absoluteUrl = toAbsolute(url, baseUrl ? baseUrl : state.url, false);
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
        } catch (e) {
          console.warn(e);
          return url;
        }
      },

      acceptedLanguages: state => {
        const languages = {};
        // Implement in ascending order so that the higher priority entries override previous ones
        // Wildcard has the lowest priority
        languages['*'] = 0.1;
        // The fallback locale for STAC Browser
        if (hasText(state.fallbackLocale)) {
          languages[state.fallbackLocale] = 0.2;
        }
        // Locales defined by the browser in ascending order
        // For example, if the browser has "de-CH,de,en" configured,
        // the priority would be: de-CH (0.8), de (0.7), en (0.6)
        // The priority never goes below 0.3
        if (Array.isArray(navigator.languages)) {
          navigator.languages.forEach((locale, i) => languages[locale] = 0.8 - Math.min((i * 0.1), 0.5));
        }
        if (hasText(state.locale)) {
          // Add the more generic locale code as well.
          // For example, 'de' in addition to 'de-CH'.
          if (state.locale.includes('-')) {
            languages[state.locale.substring(0, 2)] = 0.9;
          }
          // The currently selected locale has the highest priority
          languages[state.locale] = 1;
        }
        return Object.entries(languages)
          .sort((a, b) => {
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
      browserReady(state) {
        state.browserReady = true;
      },
      setColorMode(state, mode) {
        state.colorMode = mode;
      },
      config(state, options) {
        // This should only be called from the config action
        for (let key in options) {
          let value = options[key];
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
      languages(state, { uiLanguage, dataLanguage }) {
        if (typeof uiLanguage !== 'undefined') {
          i18n.global.locale = uiLanguage;
          state.uiLanguage = uiLanguage || null;
        }
        if (typeof dataLanguage !== 'undefined') {
          state.dataLanguage = dataLanguage || null;
        }
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
      state(state, newState) {
        state.stateQueryParameters = newState;
      },
      updateState(state, { type, value }) {
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
      startDownload(state, { href, fileStream }) {
        state.downloads[href] = fileStream || true;
      },
      finishDownload(state, href) {
        delete state.downloads[href];
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
        state.database[url] = data;
      },
      clear(state, url) {
        delete state.database[url];
        delete state.apiChildren[url];
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
          state.apiChildren = {};
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
      // Assigns the Loading object for the entity to the apiChildren directly
      // (like in the database), or to the `loading` property if a list of
      // children is already available. Removes it again if loading is not set.
      loadingApiChildren(state, { stac, loading = null }) {
        if (!stac?.isCatalogLike) {
          return;
        }
        const url = stac.getAbsoluteUrl();
        const children = state.apiChildren[url];
        if (loading instanceof Loading) {
          if (isObject(children) && !(children instanceof Loading)) {
            children.loading = loading;
          }
          else {
            state.apiChildren[url] = loading;
          }
        }
        else if (children instanceof Loading) {
          delete state.apiChildren[url];
        }
        else if (isObject(children)) {
          delete children.loading;
        }
      },
      loadingApiItems(state, { id = '', loading = null }) {
        if (loading instanceof Loading) {
          state.apiItemsLoading[id] = loading;
        }
        else {
          delete state.apiItemsLoading[id];
        }
      },
      setApiItems(state, { data, stac, show }) {
        if (!isObject(data) || !Array.isArray(data.features)) {
          return;
        }

        if (show) {
          state.apiItems = data.features;
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
          updateApiChildrenState(state, stac, 'items', data.features, pages.next, pages.prev);
        }
      },
      addApiCollections(state, { data, stac, show, searching = false, append = false }) {
        if (!isObject(data) || !Array.isArray(data.collections)) {
          return;
        }

        // todo: Convert to stac-js
        let nextLink = Utils.getLinkWithRel(data.links, 'next');
        if (show) {
          state.nextCollectionsLink = nextLink;
          state.apiCollections = state.apiCollections.concat(data.collections);
        }
        if (stac?.isSTAC && !searching) {
          // Accumulate the loaded pages so that all consumers (e.g. the tree)
          // see all collections that have been loaded so far.
          let list = data.collections;
          if (append) {
            const existing = state.apiChildren[stac.getAbsoluteUrl()];
            if (existing?.type === 'collections') {
              list = existing.list.concat(list);
            }
          }
          updateApiChildrenState(state, stac, 'collections', list, nextLink);
        }
      },
      resetApiCollections(state, { list = [], next = null } = {}) {
        state.apiCollections = list;
        state.apiItemsLoading = {};
        state.nextCollectionsLink = next || null;
      },
      setCurrentApiCollectionsSearchId(state, searchId) {
        state.currentApiCollectionsSearchId = searchId;
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
        if (error) {
          console.trace(error);
        }
        state.globalError = error;
      }
    },
    actions: {

      async config(cx, options) {
        const oldConfig = Object.assign({}, cx.state);
        cx.commit('config', options);
        // React on config changes
        const promises = [];
        for (let key in options) {
          let value = cx.state[key];
          if (value === oldConfig[key]) {
            continue;
          }
          switch (key) {
            case 'authConfig':
              promises.push(cx.dispatch('auth/updateMethod', value));
              break;
          }
        }
        await Promise.all(promises);
      },
      async switchLocale(cx, { locale, userSelected }) {
        if (locale === cx.state.locale) {
          return;
        }
        await cx.dispatch('config', { locale });

        // Persist the user selected locale in local storage if configured to do so
        if (cx.state.storeLocale && userSelected) {
          const storage = new BrowserStorage();
          storage.set('locale', locale);
        }

        // Detect Locale for UI and data
        const uiLanguage = getBest(cx.state.supportedLocales, locale, cx.state.fallbackLocale);
        const dataLanguage = detectDataLanguage(cx.state.data, locale, uiLanguage);

        // Load messages
        await loadMessages(uiLanguage);

        // Update dependencies that require the locale to be set (e.g. stac-fields)
        await updateExternals(uiLanguage, cx.state.fallbackLocale);

        // Update store and URL
        cx.commit('languages', { dataLanguage, uiLanguage });
        cx.commit('setQueryParameter', { type: 'state', key: 'language', value: locale });
      },
      // eslint-disable-next-line require-await
      async switchDataLocale(cx, { locale }) {
        const dataLanguage = detectDataLanguage(cx.state.data, locale, cx.state.uiLanguage);
        cx.commit('languages', { dataLanguage });
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
          let url = toAbsolute(parentLink.href, stac.getAbsoluteUrl());
          // eslint-disable-next-line no-await-in-loop
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
      // Executes a request for the given STAC link (or URL) and returns the response.
      // This is the single place that handles authentication errors for requests:
      // If the request fails with an authentication error, asks the user to log in
      // and settles with the result of the retried request after the login.
      // If the user aborts the login or logs out, fails with the original error.
      async request(cx, args) {
        const { link, axiosOptions, noRetry } = (isObject(args) && args.link) ? args : { link: args };
        try {
          return await stacRequest(cx, link, axiosOptions);
        } catch (error) {
          if (noRetry || !cx.state.authConfig || cx.getters['auth/isLoggedIn'] || !isAuthenticationError(error)) {
            throw error;
          }
          return await new Promise((resolve, reject) => {
            cx.commit('auth/addAction', {
              run: () => cx.dispatch('request', { link, axiosOptions, noRetry: true }).then(resolve, reject),
              cancel: () => reject(error)
            });
            cx.dispatch('auth/requestLogin').catch(reject);
          });
        }
      },
      async load(cx, args) {
        let {
          url, // URL to load
          show, // Show the page when loading is finished, otherwise it's likely loaded in the background for completing specific parts of the page
          force, // Force reloading the data, omit the cache
          omitApi, // Don't load API collections or API items yet
          isRoot // Is a request for the root catalog initiated by this function, avoiding endless loops in some mis-configured instances (see https://github.com/radiantearth/stac-browser/issues/580)
        } = args;

        url = toAbsolute(url, cx.state.url);

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
            const response = await cx.dispatch('request', { link: url });
            if (!isObject(response.data)) {
              throw new BrowserError(i18n.global.t('errors.invalidJsonObject'));
            }
            data = createSTAC(response.data, url, cx);
            if (!(data instanceof STAC)) {
              // Might be a request to the /collections or .../items endpoints,
              // which returns an APICollection, not a STAC object.
              throw new BrowserError(i18n.global.t('errors.apiListRequested'));
            }
            cx.commit('loaded', { url, data });

            if (show) {
              // If we prefer another language abort redirect to the new language
              let localeLink = data.getLocaleLink(cx.state.dataLanguage);
              if (localeLink) {
                router.replace(cx.getters.toBrowserPath(localeLink));
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
            console.error(error);
            cx.commit('errored', { url, error });
            return;
          }
        }

        // Load API Collections
        const apiCollectionLink = data.isCatalogLike && data.getApiCollectionsLink();
        const apiItemLink = data.isCatalogLike && data.getApiItemsLink();
        if (!omitApi && apiCollectionLink) {
          let loadArgs = { stac: data, show: loading.show };
          try {
            await cx.dispatch('loadNextApiCollections', loadArgs);
          } catch (error) {
            cx.commit('showGlobalError', {
              message: i18n.global.t('errors.loadApiCollectionsFailed'),
              error
            });
          }
        }
        // Load API Items
        else if (!omitApi && apiItemLink) {
          let loadArgs = { stac: data, show: loading.show };
          try {
            await cx.dispatch('loadApiItems', loadArgs);
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
            const root = data.getRootLink();
            if (root) {
              catalogUrl = toAbsolute(root.href, url);
              await cx.dispatch('config', { catalogUrl });
            }
          }
          if (catalogUrl && url !== catalogUrl) {
            // todo: In principle we could set omitApi: true in many cases here,
            // but until we can reliably load the API data on demand, we fully load it.
            // https://github.com/radiantearth/stac-browser/issues/796
            await cx.dispatch('load', { url: catalogUrl, isRoot: true });
          }
        }

        // All tasks finished, show the page if requested
        if (loading.show) {
          cx.commit('showPage', { url });
          // If we don't have a catalogUrl but have a page to show,
          // we should assume this URL is the root catalog for now.
          if (!cx.state.catalogUrl) {
            await cx.dispatch('config', { catalogUrl: url });
          }
        }
      },
      async loadApiItems(cx, args) {
        let { link, stac, show, filters } = args;
        let collectionId = stac instanceof STAC ? stac.id : '';
        cx.commit('loadingApiItems', { id: collectionId, loading: new Loading(show) });
        try {
          let baseUrl = cx.state.url;
          if (stac instanceof STAC) {
            link = stac.getApiItemsLink();
            baseUrl = stac.getAbsoluteUrl();
          }
          if (baseUrl) {
            baseUrl = URI(baseUrl);
          }

          let sort = null;
          if (cx.getters.supportsConformance(TYPES.Items.Sort)) {
            sort = cx.state.defaultItemSort;
          }
          link = Utils.addFiltersToLink(link, filters, cx.state.itemsPerPage, sort);

          let response = await cx.dispatch('request', { link });
          if (!isObject(response.data) || !Array.isArray(response.data.features)) {
            throw new BrowserError(i18n.global.t('errors.invalidStacItems'));
          }
          else {
            // todo: Convert data to stac-js
            response.data.features = response.data.features.map(item => {
              try {
                if (!isObject(item) || item.type !== 'Feature') {
                  return null;
                }
                // See https://github.com/radiantearth/stac-browser/issues/486
                let selfLink = Utils.getLinkWithRel(item.links, 'self');
                let url;
                if (selfLink?.href) {
                  url = toAbsolute(selfLink.href, baseUrl, false);
                }
                else if (typeof item.id !== 'undefined') {
                  let apiCollectionsLink = cx.getters.root?.getApiCollectionsLink()?.href;
                  if (apiCollectionsLink) {
                    apiCollectionsLink = URI(apiCollectionsLink);
                  }
                  if (baseUrl && baseUrl.path().endsWith('/')) {
                    url = toAbsolute(`items/${item.id}`, baseUrl, false);
                  }
                  else if (baseUrl) {
                    url = toAbsolute(`${collectionId}/items/${item.id}`, baseUrl, false);
                  }
                  else if (apiCollectionsLink?.path().endsWith('/')) {
                    url = toAbsolute(`${collectionId}/items/${item.id}`, apiCollectionsLink, false);
                  }
                  else if (apiCollectionsLink) {
                    url = toAbsolute(`collections/${collectionId}/items/${item.id}`, apiCollectionsLink, false);
                  }
                  else if (cx.state.catalogUrl) {
                    url = toAbsolute(`collections/${collectionId}/items/${item.id}`, cx.state.catalogUrl, false);
                  }
                  else {
                    return null;
                  }
                }
                else {
                  return null;
                }
                return getOrCreateStac(cx, item, url.toString());
              } catch (error) {
                console.error(error);
                return null;
              }
            }).filter(item => item instanceof STAC);
            if (show) {
              cx.commit('setApiItemsLink', link);
            }
            cx.commit('setApiItems', { data: response.data, stac, show });
            return response;
          }
        } finally {
          cx.commit('loadingApiItems', { id: collectionId });
        }
      },
      async loadNextApiCollections(cx, args) {
        let { stac, show, q, searching = false, searchRequestId, next = false } = args;
        let link;
        let reset = false;
        const firstPage = Boolean(stac) && !next;
        if (firstPage) {
          if (show) {
            // Track request IDs for both searching and non-searching reloads
            // so stale responses can be discarded consistently.
            if (searchRequestId === undefined) {
              // Ensure non-search requests also get an ID so stale responses can be discarded.
              searchRequestId = Date.now();
            }
            cx.commit('setCurrentApiCollectionsSearchId', searchRequestId);
          }
          if (!searching) {
            // Reuse the collections that have already been loaded for this entity
            // instead of fetching (and starting over from) the first page again.
            const cached = cx.state.apiChildren[stac.getAbsoluteUrl()];
            if (cached?.type === 'collections') {
              if (show) {
                cx.commit('resetApiCollections', cached);
              }
              return;
            }
            if (show) {
              // If we load from new collections, reset list of collections.
              // Otherwise we may append to collections from a parent entity.
              // https://github.com/radiantearth/stac-browser/issues/617
              cx.commit('resetApiCollections');
            }
          }
          else if (show) {
            // When searching, only reset after the request to ensure the previous list remains visible if the request fails.
            reset = true;
          }
          link = stac.getLinkWithRel('data');
          let sort = null;
          if (cx.getters.supportsConformance(TYPES.Collections.Sort)) {
            sort = cx.state.defaultCollectionSort;
          }
          const filters = {};
          if (cx.getters.supportsConformance(TYPES.Collections.FreeText) && searching && size(q) > 0) {
            filters.q = q;
          }
          link = Utils.addFiltersToLink(link, filters, cx.state.collectionsPerPage, sort);
        }
        else if (next && !searching && stac?.isCatalogLike) {
          // Load the next page of collections for the given entity (e.g. from the tree)
          const cached = cx.state.apiChildren[stac.getAbsoluteUrl()];
          if (cached?.type !== 'collections') {
            return;
          }
          link = cached.next;
          // Keep the currently shown collection list in sync if it shows the same list
          show = show || cx.state.nextCollectionsLink === link;
        }
        else { // Second page and after for the currently shown collection list
          stac = cx.state.data;
          link = cx.state.nextCollectionsLink;
        }
        if (!link) {
          return;
        }
        // Assign a Loading object to the apiChildren while loading so that the same
        // page is not requested multiple times in parallel, e.g. by the tree and the
        // collection list auto-loading the next page simultaneously.
        // Requests for search results are not tracked, they don't belong to the children.
        const track = !searching && stac?.isCatalogLike;
        if (track) {
          const pending = getApiChildrenLoading(cx.state, stac);
          if (pending && (pending.show || !show)) {
            // The pending request covers everything this request would do
            return;
          }
          cx.commit('loadingApiChildren', { stac, loading: new Loading(show) });
        }
        try {
          let response = await cx.dispatch('request', { link });
          // Check if this response is still relevant (not superseded by a newer search request)
          if (searchRequestId !== undefined && searchRequestId !== cx.state.currentApiCollectionsSearchId) {
            // Discard results from stale search requests
            return;
          }
          if (!isObject(response.data) || !Array.isArray(response.data.collections)) {
            throw new BrowserError(i18n.global.t('errors.invalidStacCollections'));
          }
          else {
            // todo: Convert data to stac-js
            response.data.collections = response.data.collections.map(collection => {
              let selfLink = Utils.getLinkWithRel(collection.links, 'self');
              let url;
              if (selfLink?.href) {
                url = toAbsolute(selfLink.href, cx.state.url || stac.getAbsoluteUrl(), false);
              }
              else {
                // see https://github.com/radiantearth/stac-browser/issues/486
                let baseUrl = cx.state.catalogUrl || stac.getAbsoluteUrl();
                if (baseUrl) {
                  baseUrl = URI(baseUrl);
                  if (!baseUrl.path().endsWith('/')) {
                    baseUrl.path(`${baseUrl.path()}/`);
                  }
                  url = toAbsolute(`collections/${collection.id}`, baseUrl, false);
                }
              }
              if (!url) {
                return null; // We can't detect a URL, skip this flawed collection
              }
              return getOrCreateStac(cx, collection, url.toString());
            }).filter(Boolean);
            if (reset) {
              cx.commit('resetApiCollections');
            }
            cx.commit('addApiCollections', {
              data: response.data, stac, show, searching, append: !firstPage
            });
          }
        } finally {
          if (track) {
            cx.commit('loadingApiChildren', { stac });
          }
        }
      },
      async loadOgcApiConformance(cx, link) {
        let response = await cx.dispatch('request', { link });
        if (isObject(response.data) && Array.isArray(response.data.conformsTo)) {
          cx.commit('setConformanceClasses', response.data.conformsTo);
        }
      },
      async altDownload(cx, args) {
        const { link, noRetry } = (isObject(args) && args.link) ? args : { link: args };
        const options = stacRequestOptions(cx, link);
        try {
          // Enable the loading indicator
          cx.commit('startDownload', { href: options.url });
          const StreamSaver = (await import('streamsaver-js')).default;

          const uri = URI(window.origin.toString());
          uri.path(`${Utils.removeTrailingSlash(cx.state.pathPrefix)}/mitm.html`);
          StreamSaver.mitm = uri.toString();

          // Convert from axios to fetch
          const axiosOptions = Object.assign({}, options);
          const url = axiosOptions.url;
          delete axiosOptions.url;
          if (typeof axiosOptions.data !== 'undefined') {
            axiosOptions.body = axiosOptions.data;
            delete axiosOptions.data;
          }
          // Use fetch because stacRequest uses axios
          // and axios doesn't support responseType: 'stream'
          const res = await fetch(url, axiosOptions);
          // todo: use getErrorMessage / getErrorCode instead?
          if (res.status >= 400) {
            if ([401, 403].includes(res.status) && !noRetry && cx.state.authConfig && !cx.getters['auth/isLoggedIn']) {
              // Ask the user to log in and restart the download afterwards
              cx.commit('auth/addAction', () => cx.dispatch('altDownload', { link, noRetry: true }));
              await cx.dispatch('auth/requestLogin');
              return;
            }
            let msg;
            switch (res.status) {
              case 401:
                msg = i18n.global.t('errors.unauthorized');
                break;
              case 403:
                msg = i18n.global.t('errors.authFailed');
                break;
              case 404:
                msg = i18n.global.t('errors.notFound');
                break;
              case 500:
                msg = i18n.global.t('errors.serverError');
                break;
              default:
                msg = i18n.global.t('errors.networkError');
                break;
            }
            throw new Error(msg);
          }

          const filename = Utils.assetFilename(link, res);
          const fileStream = StreamSaver.createWriteStream(filename);
          cx.commit('startDownload', { href: options.url, fileStream });
          await res.body.pipeTo(fileStream);
        } catch (error) {
          if (error instanceof DOMException && error.name === 'AbortError') {
            // When the download was aborted, we don't want to show an error
            return;
          }
          cx.commit('showGlobalError', { error });
        } finally {
          cx.commit('finishDownload', options.url);
        }
      },
    },
  });
}

export default getStore;
