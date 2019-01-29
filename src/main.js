import path from "path";
import url from "url";

import "@babel/polyfill";
import "es6-promise/auto";
import Ajv from "ajv";
import AsyncComputed from "vue-async-computed";
import BootstrapVue from "bootstrap-vue";
import bs58 from "bs58";
import Clipboard from "v-clipboard";
import Meta from "vue-meta";
import Multiselect from "vue-multiselect";
import pMap from "p-map";
import Vue from "vue";
import VueRouter from "vue-router";
import Vuex from "vuex";

import "bootstrap/dist/css/bootstrap.css";
import "bootstrap-vue/dist/bootstrap-vue.css";
import "leaflet/dist/leaflet.css";
import "vue-multiselect/dist/vue-multiselect.min.css";

import Catalog from "./components/Catalog.vue";
import Item from "./components/Item.vue";

const CATALOG_SCHEMA = require("../schema/catalog.json");
const COLLECTION_SCHEMA = require("../schema/collection.json");
const ITEM_SCHEMA = require("../schema/item.json");

const ajv = new Ajv({
  loadSchema
});

Vue.component("multiselect", Multiselect);

Vue.use(AsyncComputed);
Vue.use(BootstrapVue);
Vue.use(Clipboard);
Vue.use(Meta);
Vue.use(VueRouter);
Vue.use(Vuex);

const CATALOG_URL =
  process.env.CATALOG_URL ||
  "https://storage.googleapis.com/pdd-stac/disasters/catalog.json";

const makeRelative = uri => {
  const rootURI = url.parse(CATALOG_URL);
  const localURI = url.parse(uri);

  if (rootURI.hostname !== localURI.hostname) {
    return uri;
  }

  return path.relative(
    path.dirname(rootURI.path),
    `${localURI.path}${localURI.hash || ""}`
  );
};

/**
 * Generate a slug (short, URL-encodable string) for a URI.
 *
 * @param {String} uri URI to generate a slug for.
 * @returns Base58-encoded relative path to the root catalog.
 */
const slugify = uri => bs58.encode(Buffer.from(makeRelative(uri)));

const resolve = (href, base = CATALOG_URL) => new URL(href, base).toString();

async function loadSchema(uri) {
  const rsp = await fetch(uri);

  if (!rsp.ok) {
    throw new Error(`Loading error: ${rsp.statusText}`);
  }

  return rsp.json();
}

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

  let validateCatalog;
  let validateCollection;
  let validateItem;

  try {
    validateCatalog = await ajv.compileAsync(CATALOG_SCHEMA);
    validateCollection = await ajv.compileAsync(COLLECTION_SCHEMA);
    validateItem = await ajv.compileAsync(ITEM_SCHEMA);
  } catch (err) {
    console.warn(err);

    // create NOOP validators
    validateCatalog = () => true;
    validateCollection = () => true;
    validateItem = () => true;
  }

  const collectionValidator = data => {
    if (!validateCollection(data)) {
      return validateCollection.errors.slice();
    }
  };

  const catalogValidator = data => {
    if (data.license != null || data.extent != null) {
      // contains Collection properties
      if (!validateCollection(data)) {
        if (!validateCatalog(data)) {
          return validateCatalog.errors.slice();
        }

        return validateCollection.errors.slice();
      }
    }

    if (!validateCatalog(data)) {
      return validateCatalog.errors.slice();
    }
  };

  const itemValidator = data => {
    if (!validateItem(data)) {
      return validateItem.errors.slice();
    }
  };

  const routes = [
    {
      path: "/item/:path*",
      component: Item,
      props: route => {
        let ancestors = [CATALOG_URL];

        if (route.params.path != null) {
          ancestors = ancestors.concat(
            route.params.path.split("/").map(decode)
          );
        }

        let center = null;

        if (route.hash != "") {
          center = route.hash.slice(1).split("/");
        }

        return {
          ancestors,
          center,
          path: route.path,
          resolve,
          slugify,
          url: ancestors.slice(-1).pop(),
          validate: itemValidator
        };
      }
    },
    {
      path: "/collection/:path*",
      component: Catalog,
      props: route => {
        let ancestors = [CATALOG_URL];

        if (route.params.path != null) {
          ancestors = ancestors.concat(
            route.params.path.split("/").map(decode)
          );
        }

        return {
          ancestors,
          path: route.path,
          resolve,
          slugify,
          url: ancestors.slice(-1).pop(),
          validate: collectionValidator
        };
      }
    },
    {
      path: "/:path*",
      component: Catalog,
      props: route => {
        let ancestors = [CATALOG_URL];

        if (route.params.path != null) {
          ancestors = ancestors.concat(
            route.params.path.split("/").map(decode)
          );
        }

        return {
          ancestors,
          path: route.path,
          resolve,
          slugify,
          url: ancestors.slice(-1).pop(),
          validate: catalogValidator
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
          const rsp = await fetch(url);

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
    base: process.env.PATH_PREFIX || "/",
    mode: process.env.HISTORY_MODE || "history",
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

    if (to.params.path != null) {
      // pre-load all known entities
      const urls = to.params.path
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
