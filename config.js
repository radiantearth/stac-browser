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
        "de-CH",
        "en",
        "fr-CH",
        "it-CH",
    ],
    apiCatalogPriority: null,
    useTileLayerAsFallback: true,
    displayGeoTiffByDefault: false,
    buildTileUrlTemplate: ({href, asset}) => "https://tiles.rdnt.io/tiles/{z}/{x}/{y}@2x?url=" + encodeURIComponent(href),
    stacProxyUrl: null,
    pathPrefix: "/",
    historyMode: "history",
    cardViewMode: "cards",
    cardViewSort: "asc",
    showKeywordsInItemCards: false,
    showKeywordsInCatalogCards: false,
    showThumbnailsAsAssets: false,
    geoTiffResolution: 128,
    redirectLegacyUrls: false,
    itemsPerPage: 12,
    maxItemsPerPage: 1000,
    defaultThumbnailSize: null,
    maxPreviewsOnMap: 50,
    crossOriginMedia: null,
    requestHeaders: {},
    requestQueryParameters: {},
    socialSharing: ['email', 'bsky', 'mastodon', 'x'],
    preprocessSTAC: stac => {
        if (stac.getBrowserPath() == '/') {
          stac.conformsTo.push('https://api.stacspec.org/v1.0.0/item-search');
          stac.links = stac.links.map(link => {
            if (link.rel === 'search') {
              link.type = 'application/geo+json';
            }
            return link;
          });
        }
        return stac;
      },
    authConfig: null
};
