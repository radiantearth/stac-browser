import path from "path";

import "es6-promise/auto";
import AsyncComputed from "vue-async-computed";
import BootstrapVue from "bootstrap-vue";
import Vue from "vue";
import VueRouter from "vue-router";
import Vuex from "vuex";

import "bootstrap/dist/css/bootstrap.css";
import "bootstrap-vue/dist/bootstrap-vue.css";
import "leaflet/dist/leaflet.css";

import Catalog from "./components/Catalog.vue";
import Item from "./components/Item.vue";

Vue.use(AsyncComputed);
Vue.use(BootstrapVue);
Vue.use(VueRouter);
Vue.use(Vuex);

const CATALOG_URL =
  process.env.CATALOG_URL ||
  "https://s3-us-west-2.amazonaws.com/radiant-nasa-iserv/iserv.json";

// import sha256 from "hash.js/lib/hash/sha/256";
//
// // TODO allow this to be configured globally in case specific slugs can be inferred from the catalog structure (e.g. ISERV with dates)
// const slugify = path =>
//   sha256()
//     .update(path)
//     .digest("hex")
//     .slice(0, 16);

const slugify = pathname => {
  const basename = path
    .basename(pathname)
    .split(".")
    .shift();

  if (basename !== "catalog") {
    return basename;
  }

  return path
    .dirname(pathname)
    .split("/")
    .pop();
};

const resolve = (href, base = CATALOG_URL) => new URL(href, base).toString();

const main = async () => {
  const routes = [
    {
      path: "/item/:path*",
      component: Item,
      props: route => ({
        path: (route.params.path || "").split("/"),
        resolve
      })
    },
    {
      path: "/:path*",
      component: Catalog,
      props: route => ({
        path: (route.params.path || "").split("/"),
        resolve,
        slugify
      })
    }
  ];

  const store = new Vuex.Store({
    state: {
      catalog: {
        url: CATALOG_URL
      },
      initializing: true,
      loading: {}
    },
    getters: {
      catalogForPath: (state, getters) => (path, url = CATALOG_URL) => {
        return state.catalog[getters.urlForPath(path, url)];
      },
      urlForPath: (state, getters) => (path, url = CATALOG_URL) => {
        if (path[0] === "") {
          path.shift();
        }

        if (path.length === 0) {
          return url;
        }

        const catalog = state.catalog[url];

        if (catalog == null) {
          // not yet available
          return;
        }

        // TODO this is/should be hrefForSlug(slug, catalogHref) to look up a slug in an existing catalog
        const link = catalog.links.find(link => {
          return (
            ["child", "item"].includes(link.rel) &&
            (link.slug || slugify(link.href)) === path[0]
          );
        });

        if (link == null) {
          return;
        }

        const newUrl = resolve(link.href, url);

        // load remaining elements
        return getters.urlForPath(path.slice(1), newUrl);
      }
    },
    mutations: {
      LOADING(state, url) {
        state.loading = {
          ...state.loading,
          [url]: true
        };
      },
      LOADED(state, { catalog, url }) {
        state.catalog = {
          ...state.catalog,
          [url]: catalog
        };

        state.loading = {
          ...state.loading,
          [url]: false
        };
      }
    },
    actions: {
      async initializeCatalogForSlugPath(context, path) {
        console.log("path:", path);
        const waitForCatalog = () => {
          if (context.state.catalog[""] != null) {
            return;
          }

          setTimeout(waitForCatalog, 0);
        };

        console.log("waiting for catalog");
        waitForCatalog();
        console.log("found it.");
        console.log(context.state.catalog[""]);

        const url = context.getters.urlForSlugPath(path);

        console.log("catalog url:", url);
      },
      async loadCatalog({ commit, state }, url) {
        if (state.catalog[url] != null || state.loading[url] === true) {
          // already loading / loaded
          return;
        }

        commit("LOADING", url);

        const catalog = await (await fetch(url)).json();

        commit("LOADED", { catalog, url });
      },
      async loadPath({ dispatch, state }, { path, url = CATALOG_URL }) {
        if (path[0] === "") {
          path.shift();
        }

        await dispatch("loadCatalog", url);

        if (path.length === 0) {
          console.log("all necessary catalogs loaded.");
          return;
        }

        const catalog = state.catalog[url];

        console.log(`[load] hunting for ${path[0]} in ${url}`, catalog);

        const findHrefForSlugInCatalog = (slug, catalog) => {
          if (catalog == null) {
            return;
          }

          const link = catalog.links.find(link => {
            return (
              ["child", "item"].includes(link.rel) &&
              (link.slug || slugify(link.href)) === slug
            );
          });

          if (link != null) {
            return link.href;
          }
        };

        const newHref = findHrefForSlugInCatalog(path[0], catalog);

        if (newHref == null) {
          console.log("[load] hunting failed.");
          return;
        }

        const newUrl = resolve(newHref, url);

        console.log(`[load] found ${newHref} (${newUrl}) in ${url}`);

        await dispatch("loadCatalog", newUrl);

        // load remaining elements
        return await dispatch("loadPath", { path: path.slice(1), url: newUrl });
      }
    },
    strict: process.env.NODE_ENV !== "production"
  });

  const router = new VueRouter({
    base: process.env.PATH_PREFIX || "/",
    mode: "history",
    routes
  });

  new Vue({
    router,
    store,
    template: `<router-view />`
  }).$mount("#app");
};

main();
