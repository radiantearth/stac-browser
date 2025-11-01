import { createApp } from "vue";
import { createRouter, createWebHistory, createWebHashHistory } from "vue-router";
import StacBrowser from "./StacBrowser.vue";
import getI18n from './i18n';
import getRoutes from "./router";
import getStore from "./store";

import { createBootstrap } from 'bootstrap-vue-next/plugins/createBootstrap';
import { vBToggle } from 'bootstrap-vue-next/directives/BToggle';
import visible from './directives/visible';

export default async function createStacBrowser(config, browserVersion = null) {
  const app = createApp(StacBrowser);
  
  // Setup i18n
  const i18n = await getI18n(config);
  app.use(i18n);

  // Setup router
  const router = createRouter({
    history: config.historyMode === 'history' ? createWebHistory(config.pathPrefix) : createWebHashHistory(config.pathPrefix),
    routes: getRoutes(config),
    scrollBehavior: (to, from, savedPosition) => {
      if (to.path !== from.path) {
        return { left: 0, top: 0 };
      }
      else {
        return savedPosition;
      }
    }
  });
  app.use(router);

  // Setup store
  const store = getStore(config, router, i18n.global);
  app.use(store);
  
  // Setup UI framework
  // Commonly used omponents are auto-registered via BootstrapVueNextResolver in vue.config.js
  app.use(createBootstrap());
  app.directive('visible', visible);
  app.directive('b-toggle', vBToggle);

  app.provide('config', config);
  app.provide('browserVersion', browserVersion);

  return app;
}
