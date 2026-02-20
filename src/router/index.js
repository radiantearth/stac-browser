function catchAllString(route) {
  const pathMatch = route.params.pathMatch;
  return Array.isArray(pathMatch) ? pathMatch.join("/") : pathMatch;
}

function getPath(route, config) {
  let path = catchAllString(route);
  if (config.allowExternalAccess && path.startsWith("external/")) {
    path = "/" + path;
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
      path: "/search/external/:pathMatch(.*)*",
      name: "search",
      component: () => import("../views/ApiSearch.vue"),
      props: route => {
        const path = catchAllString(route);
        return {
          loadParent: `/external/${path}`
        };
      }
    });
  }
  else {
    routes.push({
      path: "/search",
      name: "search",
      component: () => import("../views/ApiSearch.vue")
    });
  }

  routes.push({
    path: "/auth/logout",
    name: "logout",
    component: () => import("../views/Logout.vue")
  });
  routes.push({
    path: "/auth",
    component: () => import("../views/LoginCallback.vue")
  });

  routes.push({
    path: "/validation/:pathMatch(.*)*",
    name: "validation",
    component: () => import("../views/Validation.vue"),
    props: route => getPath(route, config)
  });

  routes.push({
    path: "/:pathMatch(.*)*",
    name: "browse",
    component: () => import("../views/Browse.vue"),
    props: route => getPath(route, config)
  });

  // if you add new routes that may include .../external/... in the path make sure
  // to add the new path prefix to the fromBrowserPath regexp in store/index.js

  return routes;
}

export default getRoutes;
