# STAC Browser

This is a [Spatio-Temporal Asset Catalog (STAC)](https://github.com/radiantearth/stac-spec) browser for static catalogs.
Minimal support for APIs is implemented, but it not the focus of the Browser and may lead to issues.
It attempts to surface all included data in a user-centric way (an approach
which can inform how data is represented in the evolving spec). It is
implemented as a single page application (SPA) for ease of development and to
limit the overall number of catalog reads necessary when browsing (as catalogs
may be nested and do not necessarily contain references to their parents).

Version: **3.0.0-beta.3** (supports all STAC versions between 0.6.0 and 1.0.0)

This package has also been published to npm as [`@radiantearth/stac-browser`](https://www.npmjs.com/package/@radiantearth/stac-browser).

## Examples

For a list of examples, check out [STAC Index](https://stacindex.org).

## Running

First, you need to install all dependencies:
```bash
npm install
```

By default, STAC Browser will let you browse all catalogs on STAC Index.

To browse only your own static STAC catalog or STAC API, set the `catalogUrl` CLI parameter when running the dev server:

```bash
npm start -- --open --catalogUrl="http://path/to/catalog.json"
```
To open a local file on your system, see the chapter [Using Local Files](local_files.md).

If you'd like to publish the STAC Browser instance use the following command:

```bash
npm run build -- --catalogUrl="http://path/to/catalog.json"
```

This will only work on the root path of your domain though. If you'd like to publish in a sub-folder, 
you can use the [`pathPrefix`](#pathprefix) option.

After building, `dist/` will contain all assets necessary to
host the browser. These can be manually copied to your web host of choice.

You can customize STAC Browser, too. See the options and theming details below. If not stated otherwise, all options can either be specified via CLI or in the [config file](config.js).

## Options

All the following options can be used as explained in the chapter "Running", either through the [config file](config.js), as CLI Parameter or as environment variable (deprecated).

### catalogUrl

The URL of the catalog to show by default. If you don't point to a specific file make sure to append a `/` at the end of the URL!
If `catalogUrl` is empty or set to `null` STAC Browser switches to a mode where it defaults to a screen where you can either insert a catalog URL or select a catalog from [stacindex.org](https://stacindex.org).

### catalogTitle

The default title shown if no title can be read from the root STAC catalog.

### allowExternalAccess

This allows or disallows loading and browsing external STAC data.
External STAC data is any data that is not a children of the given `catalogUrl`.
Must be set to `true` if a `catalogUrl` is not given as otherwise you won't be able to browse anything.

### stacLint

***experimental***

Enables or disables a feature that validates the STAC catalog when opening the "Source Data" popup.
Validation uses the external service [staclint.com](https://staclint.com).

Validation is automatically disabled in the following cases:
- the host of a catalog is `localhost`, `127.0.0.1` and `::1`
- [private query parameters](#private-query-parameters) have been set
- `stacProxyUrl` is set

### historyMode

***build-only option***

STAC Browser defaults to using [HTML5 History Mode](https://router.vuejs.org/guide/essentials/history-mode.html),
which can cause problems on certain web hosts. To use _hash mode_, set `--historyMode=hash` when running or building.
This will be compatible with S3, stock Apache, etc.

### pathPrefix

***build-only option***

If you don't deploy the STAC Browser instance at the root path of your (sub) domain, then you need to set the path prefix
when building (or running) STAC Browser.

```bash
npm run build -- --pathPrefix="/browser/"
```

This will build STAC Browser in a way that it can be hosted at `https://example.com/browser` for example.
Using this parameter for the dev server will make STAC Browser available at `http://localhost:8080/browser`.

### stacProxyUrl

***experimental***

Setting the `stacProxyUrl` allows users to modify the URLs contained in the catalog to point to another location.
For instance, if you are serving a catalog on the local file system at `/home/user/catalog.json`, but want to serve
the data out from a server located at `http://localhost:8888/`, you can use:

```bash
npm start -- --open --stacProxyUrl="/home/user;http://localhost:8888"
```

Notice the format of the value:
* In CLI it is the original location and the proxy location separated by the `;` character, i.e. `{original};{proxy}`.
* In the config file it is a two-element array with the original location as first element and the proxy location as the second element. Set to `null` to disable (default).

In this example, any href contained in the STAC (including link or asset hrefs) will replace any occurrence of `/home/user/` with `http://localhost:8888`.

This can also be helpful when proxying a STAC that does not have cors enabled;
by using stacProxyUrl you can proxy the original STAC server with one that enables cors and be able to browse that catalog.

### tileSourceTemplate

The `tileSourceTemplate` variable controls the tile layer that is used to render COGs.

The format of this value is a tile layer template with an optional `{url}` that will be replaced with the COG asset href. For example,
using a local version of [titiler](https://github.com/developmentseed/titiler) to serve local COG files would look something like:

```bash
npm start -- --open --tileSourceTemplate="http://localhost:8000/cog/tiles/{z}/{x}/{y}?url={url}"
```

### buildTileUrlTemplate

A more flexible option than `tileSourceTemplate` is passing a function to `buildTileUrlTemplate`.
See the [documentation for the corresponding stac-layer option](https://github.com/stac-utils/stac-layer#buildtileurltemplate) for details.

This option replaces the v2 option `tileProxyUrl`.

Please note that this option can only be provided through a config file and is not available via CLI.

### useTileLayerAsFallback

If either `tileSourceTemplate` or `buildTileUrlTemplate` are given server-side rendering of COGs is enabled. 
If server-side rendering should only be used as a fallback for client-side rendering, enable the boolean `useTileLayerAsFallback` option.

By default, client-side COG rendering is enabled. A server-side fallback is provided via the [tiles.rdnt.io](https://github.com/radiantearth/tiles.rdnt.io) project, which serves publicly accessible COGs as tile layers.

### redirectLegacyUrls

***experimental***

If you are updating from on old version of STAC Browser, you can set this option to `true` to redirect users from the old "unreadable" URLs to the new human-readable URLs.

### itemsPerPage

The number of items requested and shown per page by default. Only applies to APIs that support the `limit` query parameter.

### maxPreviewsOnMap

The maximum number of previews (thumbnails or overviews) of items that will be shown on the map when on Catalog or Collection pages.

### cardViewMode

The default view mode for lists of catalogs/collections. Either `list` or `cards` (default). 

### showThumbnailsAsAssets

Defines whether thumbnails are shown in the lists of assets (`true`, default) or not.

### crossOriginMedia

The value for the [`crossorigin` attribute](https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/crossorigin) that is sent when loading images through the browser. Default to `null`. If you encounter issues with loading images, you may want to try setting this to `anonymous`.

### requestHeaders

***experimental***

The headers given in this option are added to all requests that are sent to the selected STAC catalog or API.

Example: `{'Authentication': 'Bearer 134567984623223'}` adds a Bearer token to the HTTP headers.

Please note that this option can only be provided through a config file and is not available via CLI.

### requestQueryParameters

***experimental***

The query parameters given in this option are added to all requests that are sent to the selected STAC catalog or API.

Example: `{'f': 'json'}` adds a `f` query parameter to the HTTP URL, e.g. `https://example.com?f=json`.

Please note that this option can only be provided through a config file and is not available via CLI.

### authConfig

***experimental***

This allows to enable a simple authentication form where a user can input a token, an API key or similar things.
It is disabled by default (`null`). If enabled, the token provided by the user can be used in the HTTP headers or in the query parameters of the requests.

There are four options you can set in the `authConfig` object:

* `type` (string): Either `query` (use token in query parameters) or `header` (use token in HTTP request headers).
* `key` (string): The query string parameter name or the HTTP header name respecively.
* `formatter` (function|null): You can optionally specify a formatter for the query string value or HTTP header value respectively. If not given, the token is provided as provided by the user.
* `description` (string|null): Optionally a description that is shown to the user. This should explain how the token can be obtained for example. CommonMark is allowed.

Please note that this option can only be provided through a config file and is not available via CLI.

#### Example 1: Bearer Token in the HTTP header

```js
{
  type: 'header', // null or 'query' or 'header'
  key: 'Authentication',
  formatter: token => `Bearer ${token}`,
  description: `Please retrieve the token from our [API console](https://example.com/api-console).\n\nFor further questions contact <mailto:support@example.com>.`
}
```

For a given token `123` this results in the following additional HTTP Header:
`Authentication: Bearer 123`

#### Example 2: Bearer Token in the HTTP header

```js
{
  type: 'query',
  key: 'API_KEY'
}
```

For a given token `123` this results in the following query parameter:
`https://example.com/stac/catalog.json?API_KEY=123`

### preprocessSTAC

***experimental***

This allows to preprocess the STAC Items, Catalogs and Collections that are requested from the servers using a function.
The function receives two parameters:
* `stac` (object of type `STAC`)
* `state` (the vuex state)

Please note that this option can only be provided through a config file and is not available via CLI.

#### Example: Update root catalog

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

## Theming

You can customize STAC Browser in the `src/theme` folder. It contains Sass files (a CSS preprocessor), which you can change to suit your needs.

The easiest solution is to start with the `variables.scss` file and customize the options given there.
For simplicity we just provide some common options as default, but you can also add and customize any Bootstrap variable,
see <https://getbootstrap.com/docs/4.0/getting-started/theming/> for details.

The file `page.scss` contains some Sass declarations for the main sections of STAC Browser and you can adopt those to suit your needs.

If you need even more flexibility, you need to dig into the Vue files and their dependencies though.

## Custom fields

STAC Browser supports some non-standardized fields that you can use to improve the user-experience.

1. To the [Provider Object](https://github.com/radiantearth/stac-spec/blob/master/collection-spec/collection-spec.md#provider-object) you can add an `email` (or `mail`) field with an e-mail address and the mail will be shown in the Browser, too.
2. A link with relation type `icon` and a Browser-supported media type in any STAC entity will show an icon in the header and the lists.

## Private query parameters

***experimental***

STAC Browser supports "private query parameters", e.g. for passing an API key through. Any query parameter that is starting with a `~` will be stored internally, removed from the URL and be appended to STAC requests. This is useful for token-based authentication via query parameters.

So for example if your API requires to pass a token via the `API_KEY` query parameter, you can request STAC Browser as such:
`https://examples.com/stac-browser/?~API_KEY=123` which will change the URL to `https://examples.com/stac-browser/` and store the token `123` internally. The request then will have the query parameter attached and the Browser will request e.g. `https://examples.com/stac-api/?API_KEY=123`.

Please note: If the server hosting STAC Browser should not get aware of private query parameters and you are having `historyMode` set to `history`, you can also append the private query parameters to the hash so that it doesn't get transmitted to the server hosting STAC Browser. 
In this case use for example `https://examples.com/stac-browser/#?~API_KEY=123` instead of `https://examples.com/stac-browser/?~API_KEY=123`.

## Contributing

STAC Browser uses [Vue](https://vuejs.org/).

To lint the source code, run `npm run lint`