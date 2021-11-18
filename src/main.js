import path from "path";
import url from "url";

import AsyncComputed from "vue-async-computed";
import {
  AlertPlugin, BreadcrumbPlugin, ButtonPlugin,
  CardPlugin,  LayoutPlugin,PaginationPlugin,
  SpinnerPlugin, TablePlugin, TabsPlugin } from "bootstrap-vue";
import bs58 from "bs58";
import Meta from "vue-meta";
import pMap from "p-map";
import Vue from "vue";
import VueRouter from "vue-router";
import Vuex from "vuex";

import "bootstrap/dist/css/bootstrap.css";
import "bootstrap-vue/dist/bootstrap-vue.css";
import "leaflet/dist/leaflet.css";

import { CATALOG_URL, PATH_PREFIX, HISTORY_MODE } from "./config";
import { fetchUri, getProxiedUri } from "./util";

// configure the catalog and title from URL params
const urlParams = new URLSearchParams(window.location.search)
const titleParam = urlParams.get('title');
const catalogParam = urlParams.get('catalog');
let CATALOG_URL = catalogParam ? catalogParam : BASE_CATALOG_URL;

// this element is located in the public index.html, part of the GP header. 
let orangeText = document.getElementById('orange-text').firstChild;
titleParam ? orangeText.nodeValue = titleParam : orangeText.nodeValue = 'STAC'

const Catalog = () => import(/* webpackChunkName: "catalog" */ "./components/Catalog.vue");
const Item = () => import(/* webpackChunkName: "item" */ "./components/Item.vue");

Vue.use(AsyncComputed);
Vue.use(AlertPlugin);
Vue.use(BreadcrumbPlugin);
Vue.use(ButtonPlugin);
Vue.use(CardPlugin);
Vue.use(LayoutPlugin);
Vue.use(PaginationPlugin);
Vue.use(SpinnerPlugin);
Vue.use(TablePlugin);
Vue.use(TabsPlugin);
Vue.use(Meta);
Vue.use(VueRouter);
Vue.use(Vuex);

const makeRelative = uri => {
  const rootURI = url.parse(CATALOG_URL);
  const localURI = url.parse(uri);

  if (rootURI.hostname !== localURI.hostname) {
    return uri;
  }

  const rootPath = rootURI.path
    .split("/")
    .slice(0, -1)
    .join("/");

  return path.relative(rootPath, `${localURI.path}${localURI.hash || ""}`);
};

/**
 * Generate a slug (short, URL-encodable string) for a URI.
 *
 * @param {String} uri URI to generate a slug for.
 * @returns Base58-encoded relative path to the root catalog.
 */
const slugify = uri => bs58.encode(Buffer.from(makeRelative(uri)));

const resolve = (href, base = CATALOG_URL) => {
  // Encode colons from all but schema, as they create errors in URL resolving.
  const proxiedUri = getProxiedUri(href);
  const hrefEncoded = proxiedUri
    .replace(":", encodeURIComponent(":"))
    .replace(encodeURIComponent(":") + "//", "://");
  return new URL(hrefEncoded, base).toString();
};

function decode(s) {
  try {
    return resolve(bs58.decode(s).toString());
  } catch (err) {
    console.warn(err);
    return CATALOG_URL;
  }
}

const main = async () => {
  let persistedState = {};
  const renderedState = document.querySelector(
    "script.state[type='application/json']"
  );

  if (renderedState != null) {
    try {
      persistedState = JSON.parse(renderedState.text);
    } catch (err) {
      console.warn("Unable to parse rendered state:", err);
    }
  }

  const routes = [
    {
      path: "/item/(.*)",
      component: Item,
      props: route => {
        let ancestors = [CATALOG_URL];

        if (route.params.pathMatch) {
          ancestors = ancestors.concat(
            route.params.pathMatch.split("/").map(decode)
          );
        }

        let center = null;

        if (route.hash) {
          center = route.hash.slice(1).split("/");
        }

        return {
          ancestors,
          center,
          path: route.path,
          resolve,
          slugify,
          url: ancestors.slice(-1).pop()
        };
      }
    },
    {
      path: "/collection/(.*)",
      component: Catalog,
      props: route => {
        let ancestors = [CATALOG_URL];

        if (route.params.pathMatch) {
          ancestors = ancestors.concat(
            route.params.pathMatch.split("/").map(decode)
          );
        }

        return {
          ancestors,
          path: route.path,
          resolve,
          slugify,
          url: ancestors.slice(-1).pop()
        };
      }
    },
    {
      path: "/(.*)",
      component: Catalog,
      props: route => {
        let ancestors = [CATALOG_URL];

        if (route.params.pathMatch) {
          ancestors = ancestors.concat(
            route.params.pathMatch.split("/").map(decode)
          );
        }

        return {
          ancestors,
          path: route.path,
          resolve,
          slugify,
          url: ancestors.slice(-1).pop()
        };
      }
    }
  ];

  const store = new Vuex.Store({
    state: {
      entities: {},
      loading: {}
    },
    getters: {
      getEntity: state => uri => state.entities[uri]
    },
    mutations: {
      FAILED(state, { err, url }) {
        state.entities = {
          ...state.entities,
          [url]: err
        };

        state.loading = {
          ...state.loading,
          [url]: false
        };
      },
      LOADING(state, url) {
        state.loading = {
          ...state.loading,
          [url]: true
        };
      },
      LOADED(state, { entity, url }) {
        state.entities = {
          ...state.entities,
          [url]: entity
        };

        state.loading = {
          ...state.loading,
          [url]: false
        };
      }
    },
    actions: {
      async load({ commit, state }, url) {
        if (state.entities[url] != null || state.loading[url] === true) {
          // already loading / loaded
          return;
        }

        commit("LOADING", url);

        try {
          const rsp = await fetchUri(url);

          if (rsp.ok) {
            const entity = await rsp.json();

            commit("LOADED", { entity, url });
          } else {
            commit("FAILED", { err: new Error(await rsp.text()), url });
          }
        } catch (err) {
          console.warn(err);

          commit("FAILED", { err, url });
        }
      }
    },
    strict: process.env.NODE_ENV !== "production"
  });

  const router = new VueRouter({
    base: PATH_PREFIX,
    mode: HISTORY_MODE,
    routes
  });

  window.router = router;

  await store.dispatch("load", CATALOG_URL);

  router.beforeEach(async (to, from, next) => {
    if (from.path === to.path) {
      return next();
    }

    if (
      persistedState.path != null &&
      persistedState.path !== to.path.replace(/\/$/, "") &&
      persistedState.path.toLowerCase() ===
        to.path.toLowerCase().replace(/\/$/, "")
    ) {
      return next(persistedState.path);
    }

    if (to.params.pathMatch != null) {
      // pre-load all known entities
      const urls = to.params.pathMatch
        .split("/")
        .reverse()
        .map(decode);

      await pMap(urls, store.dispatch.bind(store, "load"), {
        concurrency: 10
      });
    }

    return next();
  });

  // initial load
  let el = document.getElementById("app");

  // replace existing content
  if (document.getElementById("rendered") != null) {
    el = document.getElementById("rendered");
  }

  new Vue({
    el,
    router,
    store,
    template: `<router-view id="rendered" />`
  });
};

main();
