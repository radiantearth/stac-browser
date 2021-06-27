import Vue from "vue";
import VueRouter from "vue-router";

Vue.use(VueRouter);

const routes = [
  {
    path: "/collection/:collection",
    name: "api-collection",
    component: () => import(/* webpackChunkName: "catalog" */ "../views/Catalog.vue"),
    props: route => {
      console.log(route); // ToDo
      return {};
    }
  },
  {
    path: "/collection/:collection/:item",
    name: "api-item",
    component: () => import(/* webpackChunkName: "item" */ "../views/Item.vue"),
    props: route => {
      console.log(route); // ToDo
      return {};
    }
  },
  {
    path: "/search",
    name: "search",
    component: () => import(/* webpackChunkName: "search" */ "../views/Search.vue")
  },
  {
    path: "/(.*)",
    name: "browse",
    component: () => import(/* webpackChunkName: "browse" */ "../views/Browse.vue"),
    props: route => {
      return {
        path: route.params.pathMatch
      };
    }
  }
];

const router = new VueRouter({
  mode: HISTORY_MODE,
  base: PATH_PREFIX,
  routes,
});

export default router;
