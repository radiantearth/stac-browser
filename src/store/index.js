import Vue from "vue";
import Vuex from "vuex";
import axios from "axios";
import Utils from '../utils'
import STAC from '../stac';
import bs58 from 'bs58';

Vue.use(Vuex);

// Local settings (e.g. for currently loaded STAC entity)
const localDefaults = () => ({
  loading: true,
  url: '',
  title: CONFIG.catalogTitle,
  data: null,
  valid: null,
  parents: null,
  globalError: null,

  apiItems: [],
  apiItemsLink: null,
  apiItemsFilter: {},
  apiItemsPagination: {},
});

const catalogDefaults = () => ({
  database: {},
  queue: [],
  redirectUrl: null,

  apiCollections: [],
  nextCollectionsLink: null
});

export default new Vuex.Store({
  strict: true,
  state: Object.assign(CONFIG, localDefaults(), catalogDefaults(), {
    // Global settings
    allowSelectCatalog: !CONFIG.catalogUrl,
    stacIndex: [],
    supportedRelTypes: [ // These will be handled in a special way and will not be shown in the link lists
      'child',
      'collection',
      'data',
      'first',
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
    error: state => state.database[state.url] instanceof Error ? state.database[state.url] : null,
    getStac: state => (url, returnErrorObject = false) => {
      if (!url) {
        return null;
      }
      let absoluteUrl = Utils.toAbsolute(url, state.url);
      let data = state.database[absoluteUrl];
      if (!returnErrorObject && data instanceof Error) {
        return null;
      }
      else {
        return data;
      }
    },
    getStacFromLink: (state, getters) => (rel, fallback = null) => {
      let link = state.data?.getLinkWithRel(rel) || {href: fallback};
      return getters.getStac(link.href);
    },

    displayCatalogTitle: (state, getters) => getters.root?.getDisplayTitle() || state.catalogTitle,

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
      if (link) {
        link = Object.assign({}, link);
        link.title = stac?.getDisplayTitle() || link.title;
      }
      else if (stac instanceof STAC) {
        return {
          href: stac.getAbsoluteUrl(),
          title: stac.getDisplayTitle(),
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

    items: state => {
      if (state.apiItems.length > 0) {
        return state.apiItems;
      }
      else if (state.data) {
        return state.data.getLinksWithRels(['item']);
      }
      return [];
    },
    catalogs: state => {
      let catalogs = [];
      if (state.data.getApiCollectionsLink() && state.apiCollections.length > 0) {
        catalogs = catalogs.concat(state.apiCollections);
      }
      if (state.data) {
        // Don't add links that are already in collections: https://github.com/radiantearth/stac-browser/issues/103
        // ToDo: The runtime of this can probably be improved
        let links = state.data.getLinksWithRels(['child']).filter(link => {
          let absoluteUrl = Utils.toAbsolute(link.href, state.url);
          return !state.apiCollections.find(collection => collection.getAbsoluteUrl() === absoluteUrl);
        });
        catalogs = catalogs.concat(links);
      }
      return catalogs;
    },
    hasMoreCollections: state => Boolean(state.nextCollectionsLink),

    // hasAsset also checks whether the assets have a href and thus are not item asset definitions
    hasAssets: (state, getters) => Object.values(getters.assets).find(asset => Utils.isObject(asset) && typeof asset.href === 'string'),
    assets: state => Utils.isObject(state.data?.assets) ? state.data.assets : {},
    thumbnails: state => state.data ? state.data.getThumbnails() : [],
    additionalLinks: state => state.data ? state.data.getLinksWithOtherRels(state.supportedRelTypes) : [],

    toBrowserPath: state => url => {
      // ToDo: proxy support
      if (!Utils.hasText(url)) {
        url = '/';
      }

      let absolute = Utils.toAbsolute(url, state.url, false);
      let relative;
      if (!state.allowSelectCatalog && state.catalogUrl) {
        relative = absolute.relativeTo(state.catalogUrl);
      }

      if (!relative || relative === absolute) { // This is an external URL
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
        return parts.join('/');
      }
      else {
        return '/' + relative.toString();
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
        url = Utils.toAbsolute(url, state.catalogUrl);
      }
      return getters.getProxiedUrl(url);
    },

    getProxiedUrl: state => absoluteUrl => {
      // If we are proxying a STAC Catalog, replace any URI with the proxied address.
      if (Array.isArray(state.stacProxyUrl)) {
        return absoluteUrl.replace(state.stacProxyUrl[0], state.stacProxyUrl[1]);
      }
      return absoluteUrl;
    },
    getTileProxiedUrl: state => url => {
      // Tile sources can be proxied differently than other assets, replace any asset HREF with the proxied address.
      // Note: This will occur after the STAC_PROXY_URL is used.
      if (Array.isArray(state.tileProxyUrl)) {
        return url.replace(state.tileProxyUrl[0], state.tileProxyUrl[1]);
      }
      return url;
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
            state.catalogUrl = Utils.toAbsolute(value, value); // This call is made to normalize the URL, e.g. append a missing /
            break;
          case 'stacProxyUrl':
          case 'tileProxyUrl':
            // Proxy URLs coming from CLI have the form https://thingtoproxy.com|http://proxy:111
            if (typeof value === 'string' && value.includes('|')) {
              state[key] = value.split('|');
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
    stacIndex(state, index) {
      state.stacIndex = Object.freeze(index);
    },
    tileSourceTemplate(state, tileSourceTemplate) {
      state.tileSourceTemplate = tileSourceTemplate;
    },
    loading(state, {url, show}) {
      Vue.set(state.database, url, null);
      if (show) {
        state.loading = true;
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
      state.loading = false;
      state.url = url || null;
      state.data = stac instanceof STAC ? stac : null;
      state.valid = null;
      if (title) {
        state.title = title;
      }
      else if (stac instanceof STAC) {
        state.title = stac.getDisplayTitle(STAC.DEFAULT_TITLE);
      }
      else {
        state.title = state.catalogTitle;
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
    setApiItems(state, { data, stac }) {
      if (Utils.isObject(data) && Array.isArray(data.features)) {
        state.apiItems = data.features.map(feature => Object.freeze(feature));

        // Handle pagination links
        let pageLinks = Utils.getLinksWithRels(data.links, ['first', 'prev', 'previous', 'next', 'last']);
        let pages = {};
        for(let pageLink of pageLinks) {
          let rel = pageLink.rel === 'previous' ? 'prev' : pageLink.rel;
          pages[rel] = pageLink;
        }
        state.apiItemsPagination = pages;

        if (stac instanceof STAC) {
          stac._apiChildren.prev = pages.prev; // ToDo: Only required when state.apiItems is not cached(?) -> cache apiItems?
          stac._apiChildren.next = state.next;
          stac._apiChildren.list = state.apiItems;
        }
      }
    },
    addApiCollections(state, { data, stac }) {
      if (Array.isArray(data.collections)) {
          state.nextCollectionsLink = Utils.getLinkWithRel(data.links, 'next');
          state.apiCollections = state.apiCollections.concat(data.collections.map(collection => Object.freeze(collection)));
          if (stac instanceof STAC) {
            stac._apiChildren.next = state.nextCollectionsLink;
            stac._apiChildren.list = state.apiCollections;
          }
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
        console.log(error);
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
        await cx.dispatch('load', { url });
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
    async load(cx, {url, fromBrowser, show}) {
      let path;
      if (fromBrowser) {
        path = url;
        url = cx.getters.fromBrowserPath(url);
      }
      else {
        url = Utils.toAbsolute(url, cx.state.url);
        path = cx.getters.toBrowserPath(url);
      }

      if (show) {
        cx.commit('resetPage');
      }

      let data = cx.state.database[url];
      if (!data) {
        cx.commit('loading', {url, show});
        try {
          let response = await axios.get(url);
          if (!Utils.isObject(response.data)) {
            throw new Error('The response is not a valid STAC entity');
          }
          data = new STAC(response.data, url, path);
          cx.commit('loaded', {url, data});

          if (!cx.getters.root) {
            let root = data.getLinkWithRel('root');
            if (root) {
              cx.commit('config', { catalogUrl: root.href });
            }
          }
        } catch (error) {
          cx.commit('errored', {url, error});

          // Redirect legacy URLs
          if (cx.state.redirectLegacyUrls && fromBrowser && show) {
            cx.commit('redirectLegacyUrl', path);
          }
        }
      }

      if (data && show) {
        // Load API Collections
        if (data.getApiCollectionsLink()) {
          await cx.dispatch('loadNextApiCollections', data);
        }
        // Load API Items
        if (data.getApiItemsLink()) {
          await cx.dispatch('loadApiItems', data);
        }
      }

      if (show) {
        cx.commit('showPage', {url});
      }
    },
    async loadApiItems(cx, link) {
      let stac = null;
      if (link instanceof STAC) {
        stac = link;
        link = stac.getApiItemsLink();
      }
      let request = Utils.stacLinkToAxiosRequest(link);
      let response = await axios(request);
      if (!Utils.isObject(response.data) || !Array.isArray(response.data.features)) {
        throw new Error('The API response is not a valid list of STAC Items');
      }
      else {
        response.data.features = response.data.features.map(item => {
          let selfLink = Utils.getLinkWithRel(item.links, 'self');
          let url = Utils.toAbsolute(selfLink?.href || `./collections/${cx.state.data.id}/items/${item.id}`, cx.state.url);
          return new STAC(item, url, cx.getters.toBrowserPath(url));
        });
        cx.commit('setApiItemsLink', link);
        cx.commit('setApiItems', { data: response.data, stac });
        return response;
      }
    },
    async filterApiItems(cx, {link, filters}) {
      if (!link) {
        return;
      }
      if (!Utils.isObject(filters)) {
        filters = {};
      }
      cx.commit('setApiItemsFilter', filters);
      // load API Items with search params
      return await cx.dispatch('loadApiItems', Utils.addFiltersToLink(link, filters));
    },
    async loadNextApiCollections(cx, stac = null) {
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
      let response = await axios(Utils.stacLinkToAxiosRequest(link));
      if (!Utils.isObject(response.data) || !Array.isArray(response.data.collections)) {
        throw new Error('The API response is not a valid list of STAC Collections');
      }
      else {
        response.data.collections = response.data.collections.map(collection => {
          let selfLink = Utils.getLinkWithRel(collection.links, 'self');
          let url = Utils.toAbsolute(selfLink?.href || `./collections/${collection.id}`, cx.state.url);
          return new STAC(collection, url, cx.getters.toBrowserPath(url));
        });
        cx.commit('addApiCollections', { data: response.data, stac });
      }
    },
    async validate(cx, url) {
      if (typeof cx.state.valid === 'boolean') {
        return;
      }
      try {
        let response = await axios.get(`https://api.staclint.com/url?stac_url=${url}`);
        cx.commit('valid', Boolean(response.data?.body?.valid_stac));
      } catch (error) {
        cx.commit('valid', error);
      }
    }
  },
});
