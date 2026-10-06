// Keep the following constants in sync with the routes below.

// Browser paths that point to external content, optionally prefixed by a tool route.
// Add new routes that may include .../external/... in the path.
export const externalBrowserPathRE = /^\/((search|validation|management\/[\w-]+)\/)?external\//;

// First path segments that are taken by routes other than browse, browser paths starting with them get the /browse prefix.
// Add new top-level routes.
export const reservedBrowserPathSegments = ['auth', 'browse', 'external', 'favorites', 'management', 'pages', 'search', 'validation'];
export const escapedBrowserPathRE = /^\/?browse(?:\/(.*))?$/;

function catchAllString(route) {
  const pathMatch = route.params.pathMatch || '';
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

  if (config.showFavorites) {
    routes.push({
      path: "/favorites",
      name: "favorites",
      component: () => import("../views/Favorites.vue"),
      meta: { stac: false }
    });
  }

  routes.push({
    path: "/pages/:id(.*)",
    name: "page",
    component: () => import("../views/Page.vue"),
    props: true,
    meta: { stac: false }
  });

  routes.push({
    path: "/management/edit/:pathMatch(.*)*",
    name: "managementEdit",
    component: () => import("../views/Edit.vue"),
    props: route => ({
      ...getPath(route, config),
      mode: 'edit'
    })
  });

  routes.push({
    path: "/management/create-item/:pathMatch(.*)*",
    name: "managementCreateItem",
    component: () => import("../views/Edit.vue"),
    props: route => ({
      ...getPath(route, config),
      mode: 'create-item'
    })
  });

  routes.push({
    path: "/management/create-collection/:pathMatch(.*)*",
    name: "managementCreateCollection",
    component: () => import("../views/Edit.vue"),
    props: route => ({
      ...getPath(route, config),
      mode: 'create-collection'
    })
  });

  routes.push({
    path: "/:pathMatch(.*)*",
    name: "browse",
    component: () => import("../views/Browse.vue"),
    props: route => getPath(route, config)
  });

  return routes;
}

export default getRoutes;
