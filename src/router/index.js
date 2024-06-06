import Browse from '../views/Browse.vue';

function getPath(route, config) {
  let path = route.params.pathMatch;
  if (config.allowExternalAccess && path.startsWith("external/")) {
    path = '/' + path;
  }
  return {path};
}

function getRoutes(config) {
  let routes = [];

  if (!config.catalogUrl) {
    routes.push({
      path: "/",
      name: "select",
      component: () => import("../views/SelectDataSource.vue")
    });
    routes.push({
      path: "/search/external/(.*)",
      name: "search",
      component: () => import("../views/Search.vue"),
      props: route => {
        return {
          loadParent: `/external/${route.params.pathMatch}`
        };
      }
    });
  }
  else {
    routes.push({
      path: "/search",
      name: "search",
      component: () => import("../views/Search.vue")
    });
  }

  routes.push({
    path: '/auth/logout',
    name: "logout",
    component: () => import("../views/Logout.vue")
  });
  routes.push({
    path: '/auth',
    component: () => import("../views/LoginCallback.vue")
  });

  routes.push({
    path: "/validation/(.*)",
    name: "validation",
    component: () => import("../views/Validation.vue"),
    props: route => getPath(route, config)
  });

  routes.push({
    path: "/(.*)",
    name: "browse",
    component: Browse,
    props: route => getPath(route, config)
  });

  return routes;
}

export default getRoutes;
