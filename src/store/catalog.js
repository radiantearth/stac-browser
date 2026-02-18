import { defineStore } from 'pinia';
import { STAC, CatalogLike } from 'stac-js';
import URI from 'urijs';

import i18n, { getDataLanguages, translateFields, executeCustomFunctions, loadMessages } from '../i18n';
import Utils, { BrowserError } from '../utils';
import { createSTAC } from '../models/stac';
import { TYPES } from '../components/conformance-types';
import BrowserStorage from '../browser-store';
import { getBest } from 'stac-js/src/locales';
import fieldsI18n from '@radiantearth/stac-fields/I18N';

import { useConfigStore } from './config';
import { useDatabaseStore } from './database';
import { usePageStore } from './page';
import { useAuthStore } from './auth';
import { Loading, stacRequest, isAuthenticationError } from './utils';

/**
 * Catalog store - state for the current API/catalog context
 */
export const useCatalogStore = defineStore('catalog', {
  state: () => ({
    /** @type {Array<string>} URLs queued for background loading */
    queue: [],
    /** @type {Object} Private query parameters (from URL hash) */
    privateQueryParameters: {},
    /** @type {Array<Function>} Auth retry action callbacks */
    authActions: [],
    /** @type {Array<string>} OGC API conformance classes */
    conformsTo: [],
    /** @type {string|null} Current data language */
    dataLanguage: null,
    /** @type {string|null} Current UI language */
    uiLanguage: null,
    /** @type {Object<string, boolean>} Items loading by collection ID */
    apiItemsLoading: {}
  }),
  getters: {
    supportsConformance: (state) => (classes) => {
      if (!Array.isArray(classes)) {
        return classes;
      }
      const classRegexp = classes
        .map(c => c.replaceAll('*', '[^/]+').replace(/\/?#/, '/?#'))
        .join('|');
      const regexp = new RegExp('^(' + classRegexp + ')$');
      return Boolean(state.conformsTo.find(uri => uri.match(regexp)));
    },

    canSearch() {
      return this.canSearchCollections || this.canSearchItems;
    },

    canSearchItems() {
      return this.supportsConformance(TYPES.Global.BasicFilters);
    },

    canSearchCollections() {
      return this.supportsConformance(TYPES.Collections.BasicFilters);
    },

    getApiItemsLoading: (state) => (data) => {
      let id = '';
      if (data instanceof Loading) {
        return true;
      }
      else if (data instanceof STAC) {
        id = data.id;
      }
      else if (typeof data === 'string') {
        id = data;
      }
      return state.apiItemsLoading[id] || false;
    }
  },
  actions: {
    /**
     * Set a private query parameter
     */
    setQueryParameter(key, value) {
      if (typeof value === 'undefined') {
        delete this.privateQueryParameters[key];
      }
      else {
        this.privateQueryParameters[key] = value;
      }
    },

    /**
     * Reset all catalog-related state
     */
    resetCatalog(clearAll = false) {
      const config = useConfigStore();
      const pageStore = usePageStore();
      const db = useDatabaseStore();

      this.queue = [];
      this.privateQueryParameters = {};
      this.authActions = [];
      this.conformsTo = [];
      this.dataLanguage = null;
      this.apiItemsLoading = {};

      pageStore.resetPage();

      if (!config.supportedLocales.includes(config.locale)) {
        config.updateConfig({ locale: config.locale });
      }
      if (clearAll) {
        const originalConfig = useConfigStore();
        config.updateConfig({
          catalogUrl: originalConfig.catalogUrl,
          catalogTitle: originalConfig.catalogTitle
        });
        db.clearAll();
      }
    },

    /**
     * Set conformance classes
     */
    setConformanceClasses(classes) {
      if (Array.isArray(classes)) {
        this.conformsTo = classes;
      }
    },

    /**
     * Toggle loading state for API items by collection
     */
    toggleApiItemsLoading(collectionId = '') {
      if (this.apiItemsLoading[collectionId]) {
        delete this.apiItemsLoading[collectionId];
      }
      else {
        this.apiItemsLoading[collectionId] = true;
      }
    },

    /**
     * Add URL to background load queue
     */
    enqueue(url) {
      this.queue.push(url);
    },

    /**
     * Remove URL from background load queue
     */
    dequeue(url) {
      const i = this.queue.indexOf(url);
      if (i !== -1) {
        this.queue.splice(i, 1);
      }
    },

    /**
     * Remove first N items from queue
     */
    removeFromQueue(num) {
      this.queue.splice(0, num);
    },

    /**
     * Switch locale for UI and data
     */
    async switchLocale({ locale, userSelected }) {
      const config = useConfigStore();
      const pageStore = usePageStore();
      await config.updateConfig({ locale });

      if (config.storeLocale && userSelected) {
        const storage = new BrowserStorage();
        storage.set('locale', locale);
      }

      // Locale for UI
      const uiLanguage = getBest(config.supportedLocales, locale, config.fallbackLocale);
      // Locale for data
      const dataLanguages = getDataLanguages(pageStore.data);
      const dataLanguageCodes = dataLanguages.map(l => l.code);
      const dataLanguageFallback = dataLanguages.length > 0 ? dataLanguages[0].code : uiLanguage;
      const dataLanguage = getBest(dataLanguageCodes, locale, dataLanguageFallback);

      // Load messages
      await loadMessages(uiLanguage);

      // Update stac-fields
      fieldsI18n.setLocales([uiLanguage, config.fallbackLocale]);
      fieldsI18n.setTranslator(translateFields);

      // Execute custom localize functions
      await executeCustomFunctions(uiLanguage);

      i18n.global.locale = uiLanguage;
      this.dataLanguage = dataLanguage || null;
      this.uiLanguage = uiLanguage || null;
      pageStore.setQueryParameter({ type: 'state', key: 'language', value: locale });
    },

    /**
     * Load items in background from queue
     */
    async loadBackground(count) {
      const urls = this.queue.slice(0, count);
      if (urls.length > 0) {
        const promises = [];
        for (const url of urls) {
          promises.push(this.load({ url, omitApi: true }));
        }
        this.removeFromQueue(count);
        return await Promise.all(promises);
      }
    },

    /**
     * Load parent chain for sidebar
     */
    async loadParents() {
      const pageStore = usePageStore();
      const db = useDatabaseStore();

      if (!(pageStore.data instanceof STAC)) {
        pageStore.setParents([]);
        return;
      }

      let parents = [];
      let stac = pageStore.data;
      while (stac) {
        const parentLink = stac.getLinkWithRel('parent') || stac.getLinkWithRel('root');
        if (!parentLink) {
          break;
        }
        const url = Utils.toAbsolute(parentLink.href, stac.getAbsoluteUrl());
        await this.load({ url, omitApi: true });
        const parentStac = db.getStac(url, true);
        if (parentStac instanceof Error) {
          pageStore.setParents(parentStac);
          return;
        }
        if (parentStac === stac) {
          break;
        }
        parents.push(parentStac);
        stac = parentStac;
      }
      pageStore.setParents(parents);
    },

    /**
     * Handle auth retry
     */
    async tryLogin({ url, action }) {
      const db = useDatabaseStore();
      const authStore = useAuthStore();

      db.remove(url);
      db.setError(url, new BrowserError(i18n.global.t('authentication.unauthorized')));
      if (action) {
        authStore.addAction(action);
      }
      await authStore.requestLogin();
    },

    /**
     * Main load action - loads a STAC entity by URL
     */
    async load(args) {
      let {
        url,
        show,
        force,
        noRetry,
        omitApi,
        isRoot
      } = args;

      const config = useConfigStore();
      const pageStore = usePageStore();
      const db = useDatabaseStore();
      const authStore = useAuthStore();

      const path = pageStore.toBrowserPath(url);
      url = Utils.toAbsolute(url, pageStore.url);

      // Ensure auth is ready
      await authStore.waitForAuth();

      if (force) {
        db.remove(url);
      }

      const entry = db.getEntry(url);
      if (entry?.loading instanceof Loading) {
        db.updateShow(url, show);
        return;
      }

      const hasData = entry?.data instanceof STAC && !entry.incompleteData;
      let data;
      if (!hasData) {
        db.setLoading(url, path, show);
        if (show) {
          pageStore.loading = true;
          pageStore.url = url;
        }
        try {
          const response = await stacRequest(this, url);
          if (!Utils.isObject(response.data)) {
            throw new BrowserError(i18n.global.t('errors.invalidJsonObject'));
          }
          data = createSTAC(response.data, url, path);
          db.setData(url, data, path);

          if (show) {
            const localeLink = data.getLocaleLink(this.dataLanguage);
            if (localeLink) {
              this._router.replace(pageStore.toBrowserPath(localeLink.href));
              return;
            }
          }

          // Handle conformance classes
          const conformanceLink = data.getStacLinkWithRel('conformance');
          if (Array.isArray(data.conformsTo) && data.conformsTo.length > 0) {
            this.setConformanceClasses(data.conformsTo);
          }
          else if (conformanceLink) {
            await this.loadOgcApiConformance(conformanceLink);
          }
        } catch (error) {
          if (!noRetry && config.authConfig && isAuthenticationError(error)) {
            await this.tryLogin({
              url,
              action: () => this.load(Object.assign({ noRetry: true, force: true, show: true }, args))
            });
            return;
          }
          console.error(error);
          db.setError(url, error);
          if (show) {
            pageStore.loading = false;
            pageStore.page = () => ({
              title: i18n.global.t('errors.title')
            });
          }
          return;
        }
      }
      else {
        data = entry.data;
      }

      // Load API Collections
      const apiCollectionLink = data instanceof CatalogLike && data.getApiCollectionsLink();
      const apiItemLink = data instanceof CatalogLike && data.getApiItemsLink();
      if (!omitApi && apiCollectionLink) {
        try {
          await this.loadNextApiCollections({ stac: data });
        } catch (error) {
          pageStore.showGlobalError({
            message: i18n.global.t('errors.loadApiCollectionsFailed'),
            error
          });
        }
      }
      else if (!omitApi && apiItemLink) {
        try {
          await this.loadApiItems({ stac: data });
        } catch (error) {
          pageStore.showGlobalError({
            message: i18n.global.t('errors.loadApiItemsFailed'),
            error
          });
        }
      }

      // Load root catalog if not yet available
      if (!pageStore.root && !isRoot) {
        let catalogUrl = config.catalogUrl;
        if (!catalogUrl) {
          const root = data.getLinkWithRel('root');
          if (root) {
            catalogUrl = Utils.toAbsolute(root.href, url);
            await config.updateConfig({ catalogUrl });
          }
        }
        if (catalogUrl) {
          await this.load({ url: catalogUrl, omitApi: true, isRoot: true });
        }
      }

      // Show page if requested
      if (show) {
        pageStore.showPage({ url });
      }
    },

    /**
     * Load API items for a collection
     */
    async loadApiItems(args) {
      let { link, stac, filters, noRetry } = args;
      const config = useConfigStore();
      const pageStore = usePageStore();
      const db = useDatabaseStore();

      let collectionId = stac instanceof STAC ? stac.id : '';
      this.toggleApiItemsLoading(collectionId);

      try {
        let baseUrl = pageStore.url;
        if (stac instanceof STAC) {
          link = stac.getApiItemsLink();
          baseUrl = stac.getAbsoluteUrl();
        }
        if (baseUrl) {
          baseUrl = new URI(baseUrl);
        }

        link = Utils.addFiltersToLink(link, filters, config.itemsPerPage);

        const response = await stacRequest(this, link);
        if (!Utils.isObject(response.data) || !Array.isArray(response.data.features)) {
          throw new BrowserError(i18n.global.t('errors.invalidStacItems'));
        }

        // Process items: store each in the database, collect URLs
        const itemUrls = response.data.features.map(item => {
          try {
            if (!Utils.isObject(item) || item.type !== 'Feature') {
              return null;
            }
            let selfLink = Utils.getLinkWithRel(item.links, 'self');
            let url;
            if (selfLink?.href) {
              url = Utils.toAbsolute(selfLink.href, baseUrl, false);
            }
            else if (typeof item.id !== 'undefined') {
              let apiCollectionsLink = pageStore.root?.getApiCollectionsLink()?.href;
              if (apiCollectionsLink) {
                apiCollectionsLink = new URI(apiCollectionsLink);
              }
              if (baseUrl && baseUrl.path().endsWith('/')) {
                url = Utils.toAbsolute(`items/${item.id}`, baseUrl, false);
              }
              else if (baseUrl) {
                url = Utils.toAbsolute(`${collectionId}/items/${item.id}`, baseUrl, false);
              }
              else if (apiCollectionsLink?.path().endsWith('/')) {
                url = Utils.toAbsolute(`${collectionId}/items/${item.id}`, apiCollectionsLink, false);
              }
              else if (apiCollectionsLink) {
                url = Utils.toAbsolute(`collections/${collectionId}/items/${item.id}`, apiCollectionsLink, false);
              }
              else if (config.catalogUrl) {
                url = Utils.toAbsolute(`collections/${collectionId}/items/${item.id}`, config.catalogUrl, false);
              }
              else {
                return null;
              }
            }
            else {
              return null;
            }
            url = url.toString();
            if (!db.getStac(url)) {
              let itemPath = pageStore.toBrowserPath(url);
              let data = createSTAC(item, url, itemPath);
              db.setData(url, data, itemPath, true);
            }
            return url;
          } catch (error) {
            console.error(error);
            return null;
          }
        }).filter(url => url !== null);

        pageStore.setApiItems({ urls: itemUrls, response: response.data, stac });
        this.toggleApiItemsLoading(collectionId);
        return response;
      } catch (error) {
        this.toggleApiItemsLoading(collectionId);
        if (!noRetry && config.authConfig && isAuthenticationError(error)) {
          await this.tryLogin({
            url: link.href,
            action: () => this.loadApiItems(Object.assign({ noRetry: true, force: true }, args))
          });
          return;
        }
        throw error;
      }
    },

    /**
     * Load next page of API collections
     */
    async loadNextApiCollections(args) {
      let { stac, noRetry } = args;
      const config = useConfigStore();
      const pageStore = usePageStore();
      const db = useDatabaseStore();

      let link;
      let isFirstPage = false;
      if (stac) {
        // First page: reset existing children
        isFirstPage = true;
        const stacUrl = stac.getAbsoluteUrl();
        db.resetChildren(stacUrl);
        link = stac.getLinkWithRel('data');
        link = Utils.addFiltersToLink(link, {}, config.collectionsPerPage);
      }
      else {
        // Next pages: get next link from stored response
        stac = pageStore.data;
        const stacUrl = stac?.getAbsoluteUrl();
        if (!stacUrl || !db.hasMoreChildren(stacUrl)) {
          return;
        }
        const entry = db.getEntry(stacUrl);
        link = Utils.getLinkWithRel(entry?.childrenResponse?.links, 'next');
      }
      if (!link) {
        return;
      }

      try {
        const response = await stacRequest(this, link);
        if (!Utils.isObject(response.data) || !Array.isArray(response.data.collections)) {
          throw new BrowserError(i18n.global.t('errors.invalidStacCollections'));
        }

        // Process collections: store each in database, collect URLs
        const collectionUrls = response.data.collections.map(collection => {
          let selfLink = Utils.getLinkWithRel(collection.links, 'self');
          let url;
          if (selfLink?.href) {
            url = Utils.toAbsolute(selfLink.href, pageStore.url || stac.getAbsoluteUrl(), false);
          }
          else {
            let baseUrl = config.catalogUrl || stac.getAbsoluteUrl();
            if (baseUrl) {
              baseUrl = new URI(baseUrl);
              if (!baseUrl.path().endsWith('/')) {
                baseUrl.path(baseUrl.path() + '/');
              }
              url = Utils.toAbsolute(`collections/${collection.id}`, baseUrl, false);
            }
          }
          if (!url) {
            return null;
          }
          url = url.toString();
          if (!db.getStac(url)) {
            let collectionPath = pageStore.toBrowserPath(url);
            let data = createSTAC(collection, url, collectionPath);
            db.setData(url, data, collectionPath, true);
          }
          return url;
        }).filter(url => url !== null);

        const stacUrl = stac.getAbsoluteUrl();
        const responseMeta = {
          type: 'collections',
          links: response.data.links || [],
          numberMatched: response.data.numberMatched ?? null
        };

        if (isFirstPage) {
          db.setChildren(stacUrl, collectionUrls, responseMeta);
        }
        else {
          db.appendChildren(stacUrl, collectionUrls, responseMeta);
        }

      } catch (error) {
        if (!noRetry && config.authConfig && isAuthenticationError(error)) {
          await this.tryLogin({
            url: link.href,
            action: () => this.loadNextApiCollections(Object.assign({ noRetry: true, force: true }, args))
          });
          return;
        }
        throw error;
      }
    },

    /**
     * Load OGC API conformance classes from conformance endpoint
     */
    async loadOgcApiConformance(link) {
      const response = await stacRequest(this, link);
      if (Utils.isObject(response.data) && Array.isArray(response.data.conformsTo)) {
        this.setConformanceClasses(response.data.conformsTo);
      }
    },

    /**
     * Retry actions after authentication
     */
    async retryAfterAuth() {
      const { doAuth } = useConfigStore();
      const pageStore = usePageStore();
      const errorFn = error => pageStore.showGlobalError({
        error,
        message: i18n.global.t('errors.authFailed')
      });

      for (const callback of (doAuth || [])) {
        try {
          const p = callback();
          if (p instanceof Promise) {
            p.catch(errorFn);
          }
        } catch (error) {
          errorFn(error);
        }
      }
    }
  }
});
