module.exports = {
    catalogUrl: null,
    catalogTitle: "STAC Browser",
    allowExternalAccess: true, // Must be true if catalogUrl is not given
    allowedDomains: [],
    detectLocaleFromBrowser: true,
    storeLocale: true,
    locale: "en",
    fallbackLocale: "en",
    supportedLocales: [
        "de",
        "ar",
//      "de-CH",
        "es",
        "en",
//      "en-GB",
//      "en-US",
        "fr",
//      "fr-CA",
//      "fr-CH",
        "it",
//      "it-CH",
        "ro",
        "ja",
        "pt",
//      "pt-BR"
    ],
    apiCatalogPriority: null,
    useTileLayerAsFallback: false,
    displayGeoTiffByDefault: false,
    buildTileUrlTemplate: null,
    stacProxyUrl: null,
    pathPrefix: "/",
    historyMode: "history",
    cardViewMode: "cards",
    cardViewSort: "asc",
    showKeywordsInItemCards: false,
    showKeywordsInCatalogCards: false,
    showThumbnailsAsAssets: false,
    redirectLegacyUrls: false,
    itemsPerPage: 12,
    maxItemsPerPage: 1000,
    defaultThumbnailSize: null,
    crossOriginMedia: null,
    requestHeaders: {},
    requestQueryParameters: {},
    socialSharing: ['email', 'bsky', 'mastodon', 'x'],
    preprocessSTAC: null,
    authConfig: null,
    // defaultSearchExtent e.g. [12.227593034455793, 41.78656913683952, 12.652310726657447, 42.02970865107619]
    defaultSearchExtent: null,
    crs: {}
};
