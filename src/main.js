import path from "path";

import "@babel/polyfill";
import "es6-promise/auto";
import Ajv from "ajv";
import AsyncComputed from "vue-async-computed";
import BootstrapVue from "bootstrap-vue";
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

/**
 * Generate a slug (short, URL-encodable string) for a URI.
 *
 * @param {String} uri URI to generate a slug for.
 * @returns Relative path to the root catalog.
 */
const slugify = uri => {
  const basename = path.basename(uri, path.extname(uri));

  if (["catalog", "collection"].includes(basename)) {
    return path
      .dirname(uri)
      .split("/")
      .pop();
  } else {
    return basename;
  }
};

/**
 * Convert a route containing multiple slug components into a set of STAC entity URIs.
 *
 * @param {String} route Relative path.
 * @param {String} type Type of entity.
 */
const unslugify = (route, type) => {
  let suffix;

  switch (type) {
    case "catalog":
      // assumption: all catalogs (rel=root, rel=parent, rel=child) are named catalog.json; these
      // are mapped by STAC browser to /<path>
      suffix = "/catalog.json";
      break;

    case "collection":
      // assumption: all collections (rel=collection) are named collection.json; these are mapped by
      // STAC browser to /collection/<path>
      suffix = "/collection.json";
      break;

    default:
      // assumption: all items (rel=item) are named <id>.json; these are mapped by STAC browser to
      // /item/<path>
      suffix = `.json`;
  }

  const parts = route.split("/").filter(x => x !== "");

  return parts.reduce(
    (acc, el, i) => [
      ...acc,
      [
        path.dirname(acc[acc.length - 1]),
        el + (i === parts.length - 1 ? suffix : "/catalog.json")
      ].join("/")
    ],
    [CATALOG_URL]
  );
};

const resolve = (href, base = CATALOG_URL) => new URL(href, base).toString();

async function loadSchema(uri) {
  const rsp = await fetch(uri);

  if (!rsp.ok) {
    throw new Error(`Loading error: ${rsp.statusText}`);
  }

  return rsp.json();
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
    // eslint-disable-next-line require-atomic-updates
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
        let ancestors = unslugify(route.params.path, "item");

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
        let ancestors = unslugify(route.params.path, "collection");

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
        let ancestors = unslugify(route.params.path || "", "catalog");

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
      // assume everything under / is a catalog
      let type = "catalog";

      if (to.path.startsWith("/item/")) {
        type = "item";
      } else if (to.path.startsWith("/collection/")) {
        type = "collection";
      }

      const urls = unslugify(to.params.path, type);

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
