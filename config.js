module.exports = {
    catalogUrl: null, // Must have a slash at the end for folders/APIs
    catalogTitle: "STAC Browser",
    allowExternalAccess: true, // Must be true if catalogUrl is not given
    allowedDomains: [],
    detectLocaleFromBrowser: true,
    locale: "en",
    fallbackLocale: "en",
    supportedLocales: [
        "en",
        "de",
        "fr"
    ],
    useTileLayerAsFallback: true,
    tileSourceTemplate: null,
    displayGeoTiffByDefault: false,
    buildTileUrlTemplate: ({href, asset}) => 'https://tiles.rdnt.io/tiles/{z}/{x}/{y}@2x?url=' + encodeURIComponent(asset.href.startsWith('/vsi') ? asset.href : href),
    stacProxyUrl: null,
    pathPrefix: "/",
    historyMode: "history",
    cardViewMode: 'cards',
    showThumbnailsAsAssets: false,
    stacLint: true,
    geoTiffResolution: 128,
    redirectLegacyUrls: false,
    itemsPerPage: 12,
    defaultThumbnailSize: null,
    maxPreviewsOnMap: 50,
    crossOriginMedia: null,
    requestHeaders: {},
    requestQueryParameters: {},
    preprocessSTAC: null,
    authConfig: null
};