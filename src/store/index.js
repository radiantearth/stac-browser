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
    title: '',
    data: null,
    valid: null,
    // Global settings
    database: {},
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
      let absoluteUrl = Utils.toAbsolute(url, state.url);
      let data = state.database[absoluteUrl];
      if (!returnErrorObject && data instanceof Error) {
        return null;
      }
      else {
        return data;
      }
    },
    isCollection: state => state.data ? state.data.isCollection() : false,
    isCatalog: state => state.data ? state.data.isCatalog() : false,
    isCatalogLike: state => state.data ? state.data.isCatalogLike() : false,
    isItem: state => state.data ? state.data.isItem() : false,
    stacVersion: state => state.data && state.data.stac_version ? state.data.stac_version : null,
    root: (state, getters) => getters.getStac(state.catalogUrl),
    rootTitle: (state, getters) => getters.root ? getters.root.getDisplayTitle(state.catalogTitle) : state.catalogTitle,
    items: state => {
      // ToDo: API & Pagination support(?)
      return state.data ? state.data.getLinksWithRels(['item']) : [];
    },
    catalogs: state => {
      // ToDo: API & Pagination support(?)
      return state.data ? state.data.getLinksWithRels(['child']) : [];
    },
    additionalLinks: state => state.data ? state.data.getLinksWithOtherRels(state.supportedRelTypes) : [],
    hasAssets: state => Boolean(state.data && Utils.size(state.data.assets) > 0),
    assets: state => state.data && Utils.isObject(state.data.assets) ? state.data.assets : [],
    thumbnails: state => state.data ? state.data.getThumbnails() : [],
    supportsSearch: () => false, // ToDo
    toBrowserPath: state => (url, baseUrl = null) => {
      // ToDo: proxy support
      if (!Utils.hasText(url)) {
        url = '/';
      }
      if (baseUrl === null) {
        baseUrl = state.url;
      }
      return '/' + Utils.toAbsolute(url, state.url, false).relativeTo(state.catalogUrl).toString();
    },
    fromBrowserPath: (state, getters) => url => {
      if (!Utils.hasText(url) || url === '/') {
        url = state.catalogUrl;
      }
      return getters.getProxiedUrl(Utils.toAbsolute(url, state.catalogUrl));
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
      state.data = stac;
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
		}
  },
  actions: {
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
