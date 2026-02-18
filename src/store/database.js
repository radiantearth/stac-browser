import { defineStore } from 'pinia';
import { STAC } from 'stac-js';
import Utils from '../utils';
import { addMissingChildren } from '../models/stac';
import { processSTAC, Loading } from './utils';
import { useConfigStore } from './config';
import { usePageStore } from './page';

/**
 * @typedef {Object} DatabaseEntry
 * @property {string} url - The absolute URL
 * @property {string} path - The browser path
 * @property {Promise|null} loading - Loading promise or null
 * @property {boolean} show - Whether this entry should be shown as the current page
 * @property {STAC|null} data - The parsed STAC data
 * @property {boolean} incompleteData - Whether the data is from an API listing (missing details)
 * @property {Error|null} error - Error if loading failed
 * @property {string|null} language - The language of the data
 * @property {Array<string>|null} children - URL strings for API-loaded children (collections or items)
 * @property {Object|null} childrenResponse - API response metadata (links, numberMatched, type)
 */

/**
 * Creates a new database entry
 * @param {string} url
 * @param {string} path
 * @returns {DatabaseEntry}
 */
function createEntry(url, path = '') {
  return {
    url,
    path,
    loading: null,
    show: false,
    data: null,
    incompleteData: false,
    error: null,
    language: null,
    children: null,
    childrenResponse: null
  };
}

