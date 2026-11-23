import { createApp } from "vue";
import { createRouter, createWebHistory, createWebHashHistory } from "vue-router";
import StacBrowser from "./StacBrowser.vue";
import i18n, { getLocaleDirection, loadDefaultMessages } from './i18n';
import CONFIG from './merged-config';
import getRoutes from "./router";
import getStore from "./store";
import BrowserStorage from './browser-store';
import { getBest, prepareSupported } from 'stac-js/src/locales';

import { createBootstrap } from 'bootstrap-vue-next/plugins/createBootstrap';
import { vBToggle } from 'bootstrap-vue-next/directives/BToggle';
import visible from './directives/visible';
import WidgetHook from "./plugins/WidgetHook.vue";

// Note: runtime-config.js and runtime-style.css are loaded by index.html
// (emitted at build time when SB_RUNTIME is enabled). The deferred script
// runs before this bundle, so merged-config.js already contains the runtime
// values when the modules below evaluate.

function getQueryLocale() {
  const searchLocale = new URLSearchParams(window.location.search).get('.language');
  const queryIndex = window.location.hash.indexOf('?');
  if (queryIndex !== -1) {
    const hashLocale = new URLSearchParams(window.location.hash.slice(queryIndex + 1)).get('.language');
    if (hashLocale) {
      return hashLocale;
    }
  }
  return searchLocale;
}

function getInitialLocale() {
  const supported = prepareSupported(CONFIG.supportedLocales);
  let locale = getQueryLocale();

  if (!locale && CONFIG.storeLocale) {
    locale = new BrowserStorage().get('locale');
  }
  if (!locale && CONFIG.detectLocaleFromBrowser && Array.isArray(navigator.languages)) {
    for (const browserLocale of navigator.languages) {
      locale = getBest(supported, browserLocale, null);
      if (locale) {
        break;
      }
    }
  }

  return getBest(supported, locale || CONFIG.locale, CONFIG.fallbackLocale);
}

export default function init() {
  // Direction-scoped styles need a matching document direction before Vue
  // mounts. HeaderTitle keeps these attributes synchronized after startup.
  const initialLocale = getInitialLocale();
  document.documentElement.setAttribute('lang', initialLocale);
  document.documentElement.setAttribute('dir', getLocaleDirection(initialLocale));

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
