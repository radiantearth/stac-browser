import Vue from "vue";
import Vuex from "vuex";
import axios from "axios";
import Utils from '../utils';
import STAC from '../models/stac';
import bs58 from 'bs58';
import { isAuthenticationError, Loading, processSTAC, stacRequest } from './utils';
import { BrowserError } from '../utils';
import URI from "urijs";
import Queryable from '../models/queryable';

Vue.use(Vuex);

function createBlankStateQueryParameters () {
  return {
    asset: [],
    itemdef: []
  };
}

function getStore(config) {
  // Local settings (e.g. for currently loaded STAC entity)
  const localDefaults = () => ({
    url: '',
    title: config.catalogTitle,
    data: null,
    valid: null,
    parents: null,
    globalError: null,

    apiItems: [],
    apiItemsLink: null,
    apiItemsFilter: {},
    apiItemsPagination: {},

    queryables: null
  });

  const catalogDefaults = () => ({
    database: {}, // STAC object, Error object or Loading object or Promise (when loading)
    queue: [],
    redirectUrl: null,
    privateQueryParameters: {},
    doAuth: [],
    conformsTo: [],

    apiCollections: [],
    apiItemsLoading: {},
    nextCollectionsLink: null
  });

  return new Vuex.Store({
    strict: true,
    state: Object.assign({}, config, localDefaults(), catalogDefaults(), {
      // Global settings
      allowSelectCatalog: !config.catalogUrl,
      stacIndex: [],
      supportedRelTypes: [ // These will be handled in a special way and will not be shown in the link lists
        'child',
        'collection',
        'conformance',
        'data',
        'first',
        'icon',
        'item',
        'items',
        'last',
        'license',
        'next',
        'prev',
        'parent',
        'queryables',
        'root',
        'search',
        'self',
      ],
      stateQueryParameters: createBlankStateQueryParameters(),
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

      stacVersion: state => state.data?.stac_version,

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
            return Utils.createLink(uri.toString(), 'collection');
          }
        }

        return null;
      },
      searchLink: (state, getters) => {
        let links = [];
        if (getters.root) {
          links = getters.root.getStacLinksWithRel('search');
        }
        else if (state.data instanceof STAC) {
          links = state.data.getStacLinksWithRel('search');
        }
        // ToDo: Currently, only GET search requests are supported
        return links.find(link => link.method !== 'POST');
      },

      supportsSearch: (state, getters) => Boolean(getters.searchLink),
      supportsConformance: state => classes => {
        let classRegexp = classes
          .map(c => c.replaceAll('*', '[^/]+').replace(/\/?#/, '/?#'))
          .join('|');
        let regexp = new RegExp('^(' + classRegexp + ')$');
        return !!state.conformsTo.find(uri => uri.match(regexp));
      },
      supportsExtension: state => schemaUri => {
        let extensions = [];
        if (state.data instanceof STAC && Array.isArray(state.data['stac_extensions'])) {
          extensions = state.data['stac_extensions'];
        }
        let regexp = new RegExp('^' + schemaUri.replaceAll('*', '[^/]+') + '$');
        return !!extensions.find(uri => uri.match(regexp));
      },
      tileRendererType: state => {
        if ((state.tileSourceTemplate || state.buildTileUrlTemplate) && !state.useTileLayerAsFallback) {
          return 'server';
        }
        else {
          return 'client';
        }
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
        let catalogs = [];
        if (state.data instanceof STAC && state.data.getApiCollectionsLink() && state.apiCollections.length > 0) {
          catalogs = catalogs.concat(state.apiCollections);
        }
        if (state.data) {
          catalogs = STAC.addMissingChildren(catalogs, state.data);
        }
        return catalogs;
      },
      hasMoreCollections: state => Boolean(state.nextCollectionsLink),

      // hasAsset also checks whether the assets have a href and thus are not item asset definitions
      hasAssets: (state, getters) => Object.values(getters.assets).find(asset => Utils.isObject(asset) && typeof asset.href === 'string'),
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
          for(let key in state.data.assets) {
            let asset = state.data.assets[key];
            if (!thumbnails.includes(asset)) {
              assets[key] = asset;
            }
          }
          return assets;
        }
      },
      thumbnails: state => state.data ? state.data.getThumbnails(true) : [],
      additionalLinks: state => state.data ? state.data.getLinksWithOtherRels(state.supportedRelTypes).filter(link => link.rel !== 'preview' || !Utils.canBrowserDisplayImage(link)) : [],

      toBrowserPath: (state, getters) => url => {
        // ToDo: proxy support
        if (!Utils.hasText(url)) {
          url = '/';
        }

        let absolute = Utils.toAbsolute(getters.unproxyUrl(url), state.url, false);
        let relative;
        if (!state.allowSelectCatalog && state.catalogUrl) {
          relative = absolute.relativeTo(state.catalogUrl);
        }

        if (typeof relative === 'undefined' || getters.isExternalUrl(absolute)) {
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
          return '/' + relative;
        }
      },
      fromBrowserPath: (state, getters) => url => {
        if (!Utils.hasText(url) || url === '/') {
          url = state.catalogUrl;
        }
        else if (url.startsWith('/external/')) {
          let parts = url.replace(/^\/external\//, '').split('/');
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
        return getters.getRequestUrl(url);
      },
      unproxyUrl: state => absoluteUrl => {
        if (absoluteUrl instanceof URI) {
          absoluteUrl = absoluteUrl.toString();
        }
        if (typeof absoluteUrl === 'string' && Array.isArray(state.stacProxyUrl)) {
          return absoluteUrl.replace(state.stacProxyUrl[1], state.stacProxyUrl[0]);
        }
        return absoluteUrl;
      },
      proxyUrl: state => absoluteUrl => {
        if (absoluteUrl instanceof URI) {
          absoluteUrl = absoluteUrl.toString();
        }
        if (typeof absoluteUrl === 'string' && Array.isArray(state.stacProxyUrl)) {
          return absoluteUrl.replace(state.stacProxyUrl[0], state.stacProxyUrl[1]);
        }
        return absoluteUrl;
      },
      isExternalUrl: state => absoluteUrl => {
        if (!state.catalogUrl) {
          return false;
        }
        return absoluteUrl.relativeTo(state.catalogUrl) === absoluteUrl;
      },
      getRequestUrl: (state, getters) => (url, baseUrl = null, addCatalogParams = true) => {
        let absoluteUrl = Utils.toAbsolute(getters.proxyUrl(url), baseUrl ? baseUrl : state.url, false);
        if (!getters.isExternalUrl(absoluteUrl)) {
          // Check whether private params are present and add them if the URL is part of the catalog
          if (Utils.size(state.privateQueryParameters) > 0) {
            absoluteUrl.addQuery(state.privateQueryParameters);
          }
          // Check if we need to add catalog params
          if (addCatalogParams && Utils.size(state.requestQueryParameters) > 0) {
            absoluteUrl.addQuery(state.requestQueryParameters);
          }
        }
        // If we are proxying a STAC Catalog, replace any URI with the proxied address.
        return absoluteUrl.toString();
      }
    },
    mutations: {
      config(state, config) {
        for(let key in config) {
          let value = config[key];
          switch(key) {
            case 'catalogTitle':
              state.catalogTitle = value;
              break;
            case 'catalogUrl':
              if (typeof value === 'string') {
                let url = new URI(value);
                state.requestQueryParameters = Object.assign({}, state.requestQueryParameters, url.query(true));
                url.query("");
                state.catalogUrl = url.toString();
              }
              break;
            case 'stacProxyUrl':
              // Proxy URLs coming from CLI have the form https://thingtoproxy.com;http://proxy:111
              if (typeof value === 'string' && value.includes(';')) {
                state[key] = value.split(';');
              }
              else {
                state[key] = value;
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
      resetStateQueryParameters(state) {
        Vue.set(state, 'stateQueryParameters', createBlankStateQueryParameters());
      },
      queryParameters(state, params) {
        for(let key in params) {
          if (key === 'state') {
            for (let [key, value] of Object.entries(params.state)) {
              if (Array.isArray(state.stateQueryParameters[key]) && !(Array.isArray(value))) {
                value = value.split(',');
              }
              Vue.set(state.stateQueryParameters, key, value);
            }
          }
          else {
            state[`${key}QueryParameters`] = params[key];
          }
        }
      },
      setQueryParameter(state, {type, key, value}) {
        type = `${type}QueryParameters`;
        if (typeof value === 'undefined') {
          delete state[type][key];
        }
        else {
          state[type][key] = value;
        }
      },
      setRequestHeader(state, {key, value}) {
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
      openCollapsible(state, {type, uid}) {
        const idx = state.stateQueryParameters[type].indexOf(uid);
        // need to prevent duplicates because of the way the collapse v-model works
        if (idx === -1) {
          state.stateQueryParameters[type].push(uid);
        }
      },
      closeCollapsible(state, {type, uid}) {
        const idx = state.stateQueryParameters[type].indexOf(uid);
        if (idx > -1) {
          state.stateQueryParameters[type].splice(idx, 1);
        }
      },
      stacIndex(state, index) {
        state.stacIndex = Object.freeze(index);
      },
      tileSourceTemplate(state, tileSourceTemplate) {
        state.tileSourceTemplate = tileSourceTemplate;
      },
      updateLoading(state, {url, show, loadApi}) {
        let data = state.database[url];
        Vue.set(data, 'show', show || data.show);
        Vue.set(data, 'loadApi', loadApi || data.loadApi);
      },
      loading(state, {url, loading}) {
        Vue.set(state.database, url, loading);
        if (loading.show) {
          state.url = url;
        }
      },
      loaded(state, {url, data}) {
        Vue.set(state.database, url, processSTAC(state, data));
      },
      clear(state, url) {
        Vue.delete(state.database, url);
      },
      resetCatalog(state) {
        Object.assign(state, catalogDefaults());
      },
      resetPage(state) {
        Object.assign(state, localDefaults());
      },
      showPage(state, { url, title, stac }) {
        if (!stac) {
          stac = state.database[url] || null;
        }
        state.url = url || null;
        state.data = stac instanceof STAC ? stac : null;
        state.valid = null;
        if (title) {
          state.title = title;
        }
        else {
          state.title = STAC.getDisplayTitle(stac, state.catalogTitle);
        }
      },
      errored(state, {url, error}) {
        if (!(error instanceof Error)) {
          error = new Error(error);
        }
        Vue.set(state.database, url, error);
      },
      valid(state, valid) {
        state.valid = valid;
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
        let pageLinks = Utils.getLinksWithRels(data.links, ['first', 'prev', 'previous', 'next', 'last']);
        let pages = {};
        for(let pageLink of pageLinks) {
          let rel = pageLink.rel === 'previous' ? 'prev' : pageLink.rel;
          pages[rel] = pageLink;
        }

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
      setApiItemsFilter(state, filter) {
        state.apiItemsFilter = filter;
      },
      resetApiItems(state) {
        state.apiItems = [];
        state.apiItemsPagination = {};
      },
      redirectLegacyUrl(state, path) {
        if (!path) {
          return;
        }
        let parts = path.split('/').filter(part => part.length > 0 && part !== 'item' && part !== 'collection');
        if (parts.length > 0 && parts.every(part => part.match(/^[123456789abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ]+$/))) {
          let newPath = bs58.decode(parts[parts.length-1]).toString();
          if (newPath) {
            state.redirectUrl = '/' + newPath;
          }
        }
      },
      parents(state, parents) {
        state.parents = parents;
      },
      showGlobalError(state, error) {
        console.error(error);
        state.globalError = error;
      },
      addQueryables(state, queryables) {
        if (Utils.isObject(queryables) && Utils.isObject(queryables.properties)) {
          state.queryables = Object.keys(queryables.properties).map(key => new Queryable(key, queryables.properties[key]));
        }
        else {
          state.queryables = [];
        }
      }
    },
    actions: {
      async loadBackground(cx, count) {
        let urls = cx.state.queue.slice(0, count);
        if (urls.length > 0) {
          let promises = [];
          for(let url of urls) {
            promises.push(cx.dispatch('load', { url }));
          }
          cx.commit('removeFromQueue', count);
          return await Promise.all(promises);
        }
      },
      async loadStacIndex(cx) {
        try {
          let response = await axios.get('https://stacindex.org/api/catalogs');
          if (Array.isArray(response.data)) {
            cx.commit('stacIndex', response.data);
          }
        } catch (error) {
          console.error(error);
        }
      },
      async loadParents(cx) {
        if (!(cx.state.data instanceof STAC)) {
          cx.commit('parents', []);
          return;
        }

        let parents = [];
        let stac = cx.state.data;
        while(stac) {
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
      async load(cx, args) {
        let {url, fromBrowser, show, loadApi, loadRoot} = args;
        let path;
        if (fromBrowser) {
          path = url.startsWith('/') ? url : '/' + url;
          url = cx.getters.fromBrowserPath(url);
        }
        else {
          url = Utils.toAbsolute(url, cx.state.url);
          path = cx.getters.toBrowserPath(url);
        }

        // Load the root catalog data if not available (e.g. after page refresh or external access)
        if (!loadRoot && path !== '/' && cx.state.catalogUrl && !cx.state.database[cx.state.catalogUrl]) {
          await cx.dispatch("load", { url: cx.state.catalogUrl, loadApi: true, loadRoot: true });
        }

        if (show) {
          cx.commit('resetPage');
        }

        let loading = new Loading(show, loadApi);
        let data = cx.state.database[url];
        if (data instanceof Loading) {
          cx.commit('updateLoading', {url, show, loadApi});
          return;
        }
        else if (!data) {
          cx.commit('loading', {url, loading});
          try {
            let response = await stacRequest(cx, url);
            if (!Utils.isObject(response.data)) {
              throw new BrowserError('The response is not a valid STAC JSON');
            }
            data = new STAC(response.data, url, path);
            cx.commit('loaded', {url, data});

            if (!cx.getters.root) {
              let root = data.getLinkWithRel('root');
              if (root) {
                cx.commit('config', { catalogUrl: Utils.toAbsolute(root.href, url) });
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
            if (cx.state.authConfig && isAuthenticationError(error)) {
              cx.commit('clear', url);
              cx.commit('requestAuth', () => cx.dispatch('load', args));
              return;
            }
            console.error(error);
            cx.commit('errored', {url, error});

            // Redirect legacy URLs
            if (cx.state.redirectLegacyUrls && fromBrowser && show) {
              cx.commit('redirectLegacyUrl', path);
            }
          }
        }

        if (loading.loadApi && data instanceof STAC) {
          // Load API Collections
          if (data.getApiCollectionsLink()) {
            let args = {stac: data, show: loading.show};
            try {
              await cx.dispatch('loadNextApiCollections', args);
            } catch (error) {
              if (cx.state.authConfig && isAuthenticationError(error)) {
                cx.commit('requestAuth', () => cx.dispatch('loadNextApiCollections', args));
              }
              else {
                cx.commit('showGlobalError', {
                  message: 'Sorry, the API Collections could not be loaded.',
                  error
                });
              }
            }
          }
          // Load API Items
          if (data.getApiItemsLink()) {
            let args = {stac: data, show: loading.show};
            try {
              await cx.dispatch('loadApiItems', args);
            } catch (error) {
              if (cx.state.authConfig && isAuthenticationError(error)) {
                cx.commit('requestAuth', () => cx.dispatch('loadApiItems', args));
              }
              else {
                cx.commit('showGlobalError', {
                  message: 'Sorry, the API Items could not be loaded.',
                  error
                });
              }
            }
          }
        }

        if (loading.show) {
          cx.commit('showPage', {url});
        }
      },
      async loadApiItems(cx, {link, stac, show, filters}) {
        let collectionId = stac instanceof STAC ? stac.id : '';
        cx.commit('toggleApiItemsLoading', collectionId);

        try {
          let baseUrl = cx.state.url;
          if (stac instanceof STAC) {
            link = stac.getApiItemsLink();
            baseUrl = stac.getAbsoluteUrl();
          }

          if (!Utils.isObject(filters)) {
            filters = {};
          }
          if (typeof filters.limit !== 'number') {
            filters.limit = cx.state.itemsPerPage;
          }
          cx.commit('setApiItemsFilter', filters);

          link = Utils.addFiltersToLink(link, filters);

          let response = await stacRequest(cx, link);
          if (!Utils.isObject(response.data) || !Array.isArray(response.data.features)) {
            throw new BrowserError('The API response is not a valid list of STAC Items');
          }
          else {
            response.data.features = response.data.features.map(item => {
              try {
                if (!Utils.isObject(item)) {
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
                    url = Utils.toAbsolute(`${stac.id}/items/${item.id}`, apiCollectionsLink.href);
                  }
                  else if (cx.state.catalogUrl) {
                    url = Utils.toAbsolute(`collections/${stac.id}/items/${item.id}`, cx.state.catalogUrl);
                  }
                  else {
                    return null;
                  }
                }
                else {
                  return null;
                }
                return new STAC(item, url, cx.getters.toBrowserPath(url));
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
          throw error;
        }
      },
      async loadNextApiCollections(cx, {stac, show}) {
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
        let response = await stacRequest(cx, link);
        if (!Utils.isObject(response.data) || !Array.isArray(response.data.collections)) {
          throw new BrowserError('The API response is not a valid list of STAC Collections');
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
            return new STAC(collection, url, cx.getters.toBrowserPath(url));
          });
          cx.commit('addApiCollections', { data: response.data, stac, show });
        }
      },
      async loadOgcApiConformance(cx, link) {
        let response = await stacRequest(cx, link);
        if (Utils.isObject(response.data) && Array.isArray(response.data.conformsTo)) {
          cx.commit('setConformanceClasses', response.data.conformsTo);
        }
      },
      async loadQueryables(cx, {stac, refParser = null}) {
        let schemas;
        try {
          let link = stac.getStacLinkWithRel('queryables');
          let href = link ? link.href : Utils.toAbsolute('queryables', stac.getAbsoluteUrl());
          let response = await stacRequest(cx, href);
          schemas = response.data; // Use data with $refs included as fallback anyway
          if (refParser) {
            try {
              schemas = await refParser.dereference(schemas);
            } catch (error) {
              console.error(error);
            }
          }
        } catch (error) {
          console.log('Queryables not supported by API');
        }
        cx.commit('addQueryables', schemas);
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
          message: 'The requests errored, the provided authentication details may be incorrect.'
        });

        for(let callback of cx.state.doAuth) {
          try {
            let p = callback();
            if (p instanceof Promise) {
              p.catch(errorFn);
            }
          } catch (error) {
            errorFn(error);
          }
        }
      },
      async validate(cx, url) {
        if (typeof cx.state.valid === 'boolean') {
          return;
        }
        try {
          let uri = new URI('https://api.staclint.com/url');
          uri.addSearch('stac_url', url);
          let response = await axios.get(uri.toString());
          cx.commit('valid', Boolean(response.data?.body?.valid_stac));
        } catch (error) {
          cx.commit('valid', error);
        }
      }
    },
  });
}

export default getStore;