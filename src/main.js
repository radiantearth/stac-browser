import path from "path";
import url from "url";

import AsyncComputed from "vue-async-computed";
import BootstrapVue from "bootstrap-vue";
import bs58 from "bs58";
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

import { CATALOG_URL, STAC_VERSION } from "./config";
import { fetchUri, fetchSchemaValidator, getProxiedUri } from "./util";
import Catalog from "./components/Catalog.vue";
import Item from "./components/Item.vue";

Vue.component("multiselect", Multiselect);

Vue.use(AsyncComputed);
Vue.use(BootstrapVue);
Vue.use(Meta);
Vue.use(VueRouter);
Vue.use(Vuex);

async function main(CATALOG_URL, INDEX_PATH) {
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
    const hrefEncoded =
        proxiedUri.replace(':', encodeURIComponent(':'))
          .replace(encodeURIComponent(':') + '//', '://');
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

  const collectionValidator = async data => {
    const stacVersion = data.stac_version || STAC_VERSION;

    let validateCollection = await fetchSchemaValidator(
      "collection",
      stacVersion
    );
    if (!validateCollection(data)) {
      return validateCollection.errors.slice();
    }
    return null;
  };

  const catalogValidator = async data => {
    if (data.license || data.extent) {
      // contains Collection properties
      return collectionValidator(data);
    }

    const stacVersion = data.stac_version || STAC_VERSION;

    let validateCatalog = await fetchSchemaValidator("catalog", stacVersion);

    if (!validateCatalog(data)) {
      return validateCatalog.errors.slice();
    }

    return null;
  };

  const itemValidator = async data => {
    const stacVersion = data.stac_version || STAC_VERSION;

    let validateItem = await fetchSchemaValidator("item", stacVersion);
    if (!validateItem(data)) {
      return validateItem.errors.slice();
    }
    return null;
  };

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
          url: ancestors.slice(-1).pop(),
          validate: itemValidator
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
          url: ancestors.slice(-1).pop(),
          validate: collectionValidator
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
          const rsp = await fetchUri(url);

          if (rsp.ok) {
            const entity = await rsp.json();
            if (!entity) {
              commit("FAILED", { err: new Error("Can't load data. Likely a CORS issue."), url });
            }
            else {
              commit("LOADED", { entity, url });
            }
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
    base: INDEX_PATH,
    mode: "hash",
    routes
  });

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

  let el = document.getElementById("stac-browser");
  return new Vue({
    el,
    router,
    store,
    template: `<router-view id="stac-browser" />`
  });
};

export default main;

if (CATALOG_URL) {
  main(CATALOG_URL, '/');
}