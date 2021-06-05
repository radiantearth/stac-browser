import Vue from "vue";
import Vuex from "vuex";
import axios from "axios";
import Migrate from '@radiantearth/stac-migrate';
import Utils from '../utils'

Vue.use(Vuex);

export default new Vuex.Store({
  strict: true,
  modules: {

  },
  state: {
    baseUrl: null,
    url: null,
    title: 'STAC Browser',
    tileSourceTemplate: null,
    stacProxyUrl: null,
    tileProxyUrl: null,
    data: {},
    loading: true,
    error: null,
    valid: null,
    database: {},
    supportedRelTypes: [ // These will be handled in a special way and will not be shown in the link lists
      'child',
      'data',
      'item',
      'items',
      'license',
      'parent',
      'preview',
      'root',
      'self',
    ]
  },
  getters: {
    parents: state => {
      return state; // TODO
    },
    isCollection: state => {
      return  state.data.type === 'Collection';
    },
    isCatalog: state => {
      return state.data.type === 'Catalog';
    },
    isItem: state => {
      return state.data.type === 'Feature';
    },
    items: state => {
      return state.data.type === 'Feature';
    },
    children: state => {
      return state.data.type === 'Feature';
    },
    additionalLinks: state => {
      return Array.isArray(state.data.links) && state.data.links.filter(link => Utils.isObject(link) && !state.supportedRelTypes.includes(link.rel));
    },
    thumbnails: state => {
      let thumbnails = [];
      // Get from links
      thumbnails.concat(Array.isArray(state.data.links) && state.data.links.filter(link => Utils.isObject(link) && link.rel === 'preview'));
      // ToDo: Get from assets

      // Return unique values
      return thumbnails;
    },
    getTileSource: (state, getters) => assetHref => {
      const proxiedUri = getters.getTileProxiedUrl(assetHref);
      return state.tileSourceTemplate.replace("{ASSET_HREF}", proxiedUri);
    },
    getProxiedUrl: state => url => {
      // If we are proxying a STAC Catalog, replace any URI with the proxied address.
      if (Array.isArray(state.stacProxyUrl)) {
        return url.replace(state.stacProxyUrl[0], state.stacProxyUrl[1]);
      }
      return url;
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
    baseUrl(state, url) {
      state.baseUrl = url;
    },
    title(state, title) {
      state.title = title;
      document.title = title;
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
      state.url = url;
      state.valid = null;
      state.data = {};
      state.error = null;
      state.loading = true;
    },
    loaded(state, data) {
      state.data = data;
			state.error = null;
      state.loading = false;
    },
		errored(state, error) {
      state.data = {};
			state.error = error;
      state.loading = false;
		},
		valid(state, valid) {
      state.valid = valid;
		},
    add(state, path, data) {
      Vue.set(state.database, path, data);
    }
  },
  actions: {
    async load(cx, path = null) {
      let url = cx.state.baseUrl;
      if (typeof path === 'string') {
        url = Utils.resolveUrl(url, path);
      }
      cx.commit('loading', url);
      try {
        if (typeof cx.state.database[url] === 'undefined') {
            let proxiedUrl = cx.getters.getProxiedUrl(url);
            let response = await axios.get(proxiedUrl);
            if (Utils.isObject(response.data)) {
                let data = Migrate.stac(response.data);
                cx.commit('loaded', data);
                cx.commit('add', path, data);
            }
            else {
              cx.commit('errored', 'The response is not valid STAC');
            }
        }
      } catch (error) {
        cx.commit('errored', error.message);
      }
    },
    async validate(cx, url) {
      if (typeof cx.state.valid === 'boolean') {
        return;
      }
      try {
        let proxiedUrl = cx.getters.getProxiedUrl(`https://api.staclint.com/url?stac_url=${url}`);
        await axios.get(proxiedUrl);
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
