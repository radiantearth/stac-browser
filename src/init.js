import { createApp } from "vue";
import { createRouter, createWebHistory, createWebHashHistory } from "vue-router";
import StacBrowser from "./StacBrowser.vue";
import i18n, { loadDefaultMessages } from './i18n';
import CONFIG from './config';
import getRoutes from "./router";
import getStore from "./store";

import { createBootstrap } from 'bootstrap-vue-next';
// Import Bootstrap CSS
import 'bootstrap/dist/css/bootstrap.min.css';
// Import BootstrapVueNext CSS
import 'bootstrap-vue-next/dist/bootstrap-vue-next.css';

export default function init() {
  return loadDefaultMessages().then(() => {
    // Setup router
    const router = createRouter({
      history: CONFIG.historyMode === 'history' ? createWebHistory(CONFIG.pathPrefix) : createWebHashHistory(CONFIG.pathPrefix),
      routes: getRoutes(CONFIG),
      scrollBehavior: (to, from, savedPosition) => {
        if (to.path !== from.path) {
          return { left: 0, top: 0 };
        }
        else {
          return savedPosition;
        }
      }
    });

    // Setup store
    const store = getStore(CONFIG, router);

    const app = createApp(StacBrowser);
    
    // Add BootstrapVueNext plugin with minimal config
    // Components are auto-registered via BootstrapVueNextResolver in vue.config.js
    app.use(createBootstrap({
      components: false,
      directives: true
    }));
    
    // Add router, store, and i18n
    app.use(i18n);
    app.use(router);
    app.use(store);

    return app.mount("#stac-browser");
  });
}
