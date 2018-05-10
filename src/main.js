import AsyncComputed from "vue-async-computed";
import Vue from "vue";
import VueRouter from "vue-router";

require("../node_modules/leaflet/dist/leaflet.css");

import CatalogList from "./CatalogList.vue";
import ItemDetail from "./ItemDetail.vue";

Vue.use(AsyncComputed);
Vue.use(VueRouter);

const CATALOG_URL =
  "https://s3-us-west-2.amazonaws.com/radiant-nasa-iserv/iserv.json";

const routes = [
  {
    path: "/",
    component: CatalogList,
    props: {
      url: CATALOG_URL
    }
  },
  {
    path: "/item/:path*",
    component: ItemDetail,
    props: route => ({
      url: new URL(route.params.path, CATALOG_URL).toString()
    })
  },
  {
    path: "/:path*",
    component: CatalogList,
    props: route => ({
      url: new URL(route.params.path, CATALOG_URL).toString()
    })
  }
];

const router = new VueRouter({
  mode: "history",
  routes
});

new Vue({
  router
}).$mount("#app");
