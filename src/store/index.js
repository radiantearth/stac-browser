import Vue from "vue";
import Vuex from "vuex";
import axios from "axios";
import Utils from '../utils'
import STAC from '../stac';
import bs58 from 'bs58';
import { Loading, stacRequest } from './utils';
import URI from "urijs";

Vue.use(Vuex);

function getStore(config) {
  // Local settings (e.g. for currently loaded STAC entity)
  const localDefaults = () => ({
    url: '',
    title: config.catalogTitle,
    data: null,
    valid: null,
    parents: null,
    globalError: null,
    stateQueryParameters: {},

    apiItems: [],
    apiItemsLink: null,
    apiItemsFilter: {},
    apiItemsPagination: {},
  });

  const catalogDefaults = () => ({
    database: {}, // STAC object, Error object or Loading object or Promise (when loading)
    queue: [],
    redirectUrl: null,
    privateQueryParameters: {},

    apiCollections: [],
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
        'preview',
        'root',
        'search',
        'self',
      ]
    }),
    getters: {
      loading: state => !state.url || !state.data || state.database[state.url] instanceof Loading,
      error: state => state.database[state.url] instanceof Error ? state.database[state.url] : null,
      getStac: state => (url, returnErrorObject = false) => {
        if (!url) {
          return null;
        }
        let absoluteUrl = Utils.toAbsolute(url, state.url);
        let data = state.database[absoluteUrl];
        if (data instanceof STAC || (returnErrorObject && data instanceof Error)) {
          return data;
        }
        else {
          return null;
        }
      },
      getStacFromLink: (state, getters) => (rel, fallback = null) => {
        let link = state.data?.getLinkWithRel(rel) || {href: fallback};
        return getters.getStac(link.href);
      },

      displayCatalogTitle: (state, getters) => STAC.getDisplayTitle(getters.root, state.catalogTitle),

      isCollection: state => state.data?.isCollection() || false,
      isCatalog: state => state.data?.isCatalog() || false,
      isCatalogLike: state => state.data?.isCatalogLike() || false,
      isItem: state => state.data?.isItem() || false,

      stacVersion: state => state.data?.stac_version,

      root: (state, getters) => {
        let fallback;
        if (state.catalogUrl) {
          fallback = state.catalogUrl;
        }
        else if (state.url && state.data instanceof STAC && state.data.getLinksWithRels(['conformance', 'service-desc', 'service-doc', 'data', 'search']).length > 0) {
          fallback = state.url;
        }
        return getters.getStacFromLink('root', fallback);
      },
      parent: (state, getters) => getters.getStacFromLink('parent'),
      collection: (state, getters) => getters.getStacFromLink('collection'),

      getLink: (state, getters) => rel => {
        let link = state.data?.getLinkWithRel(rel);
        let stac = getters[rel];
        let title = STAC.getDisplayTitle([stac, link]);
        if (link) {
          link = Object.assign({}, link);
          link.title = title;
        }
        else if (stac instanceof STAC) {
          return {
            href: stac.getAbsoluteUrl(),
            title,
            rel
          };
        }
        return link;
      },
      parentLink: (state, getters) => getters.getLink('parent'),
      collectionLink: (state, getters) => getters.getLink('collection'),
      // ToDo: Currently, only GET search requests are supported
      searchLink: (state, getters) => {
        let links = [];
        if (getters.root) {
          links = getters.root.getLinksWithRels(['search']);
        }
        else if (state.data instanceof STAC) {
          links = state.data.getLinksWithRels(['search']);
        }
        return links.find(link => Utils.isStacMediaType(link.type, true) && link.method !== 'POST');
      },
      supportsSearch: (state, getters) => Boolean(getters.searchLink),
      supportsConformance: (state, getters) => conformanceClass => {
        let conformance = [];
        if (getters.root && Array.isArray(getters.root.conformsTo)) {
          conformance = getters.root.conformsTo;
        }
        else if (state.data instanceof STAC && Array.isArray(state.data.conformsTo)) {
          conformance = state.data.conformsTo;
        }
        let regexp = new RegExp('^' + conformanceClass.replace('*', '[^/]+').replace(/\/?#/, '/?#') + '$');
        return !!conformance.find(uri => uri.match(regexp));
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
          return state.data.getLinksWithRels(['item']).filter(link => Utils.isStacMediaType(link.type, true));
        }
        return [];
      },
      catalogs: state => {
        let catalogs = [];
        if (state.data.getApiCollectionsLink() && state.apiCollections.length > 0) {
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
      additionalLinks: state => state.data ? state.data.getLinksWithOtherRels(state.supportedRelTypes) : [],

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
            default:
              state[key] = value;
          }
        }
      },
      queryParameters(state, params) {
        for(let key in params) {
          state[`${key}QueryParameters`] = params[key];
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
        Vue.set(state.database, url, Object.freeze(data));
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
      setApiItemsLink(state, link) {
        state.apiItemsLink = link;
      },
      setApiItems(state, { data, stac, show }) {
        if (!Utils.isObject(data) || !Array.isArray(data.features)) {
          return;
        }
        let apiItems = data.features.map(feature => Object.freeze(feature));

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
          stac._apiChildren.prev = pages.prev; // ToDo: Only required when state.apiItems is not cached(?) -> cache apiItems?
          stac._apiChildren.next = pages.next;
          stac._apiChildren.list = apiItems;
        }
      },
      addApiCollections(state, { data, stac, show }) {
        if (!Utils.isObject(data) || !Array.isArray(data.collections)) {
          return;
        }

        let collections = data.collections.map(collection => Object.freeze(collection));
        let nextLink = Utils.getLinkWithRel(data.links, 'next');
        if (show) {
          state.nextCollectionsLink = nextLink;
          state.apiCollections = state.apiCollections.concat(collections);
        }
        if (stac instanceof STAC) {
          stac._apiChildren.next = nextLink;
          stac._apiChildren.list = collections;
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
      async load(cx, {url, fromBrowser, show, loadApi}) {
        let path;
        if (fromBrowser) {
          path = url.startsWith('/') ? url : '/' + url;
          url = cx.getters.fromBrowserPath(url);
        }
        else {
          url = Utils.toAbsolute(url, cx.state.url);
          path = cx.getters.toBrowserPath(url);
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
              throw new Error('The response is not a valid STAC JSON');
            }
            data = new STAC(response.data, url, path);
            cx.commit('loaded', {url, data});

            if (!cx.getters.root) {
              let root = data.getLinkWithRel('root');
              if (root) {
                cx.commit('config', { catalogUrl: Utils.toAbsolute(root.href, url) });
              }
            }
          } catch (error) {
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
            try {
              await cx.dispatch('loadNextApiCollections', {stac: data, show: loading.show});
            } catch (error) {
              cx.commit('showGlobalError', {
                message: 'Sorry, the API Collections could not be loaded.',
                error
              });
            }
          }
          // Load API Items
          if (data.getApiItemsLink()) {
            try {
              await cx.dispatch('loadApiItems', {stac: data, show: loading.show});
            } catch (error) {
              cx.commit('showGlobalError', {
                message: 'Sorry, the API Items could not be loaded.',
                error
              });
            }
          }
        }

        if (loading.show) {
          cx.commit('showPage', {url});
        }
      },
      async loadApiItems(cx, {link, stac, show, filters}) {
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
          throw new Error('The API response is not a valid list of STAC Items');
        }
        else {
          response.data.features = response.data.features.map(item => {
            let selfLink = Utils.getLinkWithRel(item.links, 'self');
            let url;
            if (selfLink?.href) {
              url = Utils.toAbsolute(selfLink.href, baseUrl);
            }
            else {
              url = Utils.toAbsolute(`./collections/${cx.state.data.id}/items/${item.id}`, cx.state.catalogUrl || baseUrl);
            }
            return new STAC(item, url, cx.getters.toBrowserPath(url));
          });
          if (show) {
            cx.commit('setApiItemsLink', link);
          }
          cx.commit('setApiItems', { data: response.data, stac, show });
          return response;
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
          throw new Error('The API response is not a valid list of STAC Collections');
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