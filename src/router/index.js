import Browse from '../views/Browse.vue';

let routes = [];

if (CONFIG.allowExternalAccess) {
  routes.push({
    path: "/external/(.*)",
    name: "browseExternal",
    component: Browse,
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
  routes.push(  {
    path: "/search/external/(.*)",
    name: "search",
    component: () => import("../views/Search.vue"),
    props: route => {
      return {
        loadRoot: `/external/${route.params.pathMatch}`
      };
    }
  });
}
else {
  routes.push(  {
    path: "/search",
    name: "search",
    component: () => import("../views/Search.vue")
  });
}

routes.push({
  path: "/(.*)",
  name: "browse",
  component: Browse,
  props: route => {
    return {
      path: route.params.pathMatch
    };
  }
});

export default routes;