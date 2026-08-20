import { createApp, reactive, markRaw } from "vue";
import { createRouter, createWebHistory, createWebHashHistory, createMemoryHistory } from "vue-router";
import StacBrowser from "./StacBrowser.vue";
import getI18n from './i18n';
import getRoutes from "./router";
import getStore from "./store";

import { createBootstrap } from 'bootstrap-vue-next/plugins/createBootstrap';
import { vBToggle } from 'bootstrap-vue-next/directives/BToggle';
import visible from './directives/visible';
import WidgetHook from "./plugins/WidgetHook.vue";
import Utils from "./utils.js";

export default async function createStacBrowser(config, browserVersion = null, options = {}) {
  const app = createApp(StacBrowser);

  // Popover/sidebar teleport target, whose styles are scoped under #stac-browser:
  // the app root element, set by StacBrowser once mounted. markRaw keeps it from
  // becoming a reactive Proxy, which would break Teleport.
  const teleportTarget = reactive({
    el: options.teleportTarget ? markRaw(options.teleportTarget) : '#stac-browser'
  });

  const embedded = Boolean(options.teleportTarget) && typeof options.teleportTarget !== 'string';

  const i18n = await getI18n(config);
  app.use(i18n);

  let history;
  if (config.historyMode === 'memory') {
    history = createMemoryHistory(config.pathPrefix);
  }
  else if (config.historyMode === 'history') {
    history = createWebHistory(config.pathPrefix);
  }
  else {
    history = createWebHashHistory(config.pathPrefix);
  }
  const router = createRouter({
    history,
    routes: getRoutes(config),
    scrollBehavior: (to, from, savedPosition) => {
      if (to.path === from.path) {
        return embedded ? false : savedPosition;
      }
      // Embedded, Vue Router's default would scroll the host window and move the
      // host page. Scroll the component's own scroll container instead; if it
      // has none (the host scrolls the window), leave the host page untouched.
      if (embedded) {
        const el = teleportTarget.el;
        if (el && typeof el !== 'string') {
          const target = Utils.resolveScrollTarget(el);
          if (target !== window) {
            target.scrollTo({ left: 0, top: 0 });
          }
        }
        return false;
      }
      return { left: 0, top: 0 };
    }
  });
  app.use(router);

  const store = getStore(config, router, i18n.global);
  app.use(store);

  // Normalizes the config (e.g. resolves a catalogUrl function) and runs reactions.
  await store.dispatch('config', config);

  app.component('WidgetHook', WidgetHook);

  // Teleport overlays into the app's own container (#stac-browser) so their
  // scoped styles apply and, when embedded, they stay inside the shadow root
  // instead of escaping to the host page. The getter tracks teleportTarget.el
  // reactively — a selector before mount, the live container element after — so
  // individual components don't need to wire up teleport-to themselves.
  //
  // Popovers and the offcanvas carry #stac-browser-scoped content and so must
  // always teleport there, standalone and embedded alike. Modals, dropdowns and
  // tooltips render fine in place in the standalone app; they only need
  // teleporting when embedded, to escape the host page's shadow root.
  const teleportDefault = { get teleportTo() { return teleportTarget.el; } };
  const bootstrapDefaults = {
    BPopover: teleportDefault,
    BOffcanvas: teleportDefault
  };
  if (embedded) {
    for (const component of ['BModal', 'BDropdown', 'BTooltip']) {
      bootstrapDefaults[component] = teleportDefault;
    }
  }
  app.use(createBootstrap({ components: bootstrapDefaults }));
  app.directive('visible', visible);
  app.directive('b-toggle', vBToggle);

  app.provide('config', config);
  app.provide('browserVersion', browserVersion);
  app.provide('teleportTarget', teleportTarget);
  app.provide('embedded', embedded);

  return { app, router, store, i18n };
}
