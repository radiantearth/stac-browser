import { defineStore } from 'pinia';

/**
 * Config store - holds all configuration values.
 * These come from the config file and can be overridden by the root catalog's stac_browser property.
 */
export const useConfigStore = defineStore('config', {
  state: () => ({
    catalogUrl: null,
    catalogTitle: "STAC Browser",
    catalogImage: null,
    allowExternalAccess: true,
    allowedDomains: [],
    detectLocaleFromBrowser: true,
    storeLocale: true,
    locale: "en",
    fallbackLocale: "en",
    supportedLocales: [],
    apiCatalogPriority: null,
    useTileLayerAsFallback: false,
    displayGeoTiffByDefault: false,
    displayPreview: true,
    displayOverview: true,
    buildTileUrlTemplate: null,
    getMapSourceOptions: null,
    pathPrefix: "/",
    historyMode: "history",
    cardViewMode: "cards",
    cardViewSort: "asc",
    showKeywordsInItemCards: false,
    showKeywordsInCatalogCards: false,
    showThumbnailsAsAssets: false,
    searchResultsPerPage: null,
    itemsPerPage: null,
    collectionsPerPage: null,
    maxEntriesPerPage: 1000,
    defaultThumbnailSize: null,
    crossOriginMedia: null,
    requestHeaders: {},
    requestQueryParameters: {},
    socialSharing: ['email', 'bsky', 'mastodon', 'x'],
    preprocessSTAC: null,
    authConfig: null,
    crs: {},
    footerLinks: null,
    allowSelectCatalog: false,
    valid: undefined // used in Validation view
  }),
  getters: {
  },
  actions: {
    /**
     * Initialize config from config object
     * @param {Object} config
     */
    init(config) {
      for (const key in config) {
        if (key in this.$state) {
          this.$state[key] = config[key];
        }
      }
      // Set once based on initial config and never change again,
      // so that demo mode (no catalogUrl) keeps using external paths
      // even after catalogUrl gets set at runtime.
      this.allowSelectCatalog = !config.catalogUrl;
    },
    /**
     * Update config values
     * @param {Object} config - key/value pairs to update
     */
    async updateConfig(config) {
      for (const key in config) {
        const value = config[key];
        switch (key) {
          case 'catalogTitle':
            this.catalogTitle = value;
            break;
          case 'catalogUrl':
            if (typeof value === 'function') {
              this.catalogUrl = value();
            }
            else if (typeof value === 'string') {
              this.catalogUrl = value;
            }
            break;
          case 'crossOriginMedia':
            this.crossOriginMedia = ['anonymous', 'use-credentials'].includes(value) ? value : null;
            break;
          default:
            if (key in this.$state) {
              this.$state[key] = value;
            }
        }
      }
    }
  }
});
