# Options <!-- omit in toc -->

STAC Browser exposes a wide variety of configuration options.
The following options can be provided in various ways to STAC Browser, either when running it or when building it.

The following ways to set config options are possible:

- Customize the **[config file](../config.js)** (recommended)
- Load an **external config file** via `SB_CONFIG`
- Additionally, some options can be [provided through the **root catalog**](../README.md#customization-through-root-catalog) for consistency across multiple deployments
- Set **environment variables**, all options need a `SB_` prefix.
  So you could for example set the catalog URL via the environment variable `SB_catalogUrl`.
  Vite loads `.env`, `.env.local`, `.env.[mode]` and `.env.[mode].local` automatically, so `SB_*` variables can be stored there.
  Options that expect an array or an object must be provided as a JSON string, e.g.
  `SB_footerLinks='[{"label":"Imprint","url":"https://example.com/imprint"}]'` or
  `SB_requestHeaders='{"Authorization":"Bearer …"}'`.
  For convenience, array options that only contain strings may also be given as a comma-separated list, e.g. `SB_supportedLocales=en,de,fr`.
- Optionally, you can also set options after the build, basically **at "runtime"**.
  Enable this by removing the `<!--RC` and `RC-->` around the tags that load the `runtime-config.js` (and the `<base>` tag) in the [`index.html`](../index.html).
  Then run the build procedure and after completion, you can fill the `dist/runtime-config.js` with any options that you want to customize.

> [!TIP]  
> To enable the usage of a local configuration file, follow these steps:
>
> 1. Create a `.env` file with the following content:
>
>    ```bash
>    SB_CONFIG=config.local.mjs
>    ```
>
> 2. Create a `config.local.mjs` and add options from the `config.js` as needed, for example:
>
>    ```js
>    export default {
>      catalogUrl: 'https://stac.example.com'
>    }
>    ```

The override order for the configuration is:

`config.js` (lowest priority) -> config from `SB_CONFIG` -> `SB_*` env vars -> `runtime-config.js` (highest priority)

> [!CAUTION]  
> Appending configuration options as CLI parameters to the CLI command (e.g. `npm run build -- --catalogUrl="https://example.com"`) has been removed in  STAC Browser v5.
> The reason is that such parameters are [not suppored by Vite](https://github.com/vitejs/vite/issues/7065).

## Table of Contents <!-- omit in toc -->

- [Basic configuration](#basic-configuration)
  - [catalogUrl](#catalogurl)
  - [catalogTitle](#catalogtitle)
  - [catalogTitleAfterImage](#catalogtitleafterimage)
  - [catalogImage](#catalogimage)
  - [footerLinks](#footerlinks)
  - [apiCatalogPriority](#apicatalogpriority)
- [Deployment](#deployment)
  - [historyMode](#historymode)
    - [`history`](#history)
    - [`hash`](#hash)
  - [pathPrefix](#pathprefix)
- [Security](#security)
  - [allowExternalAccess](#allowexternalaccess)
  - [allowedDomains](#alloweddomains)
  - [crossOriginMedia](#crossoriginmedia)
  - [authConfig](#authconfig)
    - [API Keys](#api-keys)
    - [HTTP Basic](#http-basic)
    - [OpenID Connect](#openid-connect)
- [Internationalization and Localization](#internationalization-and-localization)
  - [locale](#locale)
  - [fallbackLocale](#fallbacklocale)
  - [supportedLocales](#supportedlocales)
  - [detectLocaleFromBrowser](#detectlocalefrombrowser)
  - [storeLocale](#storelocale)
- [Mapping](#mapping)
  - [buildTileUrlTemplate](#buildtileurltemplate)
  - [useTileLayerAsFallback](#usetilelayerasfallback)
  - [displayPreview](#displaypreview)
  - [displayOverview](#displayoverview)
  - [displayOverviewsForChildren](#displayoverviewsforchildren)
  - [displayGeoTiffByDefault](#displaygeotiffbydefault)
  - [maxDisplayPixels](#maxdisplaypixels)
  - [crs](#crs)
  - [getMapSourceOptions](#getmapsourceoptions)
  - [getStacLayerOptions](#getstaclayeroptions)
- [User Interface](#user-interface)
  - [enforcedColorMode](#enforcedcolormode)
  - [cardViewMode](#cardviewmode)
  - [showFavorites](#showfavorites)
  - [showKeywordsInItemCards](#showkeywordsinitemcards)
  - [showKeywordsInCatalogCards](#showkeywordsincatalogcards)
  - [defaultThumbnailSize](#defaultthumbnailsize)
- [Metadata Retrieval](#metadata-retrieval)
  - [searchResultsPerPage](#searchresultsperpage)
  - [itemsPerPage](#itemsperpage)
  - [collectionsPerPage](#collectionsperpage)
  - [maxEntriesPerPage](#maxentriesperpage)
  - [defaultCollectionSort](#defaultcollectionsort)
  - [defaultItemSort](#defaultitemsort)
- [Assets](#assets)
  - [preferredAssets](#preferredassets)
  - [showThumbnailsAsAssets](#showthumbnailsasassets)
- [Transactions](#transactions)
  - [transactions](#transactions-1)
  - [transactionsRequireLogin](#transactionsrequirelogin)
  - [transactionsRequirePreflight](#transactionsrequirepreflight)
- [Service Integration](#service-integration)
  - [socialSharing](#socialsharing)
- [Advanced](#advanced)
  - [preprocessSTAC](#preprocessstac)
  - [requestHeaders](#requestheaders)
  - [requestQueryParameters](#requestqueryparameters)

## Basic configuration

### catalogUrl

The URL of the catalog to show by default.

The URL provided here **must** match exactly with the `href` that is provided as `self` link in the response body of the URL.

This is usually a URL provided as string, but in the config file you can also provide a function without parameters that returns the URL, e.g. `() => window.origin.toString().replace(/\/?$/, '/')`.

If `catalogUrl` is empty or set to `null` STAC Browser switches to a mode where it defaults to a screen where you can either insert a catalog URL or select a catalog from [stacindex.org](https://stacindex.org).

### catalogTitle

The default title shown if no title can be read from the root STAC catalog.

### catalogTitleAfterImage

A title to use in the header after the `catalogImage`.
This can be useful in the following cases:

- The image already contains the name and we do not want to show it twice
- Removing the title in favor of the image - set this value to an empty string then.

Only applies when `catalogImage` is not `null`.

### catalogImage

URL to an image to use as a logo with the title.
Should be an image that browsers can display, e.g. PNG, JPEG, WebP, or SVG.

### footerLinks

Array of links to display in the footer above the "Powered by STAC Browser" text. Each link requires a `label` and `url`.

Example:

```js
footerLinks: [
  { label: "Imprint", url: "https://example.com/imprint" },
  { label: "Terms of use", url: "https://example.com/terms" },
  { label: "Accessibility", url: "https://example.com/accessibility" },
  { label: "Privacy", url: "https://example.com/privacy" }
]
```

As an environment variable, provide the same value as a JSON string:

```bash
SB_footerLinks='[{"label":"Imprint","url":"https://example.com/imprint"},{"label":"Privacy","url":"https://example.com/privacy"}]'
```

### apiCatalogPriority

For STAC APIs there are two potential sources for catalogs and collections:

1. Collections loaded from `/collections` and detected through the `data` link
2. Childs (i.e. Catalogs and Collections) loaded from various sources and detected through the `child` links

By default, STAC Browser loads and shows data from both sources, but tries to eliminate duplicates.
If you only want to show the data from one of the sources, you can use this option.
The following options are available:

- `collections`: Show only collections
- `childs`: Show only children
- `null`: Default behavior

## Deployment

### historyMode

***build-only option***

This options handles how navigation between two pages is handled in this single-page application.
There are two options available:

#### `history`

STAC Browser defaults to and recommends *history mode* when possible (value `history` in the config file), which is based on
[HTML5 History Mode](https://v3.router.vuejs.org/guide/essentials/history-mode.html#html5-history-mode).
It gives the best experience and allows search engines to better crawl STAC Browser so that it can be found in search engines.

**History mode requires that you enable custom URL rewriting rules on your host/server**, otherwise people can not reload pages
or share URLs without getting a "page not found" error (404).
The following link explains the details and provides examples for various common server software:
**<https://v3.router.vuejs.org/guide/essentials/history-mode.html#example-server-configurations>**

Please note that you can't host any other files in the folder that STAC Browser is in as the URL rewriting
will redirect all requests to these (sub)-folders and included files to STAC Browser.
This also excludes hosting your STAC catalog in the STAC Browser (sub-)folders.

#### `hash`

If your host/server doesn't support URL rewriting or you experience other related problems, you can enable *hash mode*.
Either set this option to `hash` in the config file or as environment variable (`SB_historyMode`) when running or building.
Known hosts that require hash mode are Amazon S3 and GitHub Pages.

### pathPrefix

If you don't deploy the STAC Browser instance at the root path of your (sub) domain, then you need to set the path prefix
when building (or running) STAC Browser.

Either set this option to the respective path (e.g. `/browser/`) in the config file or as environment variable (`SB_pathPrefix`) when running or building.

With `DYNAMIC_CONFIG` (default in the [Docker image](./docker.md)), `pathPrefix` can instead be set at startup via `SB_pathPrefix` / `runtime-config.js`. Outside Docker, also set the `href` of `<base id="stac-browser-base">` in `dist/index.html` to match.

This will build STAC Browser in a way that it can be hosted at `https://example.com/browser` for example.
Using this parameter for the dev server will make STAC Browser available at `http://localhost:8080/browser`.

## Security

### allowExternalAccess

This allows or disallows loading and browsing external STAC data.
External STAC data is any data that is not a child of the given `catalogUrl`.
Must be set to `true` if a `catalogUrl` is not given as otherwise you won't be able to browse anything.

### allowedDomains

You can list additional domains or patterns that private data (query parameters and headers) is sent to, e.g. authentication data.

The provided patterns can be one of the following:

- A regular expression (i.e. a JavaScript `RegExp` object) that will be tested against the normalized absolute URL.
  (Note: Can't be provided through CLI/ENV).
- A domain (e.g. `example.com`): Matches for example.com and any subdomains (case insensitive).
- A subdomain (e.g. `stac.example.com`): Matches for stac.example.com and any subdomains (case insensitive).

Domain and subdomain patterns ignore schema, userinfo, port, path, query and fragment.

### crossOriginMedia

The value for the [`crossorigin` attribute](https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/crossorigin) that is sent when loading images through the browser. Default to `null`. If you encounter issues with loading images, you may want to try setting this to `anonymous`.

### authConfig

***experimental***

This allows to enable some authentication methods. Currently the supported methods are:

- API Keys (`type: apiKey`) via query parameter or HTTP Header
- HTTP Basic (`type: http`, `scheme: basic`)
- OpenID Connect (`type: openIdConnect`)

Authentication is disabled by default (`null`).

The options you can set in the `authConfig` object are defined in the
[Authentication Scheme Object of the STAC Authentication Extension](https://github.com/stac-extensions/authentication?tab=readme-ov-file#authentication-scheme-object) (limited by the supported methods listed above).

**Note:** Before STAC Browser 3.2.0 a different type of object was supported.
The old way is deprecated, but will be converted to the new object internally.
Please migrate to the new configuration options now.

In addition the following properties are supported:

- `formatter` (function|string|null): You can optionally specify a formatter for the query string value or HTTP header value respectively. If the string `"Bearer"` is provided formats as a Bearer token according to RFC 6750. If not given, the token is sent as provided by the user.
- `description` (string|null): Optionally a description that is shown to the user. This should explain how the credentials can be obtained for example. CommonMark is allowed.
    **Note:** You can leave the description empty in the config file and instead provide a localized string with the key `authConfig` -> `description` in the file for custom phrases (`src/locales/custom.js`).

Authentication is generally affected by the [`allowedDomains`](#alloweddomains) option.

#### API Keys

API keys can be configured to be sent via HTTP header or query parameter:

- For query parameters you need to set `in: query` with a respective `name` for the query parameter
- For HTTP headers you need to set `in: header` with a respective `name` for the header field

##### Example 1: HTTP Request Header Value <!-- omit in toc -->

```js
{
  type: 'apiKey',
  in: 'header',
  name: 'Authorization',
  formatter: token => `Bearer ${token}`, // This is an example, there's also the simpler variant to just provide the string 'Bearer' in this case
  description: `Please retrieve the token from our [API console](https://example.com/api-console).\n\nFor further questions contact <mailto:support@example.com>.`
}
```

For a given token `123` this results in the following additional HTTP Header:
`Authorization: Bearer 123`

##### Example 2: Query Parameter Value <!-- omit in toc -->

```js
{
  type: 'apiKey',
  in: 'query',
  name: 'API_KEY'
}
```

For a given token `123` this results in the following query parameter:
`https://example.com/stac/catalog.json?API_KEY=123`

#### HTTP Basic

HTTP Basic is supported according to [RFC 7617](https://datatracker.ietf.org/doc/html/rfc7617).

**Example:**

```js
{
  type: 'http',
  scheme: 'basic'
}
```

#### OpenID Connect

**IMPORTANT: OpenID Connect is only supported if `historyMode` is set to `history`!**

For OpenID Connect some additional options must be provided, which currently follow the
[oidc-client-ts `UserManagerSettings`](https://authts.github.io/oidc-client-ts/interfaces/UserManagerSettings.html).
These options (except for `issuer`) must be provided in the property `oidcConfig`.
The `client_id` option defaults to `stac-browser`.

The redirect URL for the OIDC client must be the STAC Browser URL, e.g. `https://mycompany.com/browser`, plus an appended `/auth`, so for example `https://mycompany.com/browser/auth`.

##### Example <!-- omit in toc -->

```js
{
  type: 'openIdConnect',
  openIdConnectUrl: 'https://stac.example/.well-known/openid-configuration',
  oidcConfig: {
    client_id: 'abc123'
  }
}
```

For a given token `123` this results in the following additional HTTP Header:
`Authorization: Bearer 123`

You can change the default behaviour to send it as a Bearer token by providing `in`, `name` and `format`.

#### What gets authenticated

The credentials (query parameters or HTTP headers) are attached to all requests for URLs that are
part of the catalog (see [`allowedDomains`](#alloweddomains)), external URLs never receive credentials:

- STAC documents (catalogs, collections, items, API requests)
- Downloads
- Thumbnails, icons and logos: As `<img>` elements can't send HTTP headers, images that require
  header-based credentials are loaded through an authenticated request and shown via an object URL.
  A failed image request does NOT open the login form; the image falls back to loading without headers.
- The map: GeoTIFF/COG, GeoZarr and PMTiles requests, preview images, XYZ/TileJSON/WMS/WMTS tiles,
  TileJSON manifests, WMTS capabilities requests (incl. basemaps), and vector tile basemaps
  (via a default ol-mapbox-style `transformRequest`, see [Basemaps](basemaps.md)).
- External viewer actions (e.g. geojson.io, see `assetActions.config.js`) are hidden when the data
  requires header-based credentials, as external services can't receive them. With query-based
  credentials the actions remain available (the credentials are part of the URL that is passed on).

Known limitations:

- Header-based credentials for images and tiles require the server to allow the headers in
  CORS preflight requests (the Fetch API is stricter than plain `<img>` elements).
- Cookie-based authentication works independently of all this via [`crossOriginMedia: 'use-credentials'`](#crossoriginmedia).

## Internationalization and Localization

### locale

The default language to use for STAC Browser, defaults to `en` (English).
The language given here must be present in `supportedLocales`.

### fallbackLocale

The language to use if individual phrases are not available in the default language, defaults to `en` (English).
The language given here must be present in `supportedLocales`.

### supportedLocales

A list of languages to show in the STAC Browser UI.
The languages given here must have a corresponding JS and JSON file in the `src/locales` folder,
e.g. provide `en` (English) for the files in `src/locales/en`.

In CLI, please provide the languages separated by a space, e.g. `--supportedLocales en de fr it`

Please note that only left-to-right languages have been tested.
I'd need help to test support for right-to-left languages.

### detectLocaleFromBrowser

If set to `true`, tries to detect the preferred language of the user from the Browser.
Otherwise, defaults to the language set for `locale`.

### storeLocale

If set to `true` (default), stores the locale selected by the user in the storage of the browser.
If set to `false`, doesn't store the locale across browser sessions.

Depending on the browser settings, this may store in either:

- `localStorage`
- `sessionStorage`
- cookies

In some countries this may have implications with regards to GDPR etc.
If you want to avoid this, disable this setting.

## Mapping

All the mapping-related options are passed through to [ol-stac](https://m-mohr.github.io/ol-stac/).
More information on these configuration options may be found in the [ol-stac documentation](https://m-mohr.github.io/ol-stac/en/latest/apidoc/module-ol_layer_STAC-STACLayer.html).

### buildTileUrlTemplate

This can be used to enable the usage of a tile server.
It allows rendering imagery such as (cloud-optimized) GeoTiffs through a tile server instead of doing the visualization on the client-side.

If the option `useTileLayerAsFallback` is set to `true`, the tile server is only used as a fallback.

`buildTileUrlTemplate` is disabled by default (i.e. set to `null`) since v4.0.0.

You can enable this option by providing a function with a single parameter that returns a tile server template url.
The given function can optionally be async (i.e. return a Promise).
The parameter passed into the function is an [Asset object](https://m-mohr.github.io/stac-js/latest/#asset) as defined in stac-js.

**Example**:

```js
buildTileUrlTemplate: (asset) => "https://tiles.rdnt.io/tiles/{z}/{x}/{y}@2x?url=" + encodeURIComponent(asset.getAbsoluteUrl()),
```

The function can also return `null` to not pass the given asset to the tile server,
e.g. to filter by media type or protocol based on the given Asset object.
In this case client-side rendering is used if supported, or no visualization will be provided.
For async functions (i.e. functions that return a Promise) the "Show on map" button
may appear with a slight delay, once the Promise has been resolved.

> [!NOTE]  
> The function is called for every asset that is shown in the user interface, not only for the assets
> that are actually shown on the map. Avoid heavy work such as network requests in the function,
> otherwise pages with many assets may render slowly.

**Example**:

```js
buildTileUrlTemplate: (asset) => {
  if (!asset.isCOG || !asset.getAbsoluteUrl().startsWith("https://")) {
    return null;
  }
  return "https://tiles.rdnt.io/tiles/{z}/{x}/{y}@2x?url=" + encodeURIComponent(asset.getAbsoluteUrl());
},
```

Please note that this option can only be provided through a config file and is not available via CLI/ENV.

### useTileLayerAsFallback

Depending on this option, either client-side or server-side rendering of imagery such as (cloud-optimized) GeoTiffs can be enabled/disabled.

If `buildTileUrlTemplate` is given, server-side rendering of GeoTiffs is enabled.
If server-side rendering should only be used as a fallback for client-side rendering, enable the boolean `useTileLayerAsFallback` option.

To clarify the behavior, please have a look at the following table:

| `useTileLayerAsFallback` | `buildTileUrlTemplate` | primary imagery renderer | fallback  imagery renderer |
| ----- | ---------------------- | ----------- | ----------- |
| true  | function | client-side | tile-server |
| false | function | tile-server | none        |
| true  | null     | client-side | none        |
| false | null     | none        | none        |

### displayPreview

If set to `true` (default), displays preview images that a browser can display (e.g. PNG, JPEG) on the map as default visualization, i.e. from assets with any of the roles `thumbnail`, `overview`, or a link with relation type `preview`.
The previews are often not covering the full extents and as such may be placed incorrectly on the map.

If both `displayPreview` and `displayOverview` (see below) are enabled, STAC Browser prefers the overviews (COGs) over the previews (PNG, JPEG, ...).

### displayOverview

If set to `true` (default), allows to display COGs and, if `displayGeoTiffByDefault` is enabled, GeoTiffs on the map as default visualization, usually from an asset with role `overview` or `visual`.

### displayOverviewsForChildren

Similar to `displayOverview` (see above), but defaults to `false`.
Applies only to maps that show multiple STAC entitieies, i.e. lists of items for a Collection or Search.
Displaying a large number of COGs or Zarrs at the same time on a map, can be slow.
Thus, this is disabled by default.

### displayGeoTiffByDefault

If set to `true`, the map also shows non-cloud-optimized GeoTiff files by default. Otherwise (`false`, default), it only shows COGs and you can only enforce showing GeoTiffs to be loaded with the "Show on map" button but they are never loaded automatically.
Loading non-cloud-optimized GeoTiffs only works reliably for smaller files (< 1MB) with a certain structure. It may also work for larger files, but it depends a lot on the underlying client hardware and software.

Related OpenLayers issue: [openlayers#16961](https://github.com/openlayers/openlayers/issues/16961)

### maxDisplayPixels

Corresponds to the ol-stac parameter `maxDisplayPixels`.

The maximum number of pixels the coarsest resolution level of a GeoTIFF or Zarr asset may have to be displayed on the map, as displaying the full extent of an asset loads every tile of that level. Files without (sufficient) overviews, e.g. GeoTIFFs that are not cloud-optimized or single-resolution Zarr stores, can easily exceed this limit.

Larger assets are not shown on the map automatically. When such an asset is selected through the "Show on map" button, STAC Browser asks for confirmation before displaying it.

If set to `null` (default), the ol-stac default (16 megapixels) applies. Set to a higher number to allow larger assets, or to `Infinity` to display assets of any size without confirmation.

### crs

An object of coordinate reference systems that the system needs to know.
The key is the code for the CRS, the value is the CRS definition as OGC WKT string (WKT2 is not supported).
`EPSG:3857` (Web Mercator) and `EPSG:4326` (WGS 84) don't need to be registered, they are included by default.

This is primarily useful for CRS that are used for the basemaps (see `basemaps.config.js`).
All CRS not listed here will be requested from an external service over HTTP, which is slower.

Example for EPSG:2056:

```js
{
  'EPSG:2056': 'PROJCS["CH1903+ / LV95",GEOGCS["CH1903+",DATUM["CH1903+",SPHEROID["Bessel 1841",6377397.155,299.1528128,AUTHORITY["EPSG","7004"]],AUTHORITY["EPSG","6150"]],PRIMEM["Greenwich",0,AUTHORITY["EPSG","8901"]],UNIT["degree",0.0174532925199433,AUTHORITY["EPSG","9122"]],AUTHORITY["EPSG","4150"]],PROJECTION["Hotine_Oblique_Mercator_Azimuth_Center"],PARAMETER["latitude_of_center",46.9524055555556],PARAMETER["longitude_of_center",7.43958333333333],PARAMETER["azimuth",90],PARAMETER["rectified_grid_angle",90],PARAMETER["scale_factor",1],PARAMETER["false_easting",2600000],PARAMETER["false_northing",1200000],UNIT["metre",1,AUTHORITY["EPSG","9001"]],AXIS["Easting",EAST],AXIS["Northing",NORTH],AUTHORITY["EPSG","2056"]]'
}
```

### getMapSourceOptions

Corresponds to the ol-stac parameter `getSourceOptions`:

> Optional function that can be used to configure the underlying sources. The function can do any additional work and return the completed options or a promise for the same. The function will be called with the current source options and the STAC Asset or Link.

STAC Browser applies the configured query parameters (incl. query-based credentials from
[`authConfig`](#authconfig)) to the URLs through the ol-stac option `getRequestUrl`, which runs
before the function provided here, so the options already contain the final URLs. Header-based
credentials are attached separately through the ol-stac option `getRequestHeaders`.
Neither needs to be handled here.

The function that can be provided for getMapSourceOptions has the following signature:

```js
async getSourceOptions(type, options) => options
```

For example, the following code would set the `jsonp` option for the OpenLayers TileJSON layer:

```js
getSourceOptions: async (type, options) => {
  if (type.name === 'TileJSON') {
    options.jsonp = true;
  }
  return options;
}
```

### getStacLayerOptions

A function that can customize the [ol-stac `STACLayer` options](https://m-mohr.github.io/ol-stac/en/latest/apidoc/module-ol-stac_layer_STAC-STACLayer.html)
before the layer is created for a map. It is called with the assembled options and the STAC object
that is going to be shown on the map, and must (synchronously) return the options to use.

```js
getStacLayerOptions(options, stac) => options
```

This allows to customize the map rendering per catalog, collection or item, for example to
provide a [style](https://openlayers.org/en/latest/apidoc/module-ol_layer_WebGLTile.html#~Style)
for GeoTIFF or GeoZarr layers (e.g. rescaling single-band data that would otherwise render
without contrast), or to enforce rendering specific web map links by setting `displayWebMapLink`
to an array.

For example, the following code would apply a grayscale style to all GeoZarr/GeoTIFF layers
of a specific collection:

```js
getStacLayerOptions: (options, stac) => {
  if (stac.collection === 'my-datacubes') {
    options.style = {
      color: ['array', ['/', ['band', 1], 4000], ['/', ['band', 1], 4000], ['/', ['band', 1], 4000], 1]
    };
  }
  return options;
}
```

The `data`, `children` and `assets` options are set by STAC Browser and should not be replaced.

## User Interface

### enforcedColorMode

STAC Browser supports light and dark modes since v5.0.0.
By default, this value is set to `auto`, which detects the user preference based on the system settings.
This config option allows to enforce a specific color mode, either `light` (default before v5.0.0) or `dark`.

### cardViewMode

The default view mode for lists of catalogs, collections and items. Either `"list"` or `"cards"` (default).

### showFavorites

Enables the favorites functionality if set to `true` (default).
Users can mark catalogs, collections and items as favorites and revisit them
on a separate page, which is available through a button in the header.
The favorites are only stored locally in the web browser of the user,
they are not synchronized across devices or browsers.
Users can export the favorites to a file and import them elsewhere.
Set this option to `false` to disable the functionality.

### showKeywordsInItemCards

Enables keywords in the lists of items if set to `true`. Defaults to `false`.

### showKeywordsInCatalogCards

Enables keywords in the lists of catalogs/collections if set to `true`. Defaults to `false`.

### defaultThumbnailSize

The default size \[Height, Width\] for thumbnails which is reserved in card and list views so that the items don't jump when loading the images.
This can be overridden per thumbnail by declaring the [`proj:shape`](https://github.com/stac-extensions/projection/#item-properties-or-asset-fields) on the asset or link.

## Metadata Retrieval

### searchResultsPerPage

The number of items requested and shown per page by default for search results, i.e. global item search and collection search.
If set to `null`, the server's default will be used.

This applies to the following requests:

- `GET /search`
- `GET /collections` (in Collection Search only - see `collectionsPerPage` for other cases)

### itemsPerPage

The number of items requested and shown per page by default for item lists, except for item search.
If set to `null`, the server's default will be used.

This applies to the following requests:

- `GET /collection/{collectionId}/items`

### collectionsPerPage

The number of collections requested and shown per page by default for collection lists, except for collection search.
If set to `null`, the server's default will be used.

This applies to the following requests:

- `GET /collections` (for collection lists while browsing the API/catalog - see `searchResultsPerPage` for collection search)

### maxEntriesPerPage

The maximum number of items per page that a user can request through the `limit` query parameter (`1000` by default).

### defaultCollectionSort

The default sorting for lists of catalogs/collections.

This value must conform to the textual representation of `sortby` in STAC APIs.

So if your property for sorting is "title" you have to use:

- `"title"`: ascending sort (default)
- `"-title"`: descending sort
- `null`: sorted as in the source

Doesn't apply when the catalog is static and not all information is loaded yet.

### defaultItemSort

The default sorting for lists of items.

This value must conform to the textual representation of `sortby` in STAC APIs.

So if your property for sorting is "datetime" you have to use:

- `"properties.datetime"`: ascending sort
- `"-properties.datetime"`: descending sort

So if your property for sorting is "id" you have to use:

- `"id"`: ascending sort
- `"-id"`: descending sort

Alternatively, you can use `null` to keep it sorted as in the source (default).

Doesn't apply when the catalog is static and not all information is loaded yet.

## Assets

### preferredAssets

Allows you to configure how asset alternatives should be displayed by default when a STAC Asset within an Item or Collection has multiple alternatives.

The following options are supported:

- `false`: The main asset is shown first, alternates are displayed as additional tabs.
- `true` (default): HTTP(S) assets are preferred. If the main asset uses HTTP(S), it's selected by default. Otherwise, the first HTTP(S) alternative is selected.
- `"assetKeyName"` (string): Specifies the key of the preferred asset to display by default. For example, `"s3"` would pre-select the asset with key `s3` if it exists as an alternative.

This is useful when you want to automatically display a specific asset variant (e.g., the HTTPS version accessible directly through the browser) instead of the main asset.

### showThumbnailsAsAssets

Defines whether thumbnails are shown in the lists of assets (`true`) or not (`false`, default).

## Transactions

These options configure how the management of STAC entities should work in STAC Browser.
There are two ways to manage STAC entities:

- **Internal**: The management user interface built into STAC Browser,
  which uses the STAC API transaction extensions and is only offered if the API
  advertises the corresponding conformance classes.
- **External**: A web-based management user interface provided by the server through links with the
  relation types `create-form` and `edit-form` (see [RFC 6861](https://www.rfc-editor.org/rfc/rfc6861.html))
  on the current catalog, collection or item.
  The first link per relation type that has no media type or a HTML media type (`text/html`) is used.
  The links are shown in the "Manage" menu, open in a new tab, and use the link `title` as the label.
  STAC Browser does no permission handling for external links; the target server is expected to handle
  authentication and permissions itself.

### transactions

Defines which management capabilities are offered in STAC Browser:

- `auto` (default): Prefer external links per action if present, i.e. a `create-form` link replaces the
  internal "Add Collection" / "Add Item" actions and an `edit-form` link replaces the internal "Edit" action.
  Otherwise, fall back to the internal user interface if supported by the API.
  The internal "Delete" action is offered independently as there's no external counterpart.
- `external`: Only offer the external links, if present.
- `internal`: Only offer the internal user interface, if supported by the API.
- `off`: Disable all management capabilities.

### transactionsRequireLogin

This option only affects the internal management user interface.

By default (option set to `true`), management capabilities will not be shown to unauthenticated users.
You can disable this check by setting this option to `false` and allow anyone to make transactional requests.

Disabling this is usually only reasonable for testing purposes or internal STAC APIs.
This only works in STAC Browser if the server is also configured this way.

### transactionsRequirePreflight

This option only affects the internal management user interface.

By default (option set to `true`), STAC Browser will check whether a user has permissions to make transactional requests through an `OPTIONS` HTTP request to the same resource that it checks the permissions for.
STAC Browser reads the permitted methods from the `Allow` response header.
See [ogcapi-features issue 1005](https://github.com/opengeospatial/ogcapi-features/issues/1005) for details.
You can disable this check by setting this option to `false` and allow any authenticated user to make transactional requests.

For APIs served from a different origin, the server must also expose the `Allow` header to the browser via CORS (i.e. send `Access-Control-Expose-Headers: Allow`), otherwise the browser hides it from STAC Browser and no management actions will be offered.

Disabling this is usually only reasonable for testing purposes or internal STAC APIs.
This only works in STAC Browser if the server is also configured this way.

## Service Integration

### socialSharing

Lists the social sharing service for which buttons should be shown in the "Share" panel.

The following services are supported:

- `email` (Send via e-email)
- `bsky` (Bluesky)
- `mastodon` (Mastodon.social)
- `x` (X, formerly Twitter)
## Advanced

### preprocessSTAC

***experimental***

This allows to preprocess the STAC Items, Catalogs and Collections that are requested from the servers using a function.
The function receives two parameters:

- `stac` (object of type `STAC`)
- `state` (the vuex state)

Please note that this option can only be provided through a config file and is not available via CLI/ENV.

### requestHeaders

***experimental***

The headers given in this option are added to all requests that are sent to the selected STAC catalog or API.
This is affected by [`allowedDomains`](#alloweddomains).

Example: `{'Authorization': 'Bearer 134567984623223'}` adds a Bearer token to the HTTP headers.

### requestQueryParameters

***experimental***

The query parameters given in this option are added to all requests that are sent to the selected STAC catalog or API.
This is affected by [`allowedDomains`](#alloweddomains).

Example: `{'f': 'json'}` adds a `f` query parameter to the HTTP URL, e.g. `https://example.com?f=json`.

#### Example: Update root catalog <!-- omit in toc -->

Some root catalogs in implementations don't have very useful titles, descriptions and are not a nice "intro" for new users.
Thus, it may make sense to change the root catalog to provide more useful information.
Of course, ideally you'd want to update the root catalog itself, but until then you can use this.

```js
preprocessSTAC: (stac, state, getters) => {
    if (getters.toBrowserPath(stac.getAbsoluteUrl()) === '/') {
        stac.title = state.catalogTitle;
        stac.description = 'This is a **much** more useful description for this catalog!';
    }
    return stac;
}
```
