import Vue from "vue";
import Vuex from "vuex";
import axios from "axios";
import Utils from '../utils'
import STAC from '../stac';

Vue.use(Vuex);

export default new Vuex.Store({
  strict: true,
  state: Object.assign(CONFIG, {
    // Local settings (e.g. for currently loaded STAC entity)
    url: '',
    title: CONFIG.catalogTitle,
    data: null,
    valid: null,
    // Global settings
    allowSelectCatalog: !CONFIG.catalogUrl,
    stacIndex: [],
    database: {},
    queue: [],
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
    loading: state => !state.database[state.url],
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

    root: (state, getters) => getters.getStacFromLink('root', state.catalogUrl),
    parent: (state, getters) => getters.getStacFromLink('parent'),
    collection: (state, getters) => getters.getStacFromLink('collection'),

    getLink: (state, getters) => rel => {
      let link = state.data?.getLinkWithRel(rel);
      let stac = getters[rel];
      if (link) {
        link = Object.assign({}, link);
        link.title = stac?.getDisplayTitle() || link.title;
      }
      return link;
    },
    rootLink: (state, getters) => {
      let link = getters.getLink('root');
      if (link) {
        link.title = link.title || state.catalogTitle;
      }
      else if (!link && state.catalogUrl) {
        link = {
          href: '/',
          title: state.catalogTitle
        };
      }
      return link;
    },
    parentLink: (state, getters) => getters.getLink('parent'),
    collectionLink: (state, getters) => getters.getLink('collection'),

    items: state => {
      // ToDo: API & Pagination support(?)
      return state.data ? state.data.getLinksWithRels(['item']) : [];
    },
    catalogs: state => {
      // ToDo: API & Pagination support(?)
      return state.data ? state.data.getLinksWithRels(['child']) : [];
    },

    // hasAsset also checks whether the assets have a href and thus are not item asset definitions
    hasAssets: (state, getters) => Object.values(getters.assets).find(asset => Utils.isObject(asset) && typeof asset.href === 'string'),
    assets: state => Utils.isObject(state.data?.assets) ? state.data.assets : {},
    thumbnails: state => state.data ? state.data.getThumbnails() : [],
    additionalLinks: state => state.data ? state.data.getLinksWithOtherRels(state.supportedRelTypes) : [],

    supportsSearch: () => false, // ToDo

    toBrowserPath: state => url => {
      // ToDo: proxy support
      if (!Utils.hasText(url)) {
        url = '/';
      }

      let absolute = Utils.toAbsolute(url, state.url, false);
      let relative;
      if (state.catalogUrl) {
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
          protocol = 'https';
        }
        else {
          protocol = parts.shift();
          parts = parts.slice(1);
        }
        url = `${protocol}://${parts.join('/')}`;
      }
      else if (state.catalogUrl) {
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
    getTileSource: (state, getters) => assetHref => {
      const proxiedUri = getters.getTileProxiedUrl(assetHref);
      return state.tileSourceTemplate.replace("{ASSET_HREF}", proxiedUri);
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
      state.stacIndex = index;
    },
    tileSourceTemplate(state, tileSourceTemplate) {
      state.tileSourceTemplate = tileSourceTemplate;
    },
    loading(state, url) {
      Vue.set(state.database, url, null);
    },
    loaded(state, {url, data}) {
      Vue.set(state.database, url, data);
    },
    show(state, { url, title }) {
      let stac = state.database[url] || null;
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
    }
  },
  actions: {
    async loadBackground(cx, count) {
      let urls = cx.state.queue.slice(0, count);
      let promises = [];
      for(let url of urls) {
        promises.push(cx.dispatch('load', { url }));
      }
      cx.commit('removeFromQueue', count);
      return await Promise.all(promises);
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
      if (!cx.state.database[url]) {
        cx.commit('loading', url);
        try {
          let response = await axios.get(url);
          if (!Utils.isObject(response.data)) {
            throw new Error('The response is not a valid STAC entity');
          }
          let data = new STAC(response.data, url, path);
          cx.commit('loaded', {url, data});
        } catch (error) {
          cx.commit('errored', {url, error});
        }
      }
      if (show) {
        cx.commit('show', {url});
      }
    },
    async validate(cx, url) {
      if (typeof cx.state.valid === 'boolean') {
        return;
      }
      try {
        await axios.get(`https://api.staclint.com/url?stac_url=${url}`);
        cx.commit('valid', true);
      } catch (error) {
        if (error.response && error.response.status === 422) {
          cx.commit('valid', false);
        }
        else {
          cx.commit('valid', error);
        }
      }
    },
    async fetch() {

    }
  },
});
