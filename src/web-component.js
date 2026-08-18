// A self-registering `<stac-browser>` custom element that embeds STAC Browser
// into any page, rendered into an isolated shadow root and routed in memory by
// default. See docs/web-component.md for configuration, events and methods.
import createStacBrowser from './app';
import defaultConfig from '../config.js';
import { pageTitle, pageDescription, pageLocale, pageStructuredData } from './page-metadata';

const ATTRIBUTE_MAP = {
  'url': 'catalogUrl',
  'catalog-title': 'catalogTitle',
  'locale': 'locale',
  'history-mode': 'historyMode'
};

// Config options that can update a running instance (plus `locale`, handled via
// switchLocale). Everything else is init-only and read once on connect.
const LIVE_KEYS = ['catalogTitle', 'cardViewMode', 'enforcedColorMode'];

const browserVersion = typeof STAC_BROWSER_VERSION !== 'undefined' ? STAC_BROWSER_VERSION : null;

export class StacBrowserElement extends HTMLElement {

  static get observedAttributes() {
    return [...Object.keys(ATTRIBUTE_MAP), 'isolation'];
  }

  // 'isolated' makes the shadow container its own scroll viewport and a
  // containing block, so overlays (modals, sidebar) stay within the component;
  // 'inline' (default) lets it grow with the host page and overlays span it.
  _isolationMode() {
    return this.getAttribute('isolation') === 'isolated' ? 'isolated' : 'inline';
  }

  constructor() {
    super();
    this._configProp = {};
    this._instance = null;
    this._mountPoint = null;
    this._unwatchers = [];
    this._generation = 0;
    this._forwardedProps = new Set();
    // A `config` set before the element was defined lands as an own property
    // that would shadow the setter after upgrade; re-run it through the setter.
    this._upgradeProperty('config');
  }

  _upgradeProperty(prop) {
    if (Object.prototype.hasOwnProperty.call(this, prop)) {
      const value = this[prop];
      delete this[prop];
      this[prop] = value;
    }
  }

  set config(value) {
    const patch = (value && typeof value === 'object') ? value : {};
    // Merge, so `config` reflects what was applied and reconnecting rebuilds from
    // the full set; a bare state change can't "unset" a live option.
    this._configProp = { ...this._configProp, ...patch };
    this._applyConfig(patch);
  }

  get config() {
    return this._configProp;
  }

  // Apply the live subset of a config object to a running instance. locale needs
  // the switchLocale action; other keys are structural/init-only and ignored.
  _applyConfig(config) {
    if (!this._instance) {
      return;
    }
    const store = this._instance.store;
    const live = {};
    for (const [key, value] of Object.entries(config)) {
      if (key === 'locale') {
        store.dispatch('switchLocale', { locale: value, userSelected: false });
      }
      else if (LIVE_KEYS.includes(key)) {
        live[key] = value;
      }
    }
    if (Object.keys(live).length > 0) {
      store.dispatch('config', live);
    }
  }

  _attributeConfig() {
    const config = {};
    for (const [attr, key] of Object.entries(ATTRIBUTE_MAP)) {
      if (this.hasAttribute(attr)) {
        config[key] = this.getAttribute(attr);
      }
    }
    return config;
  }

