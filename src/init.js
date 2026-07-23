import { createApp } from "vue";
import { createRouter, createWebHistory, createWebHashHistory } from "vue-router";
import StacBrowser from "./StacBrowser.vue";
import i18n, { loadDefaultMessages } from './i18n';
import CONFIG from './merged-config';
import getRoutes from "./router";
import getStore from "./store";

import { createBootstrap } from 'bootstrap-vue-next/plugins/createBootstrap';
import { vBToggle } from 'bootstrap-vue-next/directives/BToggle';
import visible from './directives/visible';
import WidgetHook from "./plugins/WidgetHook.vue";

// Relative URL so it resolves against the <base id="stac-browser-base"> tag, which carries the path prefix.
async function loadRuntimeConfig() {
  await new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = 'runtime-config.js';
    script.onload = resolve;
    script.onerror = resolve; // file absent — ignore silently
    document.head.appendChild(script);
  });
  if (window.STAC_BROWSER_CONFIG) {
    Object.assign(CONFIG, window.STAC_BROWSER_CONFIG);
  }
}

function injectRuntimeStyle() {
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = 'runtime-style.css';
  document.head.appendChild(link);
}

export default async function init() {
  if (CONFIG.RUNTIME) {
    // Inject the stylesheet first (not awaited) so it loads in parallel
    // and is applied as early as possible to minimize re-styling flashes
    injectRuntimeStyle();
    await loadRuntimeConfig();
  }
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

    // Pass the config as root props. The prop defaults in StacBrowser.vue
    // capture primitive config values at module load time, i.e. BEFORE the
    // runtime config has been merged, and would otherwise overwrite the
    // runtime values in the store through the immediate prop watchers.
    const rootProps = {};
    for (const key in StacBrowser.props) {
      if (key in CONFIG) {
        rootProps[key] = CONFIG[key];
      }
    }
    const app = createApp(StacBrowser, rootProps);

    // Make WidgetHook available globally for convenience
    app.component('WidgetHook', WidgetHook);
    
    // Add BootstrapVueNext plugin with minimal config
    // Components are auto-registered via BootstrapVueNextResolver in vue.config.js
    app.use(createBootstrap());
    app.directive('visible', visible);
    app.directive('b-toggle', vBToggle);
    
    // Add router, store, and i18n
    app.use(i18n);
    app.use(router);
    app.use(store);

    return app.mount("body");
  });
}
