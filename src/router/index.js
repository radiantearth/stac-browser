export default [
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
