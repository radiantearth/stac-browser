module.exports = {
    catalogUrl: "https://raw.githubusercontent.com/cholmes/pdd-stac/beta2/disasters/collection.json",
    catalogTitle: "STAC Browser",
    tileSourceTemplate: "https://tiles.rdnt.io/tiles/{z}/{x}/{y}@2x?url={ASSET_HREF}",
    stacProxyUrl: null,
    tileProxyUrl: null,
    pathPrefix: "/",
    historyMode: "history",
    stacLint: true
};