# Options

STAC Browser exposes a wide variety of configuration options.
The following options can be provided in various ways to STAC Browser, either when running it or when building it.

The following ways to set config options are possible:
- Customize the **[config file](../config.js)** (recommended)
- Additionally, some options can be [provided through the **root catalog**](../README.md#customize-through-root-catalog) for consistency across multiple deployments (recommended)
- Append them to the **CLI** command as parameter (see [Get Started](../README.md#get-started) for an example)
- Set **environment variables**, all options need a `SB_` prefix.
  So you could for example set the catalog URL via the environment variable `SB_catalogUrl`.
- Optionally, you can also set options after the build, basically **at "runtime"**.
  Enable this by removing the `<!--` and `-->` around the `<script defer="defer" src="./config.js"></script>` in the [`public/index.html`](../public/index.html).
  Then run the build procedure and after completion, you can fill the `dist/config.js` with any options that you want to customize.

**The following options are available:**
* [catalogUrl](#catalogurl)
* [catalogTitle](#catalogtitle)
* [allowExternalAccess](#allowexternalaccess)
* [allowedDomains](#alloweddomains)
* [apiCatalogPriority](#apicatalogpriority)
* [detectLocaleFromBrowser](#detectlocalefrombrowser)
* [storeLocale](#storelocale)
* [locale](#locale)
* [fallbackLocale](#fallbacklocale)
* [supportedLocales](#supportedlocales)
* [stacLint](#staclint)
* [historyMode](#historymode)
* [pathPrefix](#pathprefix)
* [stacProxyUrl](#stacproxyurl)
* [buildTileUrlTemplate](#buildtileurltemplate)
* [useTileLayerAsFallback](#usetilelayerasfallback)
* [displayGeoTiffByDefault](#displaygeotiffbydefault)
* [redirectLegacyUrls](#redirectlegacyurls)
* [itemsPerPage](#itemsperpage)
* [maxPreviewsOnMap](#maxpreviewsonmap)
* [cardViewMode](#cardviewmode)
* [cardViewSort](#cardviewsort)
* [showThumbnailsAsAssets](#showthumbnailsasassets)
* [defaultThumbnailSize](#defaultthumbnailsize)
* [crossOriginMedia](#crossoriginmedia)
* [requestHeaders](#requestheaders)
* [requestQueryParameters](#requestqueryparameters)
* [authConfig](#authconfig)
* [preprocessSTAC](#preprocessstac)

## catalogUrl

The URL of the catalog to show by default.

The URL provided here **must** match exactly with the `href` that is provided as `self` link in the response body of the URL.

This is usually a URL provided as string, but in the config file you can also provide a function without parameters that returns the URL, e.g. `() => window.origin.toString().replace(/\/?$/, '/')`.

If `catalogUrl` is empty or set to `null` STAC Browser switches to a mode where it defaults to a screen where you can either insert a catalog URL or select a catalog from [stacindex.org](https://stacindex.org).

## catalogTitle

The default title shown if no title can be read from the root STAC catalog.

## allowExternalAccess

This allows or disallows loading and browsing external STAC data.
External STAC data is any data that is not a children of the given `catalogUrl`.
Must be set to `true` if a `catalogUrl` is not given as otherwise you won't be able to browse anything.

## allowedDomains

You can list additional domains (e.g. `example.com`) that private data is sent to, e.g. authentication data.
This applies to query paramaters and request headers.

## apiCatalogPriority

For STAC APIs there are two potential sources for catalogs and collections:
1. Collections loaded from `/collections` and detected through the `data` link
2. Childs (i.e. Catalogs and Collections) loaded from various sources and detected through the `child` links

By default, STAC Browser loads and shows data from both sources, but tries to eliminate duplicates.
If you only want to show the data from one of the sources, you can use this option.
The following options are available:
- `collections`: Show only collections
- `childs`: Show only children
- `null`: Default behavior

## detectLocaleFromBrowser

If set to `true`, tries to detect the preferred language of the user from the Browser.
Otherwise, defaults to the language set for `locale`.

## storeLocale

If set to `true`, stores the locale selected by the user in the `localStorage` of the browser.
Otherwise, doesn't store the locale across browser sessions.

## locale

The default language to use for STAC Browser, defaults to `en` (English).
The language given here must be present in `supportedLocales`.

## fallbackLocale

The language to use if individual phrases are not available in the default language, defaults to `en` (English).
The language given here must be present in `supportedLocales`.

## supportedLocales

A list of languages to show in the STAC Browser UI.
The languages given here must have a corresponding JS and JSON file in the `src/locales` folder,
e.g. provide `en` (English) for the files in `src/locales/en`.

In CLI, please provide the languages separated by a space, e.g. `--supportedLocales en de fr it`

Please note that only left-to-right languages have been tested.
I'd need help to test support for right-to-left languages.

## stacLint

***experimental***

Enables or disables a feature that validates the STAC catalog when opening the "Source Data" popup.
Validation uses the external service [staclint.com](https://staclint.com).

Validation is automatically disabled in the following cases:
- the host of a catalog is `localhost`, `127.0.0.1` or `::1`
- [private query parameters](../README.md#private-query-parameters) have been set
- `stacProxyUrl` is set

## historyMode

***build-only option***

### `history`
STAC Browser defaults to _history mode_ (value `history` in the config file), which is based on 
[HTML5 History Mode](https://v3.router.vuejs.org/guide/essentials/history-mode.html#html5-history-mode).
It gives the best experience and allows search engines to better crawl STAC Browser so that it can be found in search engines.

**History mode requires that you enable custom URL rewriting rules on your host/server**, otherwise people can not reload pages 
or share URLs without getting a "page not found" error (404).
The following link explains the details and provides examples for various common server software:
**<https://v3.router.vuejs.org/guide/essentials/history-mode.html#example-server-configurations>**

Please note that you can't host any other files in the folder that STAC Browser is in as the URL rewriting
will redirect all requests to these (sub)-folders and included files to STAC Browser.
This also excludes hosting your STAC catalog in the STAC Browser (sub-)folders.

### `hash`
If your host/server doesn't support URL rewriting or you experience other related problems, you can enable _hash mode_.
Either set this option to `hash` in the config file or append `--historyMode=hash` when running or building.
Known hosts that require hash mode are Amazon S3 and GitHub Pages.

## pathPrefix

***build-only option***

If you don't deploy the STAC Browser instance at the root path of your (sub) domain, then you need to set the path prefix
when building (or running) STAC Browser.

```bash
npm run build -- --pathPrefix="/browser/"
```

This will build STAC Browser in a way that it can be hosted at `https://example.com/browser` for example.
Using this parameter for the dev server will make STAC Browser available at `http://localhost:8080/browser`.

## stacProxyUrl

***experimental***

Setting the `stacProxyUrl` allows users to modify the URLs contained in the catalog to point to another location.
For instance, if you are serving a catalog on the local file system at `/home/user/catalog.json`, but want to serve
the data out from a server located at `http://localhost:8888/`, you can use:

```bash
npm start -- --open --stacProxyUrl=/home/user http://localhost:8888
```

Notice the format of the value:
* In CLI it is the original location and the proxy location separated by a space character, i.e. `{original} {proxy}` as in the example above.
* In the config file it is a two-element array with the original location as first element and the proxy location as the second element. Set the option to `null` to disable it (default).

In this example, any href contained in the STAC (including link or asset hrefs) will replace any occurrence of `/home/user/` with `http://localhost:8888`.

This can also be helpful when proxying a STAC that does not have cors enabled;
by using stacProxyUrl you can proxy the original STAC server with one that enables cors and be able to browse that catalog.

## buildTileUrlTemplate

The option controls the tile layer that is used to render imagery such as (cloud-optimized) GeoTiffs.

See the [documentation for the corresponding stac-layer option](https://github.com/stac-utils/stac-layer#buildtileurltemplate) for details.

Please note that this option can only be provided through a config file and is not available via CLI/ENV.

If the option `useTileLayerAsFallback` is set to `true`, the tile server is only used as a fallback.

**Note:** This option replaces the v2 options `TILE_SOURCE_TEMPLATE` and `TILE_PROXY_URL`.
The v3-dev option `tileSourceTemplate` has been removed in favor of this option.

## useTileLayerAsFallback

Depending on this option, either client-side or server-side rendering of imagery such as (cloud-optimized) GeoTiffs can be enabled/disabled.

If `buildTileUrlTemplate` is given server-side rendering of GeoTiffs is enabled. 
If server-side rendering should only be used as a fallback for client-side rendering, enable the boolean `useTileLayerAsFallback` option.

To clarify the behavior, please have a look at the following table:

| `useTileLayerAsFallback` | `buildTileUrlTemplate` | primary imagery renderer | fallback  imagery renderer |
| ----- | ---------------------- | ----------- | ----------- |
| true  | function | client-side | tile-server |
| false | function | tile-server | none        |
| true  | null     | client-side | none        |
| false | null     | none        | none        |

By default, client-side rendering is enabled. A server-side fallback is provided via the [tiles.rdnt.io](https://github.com/radiantearth/tiles.rdnt.io) project, which serves publicly accessible GeoTiffs as tile layers.

## displayGeoTiffByDefault

If set to `true`, the map also shows non-cloud-optimized GeoTiff files by default. Otherwise (`false`, default), it only shows COGs and you can only enforce showing GeoTiffs to be loaded with the "Show on map" button but they are never loaded automatically.
Loading non-cloud-optimized GeoTiffs only works reliably for smaller files (< 1MB). It may also work for larger files, but it is depending a lot on the underlying client hardware and software.

## redirectLegacyUrls

***experimental***

If you are updating from on old version of STAC Browser, you can set this option to `true` to redirect users from the old "unreadable" URLs to the new human-readable URLs.

## itemsPerPage

The number of items requested and shown per page by default. Only applies to APIs that support the `limit` query parameter.

## maxPreviewsOnMap

The maximum number of previews (thumbnails or overviews) of items that will be shown on the map when on Catalog or Collection pages.

## cardViewMode

The default view mode for lists of catalogs/collections. Either `"list"` or `"cards"` (default). 

## cardViewSort

The default sorting for lists of catalogs/collections or items. One of:
- `"asc"`: ascending sort (default)
- `"desc"`: descending sort
- `null`: sorted as in the source files

## showThumbnailsAsAssets

Defines whether thumbnails are shown in the lists of assets (`true`, default) or not.

## defaultThumbnailSize

The default size \[Height, Width\] for thumbnails which is reserved in card and list views so that the items don't jump when loading the images.
This can be overridden per thumbnail by declaring the [`proj:shape`](https://github.com/stac-extensions/projection/#item-properties-or-asset-fields) on the asset or link.

## crossOriginMedia

The value for the [`crossorigin` attribute](https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/crossorigin) that is sent when loading images through the browser. Default to `null`. If you encounter issues with loading images, you may want to try setting this to `anonymous`.

## requestHeaders

***experimental***

The headers given in this option are added to all requests that are sent to the selected STAC catalog or API.
This is affected by [`allowedDomains`](#alloweddomains).

Example: `{'Authorization': 'Bearer 134567984623223'}` adds a Bearer token to the HTTP headers.

Please note that this option can only be provided through a config file and is not available via CLI/ENV.

## requestQueryParameters

***experimental***

The query parameters given in this option are added to all requests that are sent to the selected STAC catalog or API.
This is affected by [`allowedDomains`](#alloweddomains).

Example: `{'f': 'json'}` adds a `f` query parameter to the HTTP URL, e.g. `https://example.com?f=json`.

Please note that this option can only be provided through a config file and is not available via CLI/ENV.

## authConfig

***experimental***

This allows to enable a simple authentication form where a user can input a token, an API key or similar things.
It is disabled by default (`null`). If enabled, the token provided by the user can be used in the HTTP headers or in the query parameters of the requests. This option is affected by [`allowedDomains`](#alloweddomains).

There are four options you can set in the `authConfig` object:

* `type` (string): `null` (disabled), `"query"` (use token in query parameters), or `"header"` (use token in HTTP request headers).
* `key` (string): The query string parameter name or the HTTP header name respecively.
* `formatter` (function|string|null): You can optionally specify a formatter for the query string value or HTTP header value respectively. If the string `"Bearer"` is provided formats as a Bearer token according to RFC 6750. If not given, the token is provided as provided by the user.
* `description` (string|null): Optionally a description that is shown to the user. This should explain how the token can be obtained for example. CommonMark is allowed.
    **Note:** You can leave the description empty in the config file and instead provide a localized string with the key `authConfig` -> `description` in the file for custom phrases (`src/locales/custom.js`).

Please note that this option can only be provided through a config file and is not available via CLI/ENV.

### Example 1: HTTP Request Header Value

```js
{
  type: 'header',
  key: 'Authorization',
  formatter: token => `Bearer ${token}`, // This is an example, there's also the simpler variant to just provide the string 'Bearer' in this case
  description: `Please retrieve the token from our [API console](https://example.com/api-console).\n\nFor further questions contact <mailto:support@example.com>.`
}
```

For a given token `123` this results in the following additional HTTP Header:
`Authorization: Bearer 123`

### Example 2: Query Parameter Value

```js
{
  type: 'query',
  key: 'API_KEY'
}
```

For a given token `123` this results in the following query parameter:
`https://example.com/stac/catalog.json?API_KEY=123`

## preprocessSTAC

***experimental***

This allows to preprocess the STAC Items, Catalogs and Collections that are requested from the servers using a function.
The function receives two parameters:
* `stac` (object of type `STAC`)
* `state` (the vuex state)

Please note that this option can only be provided through a config file and is not available via CLI/ENV.

### Example: Update root catalog

Some root catalogs in implementations don't have very useful titles, descriptions and are not a nice "intro" for new users.
Thus, it may make sense to change the root catalog to provide more useful information.
Of course, ideally you'd want to update the root catalog itself, but until then you can use this.

```js
preprocessSTAC: (stac, state) => {
    if (stac.getBrowserPath() === '/') {
        stac.title = state.catalogTitle;
        stac.description = 'This is a **much** more useful description for this catalog!';
    }
    return stac;
}
```
