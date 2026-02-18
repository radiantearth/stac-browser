import { defineStore } from 'pinia';
import { STAC } from 'stac-js';
import Utils from '../utils';
import { getDisplayTitle } from '../models/stac';
import { useDatabaseStore } from './database';
import { useConfigStore } from './config';
import { useCatalogStore } from './catalog';
import URI from 'urijs';
import { addQueryIfNotExists, hasAuthority, stacRequestOptions } from './utils';
import i18n from '../i18n';

/**
 * Page store - state for the currently displayed page
 */
export const usePageStore = defineStore('page', {
  state: () => ({
    /** @type {string} Current URL being displayed */
    url: '',
    /** @type {Function|null} Function that returns title and optionally description */
    page: null,
    /** @type {boolean} Whether the page is loading */
    loading: true,
    /** @type {Array|null} Parent chain for sidebar navigation */
    parents: null,
    /** @type {Object|null} Global error */
    globalError: null,

    /** @type {Object} Local request query parameters */
    localRequestQueryParameters: {},
    /** @type {Object} State-related query parameters (language, asset, etc.) */
    stateQueryParameters: {
      language: null,
      asset: [],
      itemdef: []
    },

    /** @type {Object} Active downloads keyed by href */
    downloads: {}
  }),
  getters: {
    /**
     * API items for the current page (resolved from database children)
     */
    apiItems() {
      if (!this.url) {
        return [];
      }
      const db = useDatabaseStore();
      const entry = db.getEntry(this.url);
      if (entry?.childrenResponse?.type === 'items') {
        return db.getResolvedChildren(this.url);
      }
      return [];
    },

    /**
     * Whether the current page has API items loaded
     */
    apiItemsLink() {
      if (!this.url || !this.data) {
        return null;
      }
      const db = useDatabaseStore();
      const entry = db.getEntry(this.url);
      if (entry?.childrenResponse?.type === 'items') {
        return this.data.getApiItemsLink() || null;
      }
      return null;
    },

    /**
     * Pagination links for API items (from database response)
     */
    apiItemsPagination() {
      if (!this.url) {
        return {};
      }
      const db = useDatabaseStore();
      const entry = db.getEntry(this.url);
      if (entry?.childrenResponse?.type === 'items') {
        return db.getChildrenPagination(this.url);
      }
      return {};
    },

    /**
     * Total count of matched items (from database response)
     */
    apiItemsNumberMatched() {
      if (!this.url) {
        return null;
      }
      const db = useDatabaseStore();
      const entry = db.getEntry(this.url);
      if (entry?.childrenResponse?.type === 'items') {
        return db.getChildrenNumberMatched(this.url);
      }
      return null;
    },

    /**
     * Get current STAC data from the database
     */
    data() {
      if (!this.url) {
        return null;
      }
      const db = useDatabaseStore();
      const entry = db.getEntry(this.url);
      return entry?.data instanceof STAC ? entry.data : null;
    },

    /**
     * Get the error for the current URL
     */
    error() {
      if (!this.url) {
        return null;
      }
      const db = useDatabaseStore();
      const entry = db.getEntry(this.url);
      return entry?.error || null;
    },

    /**
     * Whether the current data is the root catalog
     */
    isRoot() {
      const root = this.root;
      if (this.data instanceof STAC && root) {
        return this.data.equals(root);
      }
      return false;
    },

    /**
     * The page title
     */
    title() {
      const config = useConfigStore();
      if (this.page) {
        const meta = this.page();
        return meta.title;
      }
      else if (this.data instanceof STAC) {
        const fallback = this.isRoot ? config.catalogTitle : '';
        return getDisplayTitle(this.data, fallback);
      }
      return "";
    },

    /**
     * The page description
     */
    description() {
      let description;
      if (this.page) {
        const meta = this.page();
        description = meta.description;
      }
      else if (this.data instanceof STAC) {
        description = this.data.getMetadata('description');
      }
      return Utils.hasText(description) ? description : "";
    },

    isCollection() {
      return this.data?.isCollection() || false;
    },
    isCatalog() {
      return this.data?.isCatalog() || false;
    },
    isCatalogLike() {
      return this.data?.isCatalogLike() || false;
    },
    isItem() {
      return this.data?.isItem() || false;
    },

    /**
     * Root catalog link
     */
    rootLink() {
      const config = useConfigStore();
      if (config.catalogUrl) {
        return Utils.createLink(config.catalogUrl, 'root', config.catalogTitle);
      }
      const link = this.data?.getStacLinkWithRel('root');
      if (link) {
        return link;
      }
      else if (this.url && this.data instanceof STAC && this.data.getLinksWithRels(['conformance', 'service-desc', 'service-doc', 'data', 'search']).length > 0) {
        return Utils.createLink(this.url, 'root', getDisplayTitle(this.data, config.catalogTitle));
      }
      else if (this.url) {
        const uri = URI(this.url);
        const path = uri.segment(-2);
        if (['collections', 'items'].includes(path)) {
          uri.segment(-1, "");
          uri.segment(-1, "");
          if (path === 'items') {
            uri.segment(-1, "");
            uri.segment(-1, "");
          }
          return Utils.createLink(uri.toString(), 'root', config.catalogTitle);
        }
      }
      return null;
    },

    /**
     * Root STAC object
     */
    root() {
      const db = useDatabaseStore();
      return db.getStac(this.rootLink);
    },

    /**
     * Parent link
     */
    parentLink() {
      if (this.data instanceof STAC) {
        const link = this.data.getStacLinkWithRel('parent');
        if (link) {
          return link;
        }
      }
      if (this.url) {
        const uri = URI(this.url);
        const path = uri.segment(-2);
        if (['collections', 'items'].includes(path)) {
          uri.segment(-1, "");
          uri.segment(-1, "");
          return Utils.createLink(uri.toString(), 'parent');
        }
      }
      return null;
    },

    /**
     * Collection link
     */
    collectionLink() {
      if (this.data instanceof STAC) {
        const link = this.data?.getStacLinkWithRel('collection');
        if (link) {
          return link;
        }
      }
      if (this.url) {
        const uri = URI(this.url);
        const path = uri.segment(-2);
        if (path === 'items') {
          uri.segment(-1, "");
          uri.segment(-1, "");
          return Utils.createLink(uri.toString(), 'collection');
        }
      }
      return null;
    },

    /**
     * Items for the current page (API items or link-based items)
     */
    items() {
      if (this.apiItems.length > 0) {
        return this.apiItems;
      }
      else if (this.data) {
        return this.data.getStacLinksWithRel('item');
      }
      return [];
    },

    /**
     * Catalogs for the current page (API collections + child links)
     */
    catalogs() {
      const config = useConfigStore();
      const db = useDatabaseStore();
      if (!this.data || !this.url) {
        return [];
      }
      return db.getMergedChildren(this.url, config.apiCatalogPriority);
    },

    /**
     * Convert STAC URL to browser path
     * @returns {function}
     */
    toBrowserPath() {
      const config = useConfigStore();
      return (url) => {
        if (!Utils.hasText(url)) {
          url = '/';
        }

        let absolute = Utils.toAbsolute(url, this.url, false);
        let relative;
        if (!config.allowSelectCatalog && config.catalogUrl) {
          relative = absolute.relativeTo(config.catalogUrl);
        }

        if (typeof relative === 'undefined' || this.isExternalUrl(absolute, false)) {
          if (!config.allowExternalAccess) {
            return absolute.toString();
          }
          let parts = ['/external'];
          let protocol = absolute.protocol();
          if (protocol !== 'https') {
            parts.push(protocol + ':');
          }
          parts.push(absolute.authority());
          parts.push(absolute.path().replace(/^\//, ''));
          let path = parts.join('/');
          let q = absolute.query();
          if (q) {
            path += `?${q}`;
          }
          return path;
        }
        else {
          return '/' + relative.toString();
        }
      };
    },

    /**
     * Convert browser path to STAC URL
     * @returns {function}
     */
    fromBrowserPath() {
      const config = useConfigStore();
      return (url) => {
        const externalRE = /^\/((search|validation)\/)?external\//;
        if (!Utils.hasText(url) || url === '/') {
          url = config.catalogUrl;
        }
        else if (url.match(externalRE)) {
          let parts = url.replace(externalRE, '').split('/');
          let protocol;
          if (!parts[0].endsWith(':')) {
            protocol = 'https:';
          }
          else {
            protocol = parts.shift();
          }
          url = `${protocol}//${parts.join('/')}`;
        }
        else if (!config.allowSelectCatalog && config.catalogUrl) {
          url = Utils.toAbsolute(url, config.catalogUrl, false);
        }
        return this.getRequestUrl(url, null, true);
      };
    },

    /**
     * Check if a URL is external to the catalog
     * @returns {function}
     */
    isExternalUrl() {
      const config = useConfigStore();
      return (absoluteUrl, whitelist = true) => {
        if (!config.catalogUrl) {
          return false;
        }
        if (!(absoluteUrl instanceof URI)) {
          absoluteUrl = URI(absoluteUrl);
        }
        if (whitelist && Array.isArray(config.allowedDomains) && config.allowedDomains.some(d => hasAuthority(d, absoluteUrl))) {
          return false;
        }
        let relative;
        if (absoluteUrl.is("relative")) {
          relative = absoluteUrl;
        }
        else {
          relative = absoluteUrl.relativeTo(config.catalogUrl);
          if (relative.equals(absoluteUrl)) {
            return true;
          }
        }
        const relativeStr = relative.toString();
        return relativeStr.startsWith('//') || relativeStr.startsWith('../');
      };
    },

    /**
     * Build a request URL with query parameters
     * @returns {function}
     */
    getRequestUrl() {
      const config = useConfigStore();
      const catalogStore = useCatalogStore();
      return (url, baseUrl = null, addLocalQueryParams = false) => {
        const absoluteUrl = Utils.toAbsolute(url, baseUrl ? baseUrl : this.url, false);
        if (!this.isExternalUrl(absoluteUrl)) {
          if (catalogStore) {
            addQueryIfNotExists(absoluteUrl, catalogStore.privateQueryParameters);
          }
          addQueryIfNotExists(absoluteUrl, config.requestQueryParameters);
          if (addLocalQueryParams) {
            addQueryIfNotExists(absoluteUrl, this.localRequestQueryParameters);
          }
        }
        return absoluteUrl.toString();
      };
    },

    /**
     * Accepted languages header value
     */
    acceptedLanguages() {
      const config = useConfigStore();
      const languages = {};
      languages['*'] = 0.1;
      if (Utils.hasText(config.fallbackLocale)) {
        languages[config.fallbackLocale] = 0.2;
      }
      if (Array.isArray(navigator.languages)) {
        navigator.languages.forEach((locale, i) => languages[locale] = 0.8 - Math.min((i * 0.1), 0.5));
      }
      if (Utils.hasText(config.locale)) {
        if (config.locale.includes('-')) {
          languages[config.locale.substring(0, 2)] = 0.9;
        }
        languages[config.locale] = 1;
      }
      return Object.entries(languages)
        .sort((a, b) => {
          if (a[1] > b[1]) {return -1;}
          else if (a[1] < b[1]) {return 1;}
          return 0;
        })
        .map(([l, q]) => q >= 1 ? l : `${l};q=${q.toFixed(1)}`)
        .join(',');
    }
  },
  actions: {
    /**
     * Reset page state
     */
    resetPage() {
      this.url = '';
      this.page = null;
      this.loading = true;
      this.parents = null;
      this.globalError = null;
      this.localRequestQueryParameters = {};
      this.stateQueryParameters = {
        language: null,
        asset: [],
        itemdef: []
      };
    },

    /**
     * Show a page
     */
    showPage({ url, stac, page }) {
      const db = useDatabaseStore();
      if (!stac && url) {
        const entry = db.getEntry(url);
        stac = entry?.data || null;
      }
      this.url = url || null;
      this.page = page;
      this.loading = false;
    },

    /**
     * Set parent chain for sidebar
     */
    setParents(parents) {
      this.parents = parents;
    },

    /**
     * Show or clear global error
     */
    showGlobalError(error) {
      if (error) {
        console.trace(error);
      }
      this.globalError = error;
    },

    /**
     * Update a state query parameter
     */
    updateState({ type, value }) {
      if (value === null || typeof value === 'undefined') {
        delete this.stateQueryParameters[type];
      }
      else {
        this.stateQueryParameters[type] = value;
      }
    },

    /**
     * Set all state query parameters
     */
    setState(newState) {
      this.stateQueryParameters = newState;
    },

    /**
     * Open a collapsible section
     */
    openCollapsible({ type, uid }) {
      const idx = this.stateQueryParameters[type].indexOf(uid);
      if (idx === -1) {
        this.stateQueryParameters[type].push(uid);
      }
    },

    /**
     * Close a collapsible section
     */
    closeCollapsible({ type, uid }) {
      const idx = this.stateQueryParameters[type].indexOf(uid);
      if (idx > -1) {
        this.stateQueryParameters[type].splice(idx, 1);
      }
    },

    /**
     * Set a query parameter
     */
    setQueryParameter({ type, key, value }) {
      const typeName = `${type}QueryParameters`;
      if (typeName in this.$state) {
        if (typeof value === 'undefined') {
          delete this[typeName][key];
        }
        else {
          this[typeName][key] = value;
        }
      }
      else {
        // Delegate to catalog store for 'private' type
        const catalogStore = useCatalogStore();
        if (catalogStore && typeName === 'privateQueryParameters') {
          catalogStore.setQueryParameter(key, value);
        }
      }
    },

    /**
     * Set a request header
     */
    setRequestHeader({ key, value }) {
      const config = useConfigStore();
      if (typeof value === 'undefined') {
        delete config.requestHeaders[key];
      }
      else {
        config.requestHeaders[key] = value;
      }
    },

    /**
     * Set API items data — stores items as URLs in the database
     */
    setApiItems({ urls, response, stac }) {
      const db = useDatabaseStore();
      const url = stac instanceof STAC ? stac.getAbsoluteUrl() : this.url;
      if (url) {
        db.setChildren(url, urls, {
          type: 'items',
          links: response.links || [],
          numberMatched: typeof response.numberMatched === 'number' ? response.numberMatched : null
        });
      }
    },

    /**
     * Reset API items
     */
    resetApiItems() {
      if (this.url) {
        const db = useDatabaseStore();
        db.resetChildren(this.url);
      }
    },

    /**
     * Start tracking a download
     */
    startDownload({ href, fileStream }) {
      this.downloads[href] = fileStream || true;
    },

    /**
     * Finish tracking a download
     */
    finishDownload(href) {
      delete this.downloads[href];
    },

    /**
     * Download a file using streamsaver (alternative download for authenticated/large files)
     */
    async altDownload(link) {
      try {
        this.startDownload({ href: link.href });
        const StreamSaver = (await import('streamsaver-js')).default;

        const config = useConfigStore();
        const uri = URI(window.origin.toString());
        uri.path(Utils.removeTrailingSlash(config.pathPrefix) + '/mitm.html');
        StreamSaver.mitm = uri.toString();

        const options = stacRequestOptions(null, link);

        // Convert from axios to fetch
        const url = options.url;
        delete options.url;
        if (typeof options.data !== 'undefined') {
          options.body = options.data;
          delete options.data;
        }

        // Use fetch because stacRequest uses axios
        // and axios doesn't support responseType: 'stream'
        const res = await fetch(url, options);
        // todo: use getErrorMessage / getErrorCode instead?
        if (res.status >= 400) {
          let msg;
          switch (res.status) {
            case 401:
              msg = i18n.global.t('errors.unauthorized');
              break;
            case 403:
              msg = i18n.global.t('errors.authFailed');
              break;
            case 404:
              msg = i18n.global.t('errors.notFound');
              break;
            case 500:
              msg = i18n.global.t('errors.serverError');
              break;
            default:
              msg = i18n.global.t('errors.networkError');
              break;
          }
          throw new Error(msg);
        }

        const filename = Utils.assetFilename(link, res);
        const fileStream = StreamSaver.createWriteStream(filename);
        this.startDownload({ href: link.href, fileStream });
        await res.body.pipeTo(fileStream);
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') {
          // When the download was aborted, we don't want to show an error
          return;
        }
        this.showGlobalError({ error });
      } finally {
        this.finishDownload(link.href);
      }
    }
  }
});


