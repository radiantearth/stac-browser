import Vue from "vue";
import Vuex from "vuex";
import axios from "axios";
import Utils from '../utils'
import STAC from '../stac';

Vue.use(Vuex);

export default new Vuex.Store({
  strict: true,
  modules: {

  },
  state: {
    // Local settings (i.e. for currently loaded STAC entity)
    url: '',
    data: null,
    valid: null,
    // Global settings
    baseUrl: null,
    defaultTitle: '',
    tileSourceTemplate: null,
    stacProxyUrl: null,
    tileProxyUrl: null,
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
      'self',
    ]
  },
  getters: {
    loading: state => !state.database[state.url],
    error: state => state.database[state.url] instanceof Error ? state.database[state.url] : null,
    getStac: state => url => state.database[url] ? state.database[url] : null,
    isCollection: state => state.data ? state.data.isCollection() : false,
    isCatalog: state => state.data ? state.data.isCatalog() : false,
    isCatalogLike: state => state.data ? state.data.isCatalogLike() : false,
    isItem: state => state.data ? state.data.isItem() : false,
    title: state => state.data ? state.data.getDisplayTitle() : STAC.DEFAULT_TITLE,
    items: state => {
      // ToDo: API & Pagination support(?)
      return state.data ? state.data.getLinksWithRels(['item']) : [];
    },
    catalogs: state => {
      // ToDo: API & Pagination support(?)
      return state.data ? state.data.getLinksWithRels(['child']) : [];
    },
    additionalLinks: state => state.data ? state.data.getLinksWithOtherRels(state.supportedRelTypes) : [],
    thumbnails: state => state.data ? state.data.getThumbnails() :  [],
    toBrowserPath: state => (url, baseUrl = null) => {
      // ToDo: proxy support
      if (!Utils.hasText(url)) {
        url = '/';
      }
      if (baseUrl === null) {
        baseUrl = state.url;
      }
      return '/' + Utils.toAbsolute(url, state.url, false).relativeTo(state.baseUrl).toString();
    },
    fromBrowserPath: (state, getters) => url => {
      if (!Utils.hasText(url) || url === '/') {
        url = state.baseUrl;
      }
      return getters.getProxiedUrl(Utils.toAbsolute(url, state.baseUrl));
    },
    getProxiedUrl: state => absoluteUrl => {
      // If we are proxying a STAC Catalog, replace any URI with the proxied address.
      if (Array.isArray(state.stacProxyUrl)) {
        return absoluteUrl.replace(state.stacProxyUrl[0], state.stacProxyUrl[1]);
      }
      return absoluteUrl;
    },
/*  getTileSource: (state, getters) => assetHref => {
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
    } */
  },
  mutations: {
    baseUrl(state, url) {
      state.baseUrl = url;
    },
    defaultTitle(state, title) {
      state.defaultTitle = title;
    },
    tileSourceTemplate(state, tileSourceTemplate) {
      state.tileSourceTemplate = tileSourceTemplate;
    },
    stacProxyUrl(state, stacProxyUrl) {
      // stacProxyUrl has the form https://thingtoproxy.com|http://proxy:111
      if (typeof stacProxyUrl === 'string' && stacProxyUrl.includes('|')) {
        state.stacProxyUrl = stacProxyUrl.split('|');
      }
      else {
        state.stacProxyUrl = null;
      }
    },
    tileProxyUrl(state, tileProxyUrl) {
      // tileProxyUrl has the form https://thingtoproxy.com|http://proxy:111
      if (typeof tileProxyUrl === 'string' && tileProxyUrl.includes('|')) {
        state.tileProxyUrl = tileProxyUrl.split('|');
      }
      else {
        state.tileProxyUrl = null;
      }
    },
    loading(state, url) {
      Vue.set(state.database, url, null);
    },
    loaded(state, {url, data}) {
      Vue.set(state.database, url, data);
    },
    show(state, url) {
      state.url = url;
      state.data = state.database[url];
      state.valid = null;
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
    async load(cx, {path, show}) {
      path = Utils.hasText(path) ? path : '/';
      let url = cx.getters.fromBrowserPath(path);
      cx.commit('loading', url);
      if (!cx.state.database[url]) {
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
        if (show) {
          cx.commit('show', url);
        }
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

    },
    async loadRoot() {

    },
    async loadParents() {

    },
    async loadItems() {

    }
  },
});
