module.exports = {
    catalogUrl: null,
    catalogTitle: "Open Science Catalog",
    allowExternalAccess: true, // Must be true if catalogUrl is not given
    allowedDomains: [],
    detectLocaleFromBrowser: false,
    storeLocale: false,
    locale: "en",
    fallbackLocale: "en",
    supportedLocales: [
        "de",
//      "de-CH",
        "es",
        "en",
//      "en-GB",
        "fr",
//      "fr-CA",
//      "fr-CH",
        "it",
//      "it-CH",
        "ro",
        "ja"
    ],
    apiCatalogPriority: null,
    useTileLayerAsFallback: true,
    displayGeoTiffByDefault: false,
    buildTileUrlTemplate: ({href, asset}) => "https://tiles.rdnt.io/tiles/{z}/{x}/{y}@2x?url=" + encodeURIComponent(asset.href.startsWith("/vsi") ? asset.href : href),
    stacProxyUrl: null,
    pathPrefix: "/stac-browser/",
    historyMode: "hash",
    cardViewMode: "list",
    cardViewSort: "asc",
    showKeywordsInItemCards: false,
    showKeywordsInCatalogCards: false,
    showThumbnailsAsAssets: false,
    geoTiffResolution: 128,
    redirectLegacyUrls: false,
    itemsPerPage: 12,
    defaultThumbnailSize: null,
    maxPreviewsOnMap: 50,
    crossOriginMedia: null,
    requestHeaders: {},
    requestQueryParameters: {},
    preprocessSTAC: (stacItem => {
      const blackList= ["theme:", "variable:", "project:", "eo-mission:", "region:"];
      const keywords = stacItem.keywords;
      let returnItem = stacItem;
      if (keywords) {
        returnItem.keywords = keywords.filter(k => !blackList.find(b => k.startsWith(b)));
      }
      return returnItem;
    }),
    authConfig: null
};