  async connectedCallback() {
    if (this._instance) {
      return;
    }
    // A shadow root persists across disconnect/reconnect and can only be
    // attached once; reuse it and clear any prior content. The generation token
    // lets an async init that is superseded by a disconnect or a newer connect
    // bail out instead of mounting into a stale/cleared mount point.
    const generation = ++this._generation;

    const config = Object.assign(
      {},
      defaultConfig,
      { historyMode: 'memory' },
      this._attributeConfig(),
      this._configProp
    );

    const shadow = this.shadowRoot || this.attachShadow({ mode: 'open' });
    shadow.replaceChildren();
    this._injectStyles(shadow);
    this._mountPoint = document.createElement('div');
    this._mountPoint.className = 'stac-browser-root';
    this._mountPoint.dataset.isolation = this._isolationMode();
    shadow.appendChild(this._mountPoint);

    // Forward CSS custom properties set on the host element into the shadow
    // container so the host can theme the browser (e.g. --bs-primary); regular
    // styles cannot cross the boundary, and inherited variables are overridden
    // by the container's own theme, but an inline value on it wins.
    this._forwardCustomProps();

    const instance = await createStacBrowser(config, browserVersion, { teleportTarget: this._mountPoint });
    if (generation !== this._generation || !this.isConnected) {
      // Superseded by a disconnect or a newer connect while awaiting init.
      instance.app.unmount();
      return;
    }
    this._instance = instance;
    const { app, router, store } = instance;

    this._propObserver = new MutationObserver(() => this._forwardCustomProps());
    this._propObserver.observe(this, { attributes: true, attributeFilter: ['style'] });
    // Catch a style change made while init was pending, before the observer ran.
    this._forwardCustomProps();

    // The app's useColorMode sets the theme on the host document, which does not
    // reach into the shadow root; apply it to the shadow container too.
    this._unwatchTheme = store.watch(
      (state) => state.colorMode,
      (mode) => { this._mountPoint.dataset.bsTheme = mode || 'light'; },
      { immediate: true }
    );

    router.afterEach((to, from, failure) => {
      if (failure) {
        return;
      }
      this._emit('navigate', {
        path: to.fullPath,
        url: typeof store.getters.fromBrowserPath === 'function' ? store.getters.fromBrowserPath(to.path) : null,
        title: store.getters.title || null
      });
    });

    store.subscribe((mutation) => {
      if (mutation.type === 'showGlobalError' && mutation.payload) {
        this._emit('error', mutation.payload);
      }
    });

    const i18n = instance.i18n.global;
    const watchEmit = (getter, type) => {
      this._unwatchers.push(store.watch(getter, (value) => this._emit(type, value), { immediate: true }));
    };
    watchEmit(() => pageTitle(store, i18n), 'title');
    watchEmit(() => pageDescription(store), 'description');
    watchEmit(() => pageLocale(store), 'locale');
    this._unwatchers.push(store.watch(() => store.state.data, () => {
      let schema = null;
      try {
        schema = pageStructuredData(store, i18n);
      }
      catch (error) {
        console.error(error);
      }
      this._emit('structuredData', schema);
    }, { immediate: true }));

    app.mount(this._mountPoint);

    // Replay options set while init was pending (the setter/attr callback bailed
    // with no instance yet).
    this._applyConfig({ ...this._attributeConfig(), ...this._configProp });
  }

  // Styles must live inside the shadow root. The built bundle extracts them next
  // to this module; in dev Vite injects them as <style data-vite-dev-id> tags in
  // the head, so mirror only those in (not the host page's own styles).
  _injectStyles(shadow) {
    if (import.meta.env.DEV) {
      const mirror = (node) => {
        if (node.tagName === 'STYLE' && node.hasAttribute('data-vite-dev-id')) {
          shadow.appendChild(node.cloneNode(true));
        }
      };
      document.head.querySelectorAll('style[data-vite-dev-id]').forEach(mirror);
      this._styleObserver = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === 1) {
              mirror(node);
            }
          });
        }
      });
      this._styleObserver.observe(document.head, { childList: true });
    }
    else {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = new URL('stac-browser.css', import.meta.url).href;
      shadow.appendChild(link);
    }
  }

  _forwardCustomProps() {
    const current = new Set();
    for (const name of this.style) {
      if (name.startsWith('--')) {
        current.add(name);
        this._mountPoint.style.setProperty(name, this.style.getPropertyValue(name));
      }
    }
    // Remove properties the host no longer sets, so a cleared override (e.g.
    // removing --bs-primary) reverts instead of sticking on the container.
    for (const name of this._forwardedProps) {
      if (!current.has(name)) {
        this._mountPoint.style.removeProperty(name);
      }
    }
    this._forwardedProps = current;
  }

  disconnectedCallback() {
    // Invalidate any in-flight connectedCallback so it won't mount after teardown.
    this._generation++;
    if (this._styleObserver) {
      this._styleObserver.disconnect();
      this._styleObserver = null;
    }
    if (this._propObserver) {
      this._propObserver.disconnect();
      this._propObserver = null;
    }
    this._forwardedProps = new Set();
    if (this._unwatchTheme) {
      this._unwatchTheme();
      this._unwatchTheme = null;
    }
    this._unwatchers.forEach((unwatch) => unwatch());
    this._unwatchers = [];
    if (this._instance) {
      this._instance.app.unmount();
      this._instance = null;
    }
    this._mountPoint = null;
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (!this._instance || oldValue === newValue) {
      return;
    }
    if (name === 'isolation') {
      // CSS applies live; the scroll viewport is only set up on mount.
      this._mountPoint.dataset.isolation = this._isolationMode();
      return;
    }
    const key = ATTRIBUTE_MAP[name];
    if (key) {
      this._applyConfig({ [key]: newValue });
    }
  }

  navigate(path) {
    return this._instance ? this._instance.router.push(path) : undefined;
  }

  _emit(type, detail) {
    this.dispatchEvent(new CustomEvent(type, { bubbles: true, composed: true, detail }));
  }

}

if (typeof customElements !== 'undefined' && !customElements.get('stac-browser')) {
  customElements.define('stac-browser', StacBrowserElement);
}

export default StacBrowserElement;
