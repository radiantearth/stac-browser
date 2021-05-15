import Vue from "vue";
import VueRouter from "vue-router";

Vue.use(VueRouter);

const routes = [
  {
    path: "/",
    name: "Root Catalog",
    component: () => import(/* webpackChunkName: "catalog" */ "../views/Catalog.vue")
  },
  {
    path: "/collection/:collection",
    name: "OGC API Collection",
    component: () => import(/* webpackChunkName: "catalog" */ "../views/Catalog.vue"),
    props: route => {
      console.log(route);
      return {};
    }
  },
  {
    path: "/collection/:collection/:item",
    name: "OGC API Item",
    component: () => import(/* webpackChunkName: "item" */ "../views/Item.vue"),
    props: route => {
      console.log(route);
      return {};
    }
  },
  {
    path: "/item/(.*)",
    name: "Static Item",
    component: () => import(/* webpackChunkName: "item" */ "../views/Item.vue"),
    props: route => {
      console.log(route);
      return {};
    }
  },
  {
    path: "/catalog/(.*)",
    name: "Static Catalog / Collection",
    component: () => import(/* webpackChunkName: "catalog" */ "../views/Catalog.vue"),
    props: route => {
      console.log(route);
      return {};
    }
  }
];

const router = new VueRouter({
  mode: HISTORY_MODE,
  base: PATH_PREFIX,
  routes,
});

export default router;
