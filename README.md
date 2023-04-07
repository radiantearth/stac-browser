# STAC Browser

This is a [Spatio-Temporal Asset Catalog (STAC)](https://github.com/radiantearth/stac-spec) browser for static catalogs.
Minimal support for APIs is implemented, but it not the focus of the Browser and may lead to issues.
It attempts to surface all included data in a user-centric way (an approach
which can inform how data is represented in the evolving spec). It is
implemented as a single page application (SPA) for ease of development and to
limit the overall number of catalog reads necessary when browsing (as catalogs
may be nested and do not necessarily contain references to their parents).

Version: **3.0.0** (supports all STAC versions between 0.6.0 and 1.0.0)

This package has also been published to npm as [`@radiantearth/stac-browser`](https://www.npmjs.com/package/@radiantearth/stac-browser).

It's not officially supported, but you may also be able to use it for
certain *OGC API - Records* and *OGC API - Features* compliant servers.

**Table of Contents:**
- [Examples](#examples)
- [Get Started](#get-started)
  - [Private query parameters](#private-query-parameters)
  - [Migrate from old versions](#migrate-from-old-versions)
- [Customize](#customize)
  - [Options](#options)
  - [Languages](#languages)
  - [Themes](#themes)
  - [Basemaps](#basemaps)
  - [Customize through root catalog](#customize-through-root-catalog)
  - [Custom fields](#custom-fields)
- [Docker](#docker)
- [Contributing](#contributing)
  - [Adding a new language](#adding-a-new-language)

## Examples

A demo instance is running at <https://radiantearth.github.io/stac-browser/>.

An irregularly updated version of a deployment for a specific STAC API can be found at <https://mspc.lutana.de>.

The catalog section of [STAC Index](https://stacindex.org) is also built on top of STAC Browser (currently v2).

## Get Started

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

### Private query parameters

***experimental***

STAC Browser supports "private query parameters", e.g. for passing an API key through. Any query parameter that is starting with a `~` will be stored internally, removed from the URL and be appended to STAC requests. This is useful for token-based authentication via query parameters.

So for example if your API requires to pass a token via the `API_KEY` query parameter, you can request STAC Browser as such:
`https://examples.com/stac-browser/?~API_KEY=123` which will change the URL to `https://examples.com/stac-browser/` and store the token `123` internally. The request then will have the query parameter attached and the Browser will request e.g. `https://examples.com/stac-api/?API_KEY=123`.

Please note: If the server hosting STAC Browser should not get aware of private query parameters and you are having `historyMode` set to `history`, you can also append the private query parameters to the hash so that it doesn't get transmitted to the server hosting STAC Browser. 
In this case use for example `https://examples.com/stac-browser/#?~API_KEY=123` instead of `https://examples.com/stac-browser/?~API_KEY=123`.

### Migrate from old versions

If you are running an old (standalone) version of STAC Browser (v1 or v2) without heavy modifications,
you can usually migrate easily.

The old environment variables should be transitions out of usage. Instead please use the config file or CLI parameters.
The names of the variables have slightly changed:
* `CATALOG_URL` => `catalogUrl` (make sure to append a `/` at the end of folders / API endpoints)
* `STAC_PROXY_URL` => `stacProxyUrl` (same in CLI, different format in the config file)
* `TILE_PROXY_URL` / `TILE_SOURCE_TEMPLATE` => `buildTileUrlTemplate` (this is not a 1:1 replacement, make sure to read the documentation for `buildTileUrlTemplate`)
* `PATH_PREFIX` => `pathPrefix`
* `HISTORY_MODE` => `historyMode`

You should also enable `redirectLegacyUrls` which makes sure that your old URLs are correctly parsed by STAC Browser v3 and links to the old version of STAC Browser don't get broken.

All other options you can customize to your liking.

Then simply deploy STAC Browser to the same location where you hosted STAC Browser v1/v2 before.

## Customize

### Options

All the following options can be used as explained in the chapter "Running", either through the [config file](config.js), as CLI Parameter or as environment variable (deprecated).
Some of them can also be set [through the root catalog](#customize-through-root-catalog).

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
* [showThumbnailsAsAssets](#showthumbnailsasassets)
* [defaultThumbnailSize](#defaultthumbnailsize)
* [crossOriginMedia](#crossoriginmedia)
* [requestHeaders](#requestheaders)
* [requestQueryParameters](#requestqueryparameters)
* [authConfig](#authconfig)
* [preprocessSTAC](#preprocessstac)

#### catalogUrl

The URL of the catalog to show by default.

This is usually a URL provided as string, but in the config file you can also provide a function without parameters that returns the URL, e.g. `() => window.origin.toString().replace(/\/?$/, '/')`.

If you don't point to a specific file make sure to append a `/` at the end of the URL as the trailing slash is significant. Without it, the last path component is considered to be a "file" name to be removed to get at the "directory" that is used as the base for resolving relative URLs. You should also make sure that your STAC files are following this rule as otherwise you may still run into issues with STAC Browser.

If `catalogUrl` is empty or set to `null` STAC Browser switches to a mode where it defaults to a screen where you can either insert a catalog URL or select a catalog from [stacindex.org](https://stacindex.org).

#### catalogTitle

The default title shown if no title can be read from the root STAC catalog.

#### allowExternalAccess

This allows or disallows loading and browsing external STAC data.
External STAC data is any data that is not a children of the given `catalogUrl`.
Must be set to `true` if a `catalogUrl` is not given as otherwise you won't be able to browse anything.

#### allowedDomains

You can list additional domains (e.g. `example.com`) that private data is sent to, e.g. authentication data.

#### apiCatalogPriority

For STAC APIs there are two potential sources for catalogs and collections:
1. Collections loaded from `/collections` and detected through the `data` link
2. Childs (i.e. Catalogs and Collections) loaded from various sources and detected through the `child` links

By default, STAC Browser loads and shows data from both sources, but tries to eliminate duplicates.
If you only want to show the data from one of the sources, you can use this option.
The following options are available:
- `collections`: Show only collections
- `childs`: Show only children
- `null`: Default behavior

#### detectLocaleFromBrowser

If set to `true`, tries to detect the preferred language of the user from the Browser.
Otherwise, defaults to the language set for `locale`.

#### storeLocale

If set to `true`, stores the locale selected by the user in the `localeStorage` of the browser.
Otherwise, doesn't store the locale across browser sessions.

#### locale

The default language to use for STAC Browser, defaults to `en` (English).
The language given here must be present in `supportedLocales`.

#### fallbackLocale

The language to use if individual phrases are not available in the default language, defaults to `en` (English).
The language given here must be present in `supportedLocales`.

#### supportedLocales

A list of languages to show in the STAC Browser UI.
The languages given here must have a corresponding JS and JSON file in the `src/locales` folder,
e.g. provide `en` (English) for the files in `src/locales/en`.

In CLI, please provide the languages separated by a space, e.g. `--supportedLocales en de fr it`

Please note that only left-to-right languages have been tested.
I'd need help to test support for right-to-left languages.

#### stacLint

***experimental***

Enables or disables a feature that validates the STAC catalog when opening the "Source Data" popup.
Validation uses the external service [staclint.com](https://staclint.com).

Validation is automatically disabled in the following cases:
- the host of a catalog is `localhost`, `127.0.0.1` and `::1`
- [private query parameters](#private-query-parameters) have been set
- `stacProxyUrl` is set

#### historyMode

***build-only option***

STAC Browser defaults to using [HTML5 History Mode](https://v3.router.vuejs.org/guide/essentials/history-mode.html#html5-history-mode),
which can cause problems on certain web hosts. To use _hash mode_, set `--historyMode=hash` when running or building.
This will be compatible with S3, stock Apache, etc.

#### pathPrefix

***build-only option***

If you don't deploy the STAC Browser instance at the root path of your (sub) domain, then you need to set the path prefix
when building (or running) STAC Browser.

```bash
npm run build -- --pathPrefix="/browser/"
```

This will build STAC Browser in a way that it can be hosted at `https://example.com/browser` for example.
Using this parameter for the dev server will make STAC Browser available at `http://localhost:8080/browser`.

#### stacProxyUrl

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

#### buildTileUrlTemplate

The option controls the tile layer that is used to render imagery such as (cloud-optimized) GeoTiffs.

See the [documentation for the corresponding stac-layer option](https://github.com/stac-utils/stac-layer#buildtileurltemplate) for details.

Please note that this option can only be provided through a config file and is not available via CLI.

If the option `useTileLayerAsFallback` is set to `true`, the tile server is only used as a fallback.

**Note:** This option replaces the v2 options `TILE_SOURCE_TEMPLATE` and `TILE_PROXY_URL`.
The v3-dev option `tileSourceTemplate` has been removed in favor of this option.

#### useTileLayerAsFallback

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

#### displayGeoTiffByDefault

If set to `true`, the map also shows non-cloud-optimized GeoTiff files by default. Otherwise (`false`, default), it only shows COGs and you can only enforce showing GeoTiffs to be loaded with the "Show on map" button but they are never loaded automatically.
Loading non-cloud-optimized GeoTiffs only works reliably for smaller files (< 1MB). It may also work for larger files, but it is depending a lot on the underlying client hardware and software.

#### redirectLegacyUrls

***experimental***

If you are updating from on old version of STAC Browser, you can set this option to `true` to redirect users from the old "unreadable" URLs to the new human-readable URLs.

#### itemsPerPage

The number of items requested and shown per page by default. Only applies to APIs that support the `limit` query parameter.

#### maxPreviewsOnMap

The maximum number of previews (thumbnails or overviews) of items that will be shown on the map when on Catalog or Collection pages.

#### cardViewMode

The default view mode for lists of catalogs/collections. Either `list` or `cards` (default). 

#### showThumbnailsAsAssets

Defines whether thumbnails are shown in the lists of assets (`true`, default) or not.

#### defaultThumbnailSize

The default size \[Height, Width\] for thumbnails which is reserved in card and list views so that the items don't jump when loading the images.
This can be overridden per thumbnail by declaring the [`proj:shape`](https://github.com/stac-extensions/projection/#item-properties-or-asset-fields) on the asset or link.

#### crossOriginMedia

The value for the [`crossorigin` attribute](https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/crossorigin) that is sent when loading images through the browser. Default to `null`. If you encounter issues with loading images, you may want to try setting this to `anonymous`.

#### requestHeaders

***experimental***

The headers given in this option are added to all requests that are sent to the selected STAC catalog or API.

Example: `{'Authorization': 'Bearer 134567984623223'}` adds a Bearer token to the HTTP headers.

Please note that this option can only be provided through a config file and is not available via CLI.

#### requestQueryParameters

***experimental***

The query parameters given in this option are added to all requests that are sent to the selected STAC catalog or API.

Example: `{'f': 'json'}` adds a `f` query parameter to the HTTP URL, e.g. `https://example.com?f=json`.

Please note that this option can only be provided through a config file and is not available via CLI.

#### authConfig

***experimental***

This allows to enable a simple authentication form where a user can input a token, an API key or similar things.
It is disabled by default (`null`). If enabled, the token provided by the user can be used in the HTTP headers or in the query parameters of the requests.

There are four options you can set in the `authConfig` object:

* `type` (string): `null` (disabled), `query` (use token in query parameters), or `header` (use token in HTTP request headers).
* `key` (string): The query string parameter name or the HTTP header name respecively.
* `formatter` (function|null): You can optionally specify a formatter for the query string value or HTTP header value respectively. If not given, the token is provided as provided by the user.
* `description` (string|null): Optionally a description that is shown to the user. This should explain how the token can be obtained for example. CommonMark is allowed.
    **Note:** You can leave the description empty in the config file and instead provide a localized string with the key `authConfig` -> `description` in the file for custom phrases (`src/locales/custom.js`).

Please note that this option can only be provided through a config file and is not available via CLI.

##### Example 1: HTTP Request Header Value

```js
{
  type: 'header',
  key: 'Authorization',
  formatter: token => `Bearer ${token}`,
  description: `Please retrieve the token from our [API console](https://example.com/api-console).\n\nFor further questions contact <mailto:support@example.com>.`
}
```

For a given token `123` this results in the following additional HTTP Header:
`Authorization: Bearer 123`

##### Example 2: Query Parameter Value

```js
{
  type: 'query',
  key: 'API_KEY'
}
```

For a given token `123` this results in the following query parameter:
`https://example.com/stac/catalog.json?API_KEY=123`

#### preprocessSTAC

***experimental***

This allows to preprocess the STAC Items, Catalogs and Collections that are requested from the servers using a function.
The function receives two parameters:
* `stac` (object of type `STAC`)
* `state` (the vuex state)

Please note that this option can only be provided through a config file and is not available via CLI.

##### Example: Update root catalog

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

### Languages

STAC Browser can be translated into other languages and can localize number formats, date formats etc.

You need to change the [`locale`](#locale) and [`supportedLocales`](#supportedlocales) settings to select the default language and the languages available to users.

The following languages are currently supported:
- de: German (Germany, Switzerland)
- es: Spanish
- en: English
- fr: French (Canada, France, Switzerland)
- it: Italian (Italy, Switzerland)
- ro: Romanian

To add your own language, please follow the guide below: [Adding a new langauge](#adding-a-new-language)

#### Custom phrases
You can define custom phrases in the `custom.json`.
This is especially useful for phrases that are coming from non-standadized metadata fields.
If you've found metadata labels (e.g. "Price" and "Generation Time") that are not translated,
you can add it to the `custom.json`. For metadata fields you need to add it to a the object `fields`
as it is the group for the metadata-related phrases.
There you can add as many phrases as you like. For example:
```json
{
  "fields": {
    "Price": "Preis",
    "Generation Time": "Generierungszeit"
  }
}
```

### Themes

You can customize STAC Browser in the `src/theme` folder. It contains Sass files (a CSS preprocessor), which you can change to suit your needs.

The easiest solution is to start with the `variables.scss` file and customize the options given there.
For simplicity we just provide some common options as default, but you can also add and customize any Bootstrap variable,
see <https://getbootstrap.com/docs/4.0/getting-started/theming/> for details.

The file `page.scss` contains some Sass declarations for the main sections of STAC Browser and you can adopt those to suit your needs.

If you need even more flexibility, you need to dig into the Vue files and their dependencies though.

### Basemaps

The file `basemaps.config.js` contains the configuration for the basemaps.
You can update either just the `BASEMAPS` object or you can write a custom function `configureBasemap` that returns the desired options for [vue2-leaflet](https://vue2-leaflet.netlify.app/).
[XYZ](https://vue2-leaflet.netlify.app/components/LTileLayer.html#props) and [WMS](https://vue2-leaflet.netlify.app/components/LWMSTileLayer.html#props) basemaps are supported and have different options that you can set.

### Customize through root catalog

You can also provide a couple of the config options through the root catalog. 
You need to provide a field `stac_browser` and then you can set any of the following options:
- `apiCatalogPriority`
- `authConfig` (except for the `formatter`)
- `cardViewMode`
- `crossOriginMedia`
- `defaultThumbnailSize`
- `displayGeoTiffByDefault`
- `showThumbnailsAsAssets`
- `stacLint` (can only be disabled)

### Custom fields

STAC Browser supports some non-standardized fields that you can use to improve the user-experience.

1. To the [Provider Object](https://github.com/radiantearth/stac-spec/blob/master/collection-spec/collection-spec.md#provider-object) you can add an `email` (or `mail`) field with an e-mail address and the mail will be shown in the Browser, too.
2. A link with relation type `icon` and a Browser-supported media type in any STAC entity will show an icon in the header and the lists.

## Docker

When building the Dockerfile, you can add the [`catalogUrl`](#catalogurl) 
as a [build argument](https://docs.docker.com/engine/reference/commandline/build/#set-build-time-variables---build-arg). For example:

```
docker build -t stac-browser:v1 --build-arg catalogURL=https://planetarycomputer.microsoft.com/api/stac/v1/ .
```

If more arguments need to be passed to `npm run build`, you can add them to the Dockerfile as needed.

To run the container:

```
docker run -p 8080:8080 stac-browser:v1
```

## Contributing

We are happy to review and accept Pull Requests.
STAC Browser is following the [STAC code of conduct](https://github.com/radiantearth/stac-spec/blob/master/CODE_OF_CONDUCT.md).

STAC Browser uses [Vue](https://vuejs.org/) and [vue-cli](https://cli.vuejs.org/), so you need a recent version of [NodeJS and npm](https://nodejs.org/en/) installed.

You can run the following commands (see also "[Running](#running)" above):
- `npm run install`: Install the dependencies, this is required once at the beginning.
- `npm start`: Start the development server
- `npm run lint`: Lint the source code files
- `npm run build`: Compile the source code into deployable files for the web. The resulting files can be found in the folder `dist` and you can then deploy STAC Browser on a web host. There are two other variants:
  - `npm run build:report`: Same as above, but also generates a bundle size report (see `dist/report.html`), which should not be deployed.
  - `npm run build:minimal`: Same as above, but tries to generate a minimal version without bundle size report and without source maps.
- `npm run i18n:fields`: Generates an updated version of the locales from the stac-fields package.

### Adding a new language

You can translate STAC Browser into other languages.
You can also use one of the existing languages and provide an alternate version for a specifc country, e.g. a Australian English (en-AU) version of the US-English language pack (en).

**Please follow this guide:**
- Copy the `en` folder (or any other language without a country code that you want to base the translation on).
- Name the new folder according to [RFC5646](https://www.rfc-editor.org/rfc/rfc5646).
- Add the language to the list of supported locales ([`supportedLocales`](#supportedlocales)) in the `config.js` file.
- Add the language to the [list of languages in this README file](#languages).
- Add yourself to the list of code owners (`.github/CODEOWNERS`) for this language (we'll invite you to this repository after you've opened a PR). **Persons contributing languages are expected to maintain them long-term! If you are not able to maintain the language pack, please indicate so in the PR and we'll release it separately.**
- Translate the `.json` files, most importantly `config.json`, `fields.json` and `texts.json`.
  - Please note that you never need to translate any object keys!
  - If you base your language on another existing language (e.g. create `en-IN` based on `en`) you can delete individual files and import existing files from other languages in `default.js`.
- Adapt the `datepicker.js` and `duration.js` files to import the existing definitions from their corresponding external packages, but you could also define the specifics yourself.
- Check that your translation works by running the development server (`npm start`) and navigating to the STAC Browser instance in your browser (usually `http://localhost:8080`).
- Once completed, please open a pull request and we'll get back to you as soon as possible.
