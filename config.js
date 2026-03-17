const config = {
  catalogUrl: null,
  catalogTitle: "STAC Browser",
  catalogImage: null,
  allowExternalAccess: true, // Must be true if catalogUrl is not given
  allowedDomains: [],
  detectLocaleFromBrowser: true,
  storeLocale: true,
  locale: "en",
  fallbackLocale: "en",
  supportedLocales: [
    "de",
    "ar",
//  "de-CH",
    "es",
    "en",
//  "en-GB",
//  "en-US",
    "fr",
//  "fr-CA",
//  "fr-CH",
    "it",
//  "it-CH",
    "ro",
    "ja",
    "pt",
//  "pt-BR",
    "id",
    "pl"
  ],
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
  socialSharing: ["email", "bsky", "mastodon", "x"],
  preprocessSTAC: null,
  authConfig: null,
  crs: {},
  footerLinks: null
};

let localConfig = {};

try {
  localConfig = (await import("./config.local.js")).default ?? {};
} catch (error) {
  if (error.code !== "ERR_MODULE_NOT_FOUND") {
    throw error;
  }
}

export default Object.assign({}, config, localConfig);
