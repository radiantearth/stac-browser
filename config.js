module.exports = {
    catalogUrl: "https://pgstac.demo.cloudferro.com/",
    catalogTitle: "Copernicus Datastapce Ecosystem (Demo)",
    allowExternalAccess: true, // Must be true if catalogUrl is not given
    allowedDomains: [
      "copernicus.eu"
    ],
    detectLocaleFromBrowser: true,
    storeLocale: true,
    locale: "en",
    fallbackLocale: "en",
    supportedLocales: [
        "de",
        "es",
        "en",
        "fr",
        "it",
        "ro",
        "pt"
    ],
    apiCatalogPriority: null,
    useTileLayerAsFallback: true,
    displayGeoTiffByDefault: false,
    buildTileUrlTemplate: ({href, asset}) => "https://tiles.rdnt.io/tiles/{z}/{x}/{y}@2x?url=" + encodeURIComponent(asset.href.startsWith("/vsi") ? asset.href : href),
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
    defaultThumbnailSize: null,
    maxPreviewsOnMap: 50,
    crossOriginMedia: null,
    requestHeaders: {},
    requestQueryParameters: {},
    preprocessSTAC: stac => {
      if (stac.getBrowserPath() === '/') {
        stac.title = 'Copernicus Datastapce Ecosystem (Demo)';
        stac.description = 'This is a demo instance of the development version of the CDSE STAC API, including authentication.';
      }
      return stac;
    },
    authConfig: {
        type: "openIdConnect",
        openIdConnectUrl:"https://identity.dataspace.copernicus.eu/auth/realms/CDSE/.well-known/openid-configuration"
    }
};
