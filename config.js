export default {
    catalogUrl: "https://esa-earthcode.github.io/open-science-catalog-metadata-staging/catalog.json",
    catalogTitle: "Open Science Catalogue",
    catalogTitleAfterImage: null,
    catalogImage: null,
    apiUrl: "https://eoapi.workspace.earthcode.eox.at/stac",
    staticEndpoint: "https://esa-earthcode.github.io/open-science-catalog-metadata/",
    allowExternalAccess: true, // Must be true if catalogUrl is not given
    allowedDomains: [],
    enforcedColorMode: "light",
    detectLocaleFromBrowser: false,
    storeLocale: false,
    locale: "en",
    fallbackLocale: "en",
    supportedLocales: [
//      "de",
//      "ar",
//      "de-CH",
//      "es",
        "en",
//      "en-GB",
//      "en-US",
//      "fr",
//      "fr-CA",
//      "fr-CH",
//      "it",
//      "it-CH",
//      "ro",
//      "ru",
//      "ja",
//      "pt",
//      "pt-BR",
//      "id",
//      "pl",
//      "sv"
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
    historyMode: "hash",
    cardViewMode: "list",
    cardViewSort: "asc",
    defaultCollectionSort: "title",
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
    preprocessSTAC: (stac) => {
        if (Array.isArray(stac.links)) {
            stac.links = stac.links.map(link => {
                if (stac.type === "Feature" && link.rel === "child") {
                    link.rel = "related";
                    if (link.href.includes("/experiments/")) {
                      link.title = `Experiment: ${link.title}`;
                    }
                    if (link.href.includes("/workflows/")) {
                      link.title = `Workflow: ${link.title}`;
                    }
                    if (link.href.includes("/products/")) {
                      link.title = `Product: ${link.title}`;
                    }
                }
                // Suppress duplicate OSC metadata links from "Additional Resources" / "Related Links"
                if (link.href && (
                    link.href.includes("/projects/") ||
                    link.href.includes("/themes/") ||
                    link.href.includes("/variables/") ||
                    link.href.includes("/eo-missions/") ||
                    link.href.includes("/missions/")
                )) {
                    link.rel = "osc:metadata";
                }
                // Suppress duplicate Access links from "Additional Resources" on product pages
                const titleLower = (link.title || '').toLowerCase();
                const isDocOrLicense = titleLower.includes('documentation') || titleLower.includes('license') || titleLower.includes('publication');
                const isAccessLink = link.href && !isDocOrLicense && (
                    link.rel === 'access' ||
                    link.rel === 'osc:data-access' ||
                    titleLower === 'access' ||
                    titleLower.includes('data access') ||
                    titleLower.includes('access data') ||
                    (link.rel === 'via' && (titleLower === '' || titleLower === 'access'))
                );
                if (stac['osc:type'] === 'product' && isAccessLink) {
                    link.rel = "osc:data-access";
                }
                // Suppress sub-catalog child links from STAC Browser's separate catalogs column on product pages,
                // so that the OSC Data Access widget serves as the unified place to access the data without double display.
                if (stac['osc:type'] === 'product' && link.rel === 'child') {
                    link.rel = "osc:subcatalog";
                }
                return link;
            });
        }
        return stac;
    },
    authConfig: null,
    crs: {},
    footerLinks: null
};