export const useDatabaseStore = defineStore('database', {
  state: () => ({
    /** @type {Object<string, DatabaseEntry>} */
    entries: {}
  }),
  getters: {
    /**
     * Get a STAC object from the database by URL or reference
     * @returns {function}
     */
    getStac: (state) => (source, returnErrorObject = false) => {
      if (source instanceof STAC) {
        return source;
      }
      if (Utils.isObject(source) && Utils.hasText(source.href)) {
        source = source.href;
      }
      if (!Utils.hasText(source)) {
        return null;
      }
      const configStore = useConfigStore();
      const pageStore = usePageStore();
      const absoluteUrl = Utils.toAbsolute(source, pageStore?.url || configStore.catalogUrl);
      const entry = state.entries[absoluteUrl];
      if (entry?.data instanceof STAC || (returnErrorObject && entry?.error instanceof Error)) {
        return entry.data || entry.error;
      }
      return null;
    },

    /**
     * Get the browser path for a given URL
     * @returns {function}
     */
    getPath: (state) => (url) => {
      if (!Utils.hasText(url)) {
        return '';
      }
      const entry = state.entries[url];
      return entry?.path || '';
    },

    /**
     * Get the entry for a given URL
     * @returns {function}
     */
    getEntry: (state) => (url) => {
      return state.entries[url] || null;
    },

    /**
     * Check if a URL is loading
     * @returns {function}
     */
    isLoading: (state) => (url) => {
      const entry = state.entries[url];
      return entry?.loading instanceof Loading;
    },

    /**
     * Get the error for a given URL
     * @returns {function}
     */
    getError: (state) => (url) => {
      const entry = state.entries[url];
      return entry?.error || null;
    },

    /**
     * Resolve children URLs to STAC objects
     * @returns {function}
     */
    getResolvedChildren: (state) => (url) => {
      const entry = state.entries[url];
      if (!Array.isArray(entry?.children)) {
        return [];
      }
      return entry.children
        .map(childUrl => state.entries[childUrl]?.data)
        .filter(data => data instanceof STAC);
    },

    /**
     * Whether the entry has more children to load (pagination)
     * @returns {function}
     */
    hasMoreChildren: (state) => (url) => {
      const entry = state.entries[url];
      if (!entry?.childrenResponse) {
        return false;
      }
      return (entry.childrenResponse.links || []).some(l => l.rel === 'next');
    },

    /**
     * Get pagination links from the children response
     * @returns {function}
     */
    getChildrenPagination: (state) => (url) => {
      const entry = state.entries[url];
      if (!entry?.childrenResponse) {
        return {};
      }
      return Utils.getPaginationLinks(entry.childrenResponse);
    },

    /**
     * Get the number of matched children from the API response
     * @returns {function}
     */
    getChildrenNumberMatched: (state) => (url) => {
      const entry = state.entries[url];
      return entry?.childrenResponse?.numberMatched ?? null;
    },

    /**
     * Get merged children: API children + child/item links from the STAC data
     * @returns {function}
     */
    getMergedChildren: (state) => (url, priority = null) => {
      const entry = state.entries[url];
      if (!entry?.data || !entry.data.isCatalogLike()) {
        return [];
      }

      const stac = entry.data;
      const isCollections = entry.childrenResponse?.type === 'collections';
      const showCollections = !priority || priority === 'collections';
      const showChilds = !priority || priority === 'childs';
      const childUrls = (isCollections && showCollections) ? (entry.children || []) : [];

      // Resolve URLs to STAC objects
      let children = childUrls
        .map(childUrl => state.entries[childUrl]?.data)
        .filter(Boolean);

      if (showChilds) {
        children = addMissingChildren(children, stac).concat(stac.getLinksWithRels(['item']));
      }
      // Add "load more" marker
      if (isCollections && showCollections) {
        const hasMore = (entry.childrenResponse?.links || []).some(l => l.rel === 'next');
        if (hasMore) {
          children.push(Utils.createLink(url, 'next'));
        }
      }
      return children;
    }
  },
  actions: {
    /**
     * Get or create an entry for a URL
     */
    getOrCreateEntry(url, path = '') {
      if (!this.entries[url]) {
        this.entries[url] = createEntry(url, path);
      }
      else if (path) {
        this.entries[url].path = path;
      }
      return this.entries[url];
    },

    /**
     * Set loading state for a URL
     */
    setLoading(url, path = '', show = false) {
      const entry = this.getOrCreateEntry(url, path);
      entry.loading = new Loading(show);
      entry.show = show || entry.show;
    },

    /**
     * Update the show state of an entry
     */
    updateShow(url, show) {
      const entry = this.entries[url];
      if (entry) {
        entry.show = show || entry.show;
      }
    },

    /**
     * Store loaded STAC data
     */
    setData(url, stac, path = '', incomplete = false) {
      const configStore = useConfigStore();
      const entry = this.getOrCreateEntry(url, path);
      entry.data = processSTAC(configStore, stac);
      entry.incompleteData = incomplete;
      entry.loading = null;
      entry.error = null;
    },

    /**
     * Store an error for a URL
     */
    setError(url, error) {
      const entry = this.getOrCreateEntry(url);
      if (!(error instanceof Error)) {
        error = new Error(error);
      }
      entry.error = error;
      entry.loading = null;
    },

    /**
     * Remove an entry from the database
     */
    remove(url) {
      delete this.entries[url];
    },

    /**
     * Clear all entries
     */
    clearAll() {
      this.entries = {};
    },

    /**
     * Set children for a URL (replaces existing)
     * @param {string} url - The parent URL
     * @param {Array<string>} childUrls - Array of child URL strings
     * @param {Object} response - API response data (with links, numberMatched, type)
     */
    setChildren(url, childUrls, response) {
      const entry = this.entries[url];
      if (entry) {
        entry.children = childUrls;
        entry.childrenResponse = response;
      }
    },

    /**
     * Append children for a URL (for "load more" pagination)
     * @param {string} url - The parent URL
     * @param {Array<string>} childUrls - Array of child URL strings to append
     * @param {Object} response - Latest API response data
     */
    appendChildren(url, childUrls, response) {
      const entry = this.entries[url];
      if (entry) {
        if (!Array.isArray(entry.children)) {
          entry.children = [];
        }
        entry.children = entry.children.concat(childUrls);
        entry.childrenResponse = response;
      }
    },

    /**
     * Reset children for a URL
     */
    resetChildren(url) {
      const entry = this.entries[url];
      if (entry) {
        entry.children = null;
        entry.childrenResponse = null;
      }
    }
  }
});


