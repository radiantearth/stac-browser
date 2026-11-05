// Cal-Adapt bear logo (public/bear.png, copied from cal-adapt-guidance/assets).
// STAC Browser resolves relative image paths against the STAC API, so build the
// full URL from the page's own address. Vite also loads this file in Node, where
// there is no window; the logo is only needed in the browser.
const calAdaptBear = typeof window === "undefined" ? null : new URL("bear.png", document.baseURI).href;

export default {
  catalogUrl: "https://stac.cal-adapt.org",
  catalogTitle: "Cal-Adapt climate data catalog",
  catalogTitleAfterImage: null,
  catalogImage: calAdaptBear,
  allowExternalAccess: true, // Must be true if catalogUrl is not given
  allowedDomains: [],
  // Light only, matching caladapt-stac-map, which has no dark mode yet. Once it
  // does, "auto" makes both follow the computer's setting.
  enforcedColorMode: "light",
  // English only: the map and the catalog's dataset text are English, so other
  // languages would give a half-translated site. Upstream also ships
  // ar, de, es, fr, it, ro, ru, ja, pt, id, pl and sv.
  detectLocaleFromBrowser: false,
  storeLocale: true,
  locale: "en",
  fallbackLocale: "en",
  supportedLocales: ["en"],
  apiCatalogPriority: null,
  useTileLayerAsFallback: false,
  displayGeoTiffByDefault: false,
  displayPreview: true,
  displayOverview: true,
  displayOverviewsForChildren: false,
  maxDisplayPixels: null,
  buildTileUrlTemplate: null,
  getMapSourceOptions: null,
  getStacLayerOptions: null,
  pathPrefix: "/",
  historyMode: "hash", // existing links use /#/ URLs
  cardViewMode: "cards",
  showFavorites: false,
  defaultCollectionSort: "title",
  defaultItemSort: null,
  showKeywordsInItemCards: false,
  showKeywordsInCatalogCards: true,
  preferredAssets: true,
  showThumbnailsAsAssets: false,
  searchResultsPerPage: null,
  itemsPerPage: 10,
  collectionsPerPage: 1000,
  maxEntriesPerPage: 1000,
  defaultThumbnailSize: null,
  crossOriginMedia: null,
  requestHeaders: {},
  requestQueryParameters: {},
  socialSharing: [], // the Share button is hidden in src/theme/custom.scss
  // Show the API's root catalog ("Cal-Adapt STAC API") under the site's own title,
  // in the browser only; the API keeps its title for people using it directly
  preprocessSTAC: (stac, state) => {
    const withoutSlash = (url) => String(url).replace(/\/$/, "");
    if (withoutSlash(stac.getAbsoluteUrl()) === withoutSlash(state.catalogUrl)) {
      stac.title = state.catalogTitle;
    }
    return stac;
  },
  authConfig: null,
  transactions: 'auto',
  transactionsRequireLogin: true,
  transactionsRequirePreflight: true,
  crs: {},
  footerLinks: [
    { label: "Cal-Adapt website", url: "https://cal-adapt.org" },
    { label: "Cal-Adapt STAC Browser on GitHub", url: "https://github.com/cal-adapt/caladapt-stac-browser" }
  ]
};
