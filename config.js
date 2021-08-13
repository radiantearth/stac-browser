module.exports = {
    catalogUrl: "http://asc-moon.s3-us-west-2.amazonaws.com/kaguyatc_dtms/collection.json",
    catalogTitle: "dev STAC browser",
    tileSourceTemplate: "https://tiles.rdnt.io/tiles/{z}/{x}/{y}@2x?url={ASSET_HREF}",
    stacProxyUrl: null,
    tileProxyUrl: null,
    pathPrefix: "/",
    historyMode: "history",
    stacLint: true
};