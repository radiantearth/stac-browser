module.exports = {
    catalogUrl: null,
    catalogTitle: "STAC Browser",
    allowExternalAccess: true, // Must be true if catalogUrl is not given
    tileSourceTemplate: "https://tiles.rdnt.io/tiles/{z}/{x}/{y}@2x?url={url}",
    buildTileUrlTemplate: null,
    stacProxyUrl: null,
    tileProxyUrl: null,
    pathPrefix: "/",
    historyMode: "history",
    stacLint: true,
    geoTiffResolution: 128,
    redirectLegacyUrls: false
};