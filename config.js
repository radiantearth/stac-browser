const TITLE = "CREODIAS STAC API";
export default {
  catalogUrl: "https://stac.creodias.eu",
  catalogTitle: TITLE,
  catalogTitleAfterImage: "STAC API",
  catalogImage: "https://creodias.eu/wp-content/themes/creodias/img/logo.svg",
  allowExternalAccess: false, // Must be true if catalogUrl is not given
  allowedDomains: [
    "creodias.eu",
  ],
  enforcedColorMode: "dark",
  detectLocaleFromBrowser: true,
  storeLocale: true,
  locale: "en",
  fallbackLocale: "en",
  supportedLocales: [
    "ar",
    "de",
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
    "ru",
    "ja",
    "pt",
//  "pt-BR",
    "id",
    "pl",
    "sv"
  ],
  apiCatalogPriority: null,
  useTileLayerAsFallback: false,
  displayGeoTiffByDefault: false,
  displayPreview: true,
  displayOverview: true,
  displayOverviewsForChildren: false,
  buildTileUrlTemplate: null,
  getMapSourceOptions: null,
  pathPrefix: "/",
  historyMode: "history",
  cardViewMode: "cards",
  defaultCollectionSort: null, // should probably be title, but errors currently (HTTP 400 from API)
  defaultItemSort: null,
  showKeywordsInItemCards: false,
  showKeywordsInCatalogCards: false,
  preferredAssets: true,
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
  preprocessSTAC: stac => {
    if (stac.getBrowserPath() === '/') {
      stac.title = TITLE;
      stac.description = "Access all EO data offered by CREODIAS through their STAC API.";
    }
    return stac;
  },
  authConfig: {
    type: "openIdConnect",
    openIdConnectUrl: "https://identity.cloudferro.com/auth/realms/creodias-new/.well-known/openid-configuration"
  },
  crs: {},
  footerLinks: null
};
