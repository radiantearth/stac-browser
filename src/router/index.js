import Browse from '../views/Browse.vue';

let routes = [
  {
    path: "/collection/:collection",
    name: "api-collection",
    component: () => import("../views/Browse.vue"),
    props: route => {
      console.log(route); // ToDo
      return {};
    }
  },
  {
    path: "/collection/:collection/:item",
    name: "api-item",
    component: () => import("../views/Browse.vue"),
    props: route => {
      console.log(route); // ToDo
      return {};
    }
  },
  {
    path: "/search",
    name: "search",
    component: () => import("../views/Search.vue")
  }
];

if (CONFIG.allowExternalAccess) {
  routes.push({
    path: "/external/(.*)",
    name: "browseExternal",
    component: Browse,//() => import("../views/Browse.vue"),
    props: route => {
      return {
        path: `/external/${route.params.pathMatch}`
      };
    }
  });
}

if (!CONFIG.catalogUrl) {
  routes.push({
    path: "/",
    name: "select",
    component: () => import("../views/SelectDataSource.vue")
  });
}

routes.push({
  path: "/(.*)",
  name: "browse",
  component: () => import("../views/Browse.vue"),
  props: route => {
    return {
      path: route.params.pathMatch
    };
  }
});

export default routes;