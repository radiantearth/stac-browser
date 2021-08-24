# STAC Browser

This is a [Spatio-Temporal Asset Catalog (STAC)](https://github.com/radiantearth/stac-spec) browser for static catalogs.
Minimal support for APIs is implemented, but it not the focus of the Browser and may lead to issues.
It attempts to surface all included data in a user-centric way (an approach
which can inform how data is represented in the evolving spec). It is
implemented as a single page application (SPA) for ease of development and to
limit the overall number of catalog reads necessary when browsing (as catalogs
may be nested and do not necessarily contain references to their parents).

Version: **3.0.0-alpha.3** (supports all STAC versions between 0.6.0 and 1.0.0)

This package has also been published to npm as [`@radiantearth/stac-browser`](https://www.npmjs.com/package/@radiantearth/stac-browser).

## Examples

* [FedEO Clearinghouse](https://geo.spacebel.be/)
* [radarsat-1](https://www.radarstac.com/)

For a longer list of examples, checkout out [STAC Index](https://stac-index.org).

## Running

First, you need to install all dependencies:
```bash
npm install
```

By default, stac-browser will browse the
[testbed Planet catalog](https://raw.githubusercontent.com/cholmes/sample-stac/master/stac/catalog.json).

To browse your own, set the `catalogUrl` CLI parameter when running the dev server:
```bash
npm start -- --open --catalogUrl="http://path/to/catalog.json"
```

## Other options

All the following options can be used as explained in the chapter "Running", either as CLI Parameter or as environment variable (deprecated).

### historyMode (build-only option)

STAC Browser defaults to using [HTML5 History Mode](https://router.vuejs.org/guide/essentials/history-mode.html),
which can cause problems on certain web hosts. To use _hash mode_, set `--historyMode=hash` when running or building.
This will be compatible with S3, stock Apache, etc.

### pathPrefix (build-only option)

If you don't deploy the STAC Browser instance at the root path of your (sub) domain, then you need to set the path prefix
when building (or running) STAC Browser.

```bash
npm run build -- --pathPrefix="/browser/"
```

This will build STAC Browser in a way that it can be hosted at `https://example.com/browser` for example.
Using this parameter for the dev server will make STAC Browser available at `http://localhost:8080/browser`.

### stacProxyUrl

Setting the `stacProxyUrl` allows users to modify the URLs contained in the catalog to point to another location.
For instance, if you are serving a catalog on the local file system at `/home/user/catalog.json`, but want to serve
the data out from a server located at `http://localhost:8888/`, you can use:

```bash
npm start -- --open --stacProxyUrl="/home/user|http://localhost:8888"
```

Notice the format of the value: it is the original location and the proxy location separated by the `|` character, i.e. `{original}|{proxy}`.

In this example, any href contained in the STAC (including link or asset hrefs) will replace any occurrence of `/home/user/` with `http://localhost:8888`.

This can also be helpful when proxying a STAC that does not have cors enabled; by using stacProxyUrl you can proxy the original STAC server with one that enables cors
and be able to browse that catalog.

### tileSourceTemplate

The `tileSourceTemplate` environment variable controls the tile layer that is used to render COGs. If not set, the default value is:
`https://tiles.rdnt.io/tiles/{z}/{x}/{y}@2x?url={url}`,
which uses the [tiles.rdnt.io](https://github.com/radiantearth/tiles.rdnt.io) project to serve publicly accessible COGs as tile layers.

The format of this value is a tile layer template with an optional `{url}` that will be replaced with the COG asset href. For example,
using a local version of [titiler](https://github.com/developmentseed/titiler) to serve local COG files would look something like:

```bash
npm start -- --open --tileSourceTemplate="http://localhost:8000/cog/tiles/{z}/{x}/{y}?url={url}"
```

### tileProxyUrl

`tileProxyUrl` is very similar to STAC_PROXY_URL, but is only used for asset hrefs passed into the tileSourceTemplate. This enables deployment scenarios where the tiler needs to reference a proxy server by a different name, e.g. in a docker-compose setup with linked containers.

### redirectLegacyUrls

If you are updating from on old version of STAC Browser, you can set this option to `true` to redirect users from the old "unreadable" URLs to the new human-readable URLs.

## Theming

You can customize STAC Browser in the `src/theme` folder. It contains Sass files (a CSS preprocessor), which you can change to suit your needs.

The easiest solution is to start with the `variables.scss` file and customize the options given there.
For simplicity we just provide some common options as default, but you can also add and customize any Bootstrap variable,
see <https://getbootstrap.com/docs/4.0/getting-started/theming/> for details.

The file `page.scss` contains some Sass declarations for the main sections of STAC Browser and you can adopt those to suit your needs.

If you need even more flexibility (which I doubt), you need to dig into the Vue files and their dependencies though.

## Custom fields

STAC Browser supports some non-standardized fields that you can use to improve the user-experience.

1. To the [Provider Object](https://github.com/radiantearth/stac-spec/blob/master/collection-spec/collection-spec.md#provider-object) you can add an `email` (or `mail`) field with an e-mail address and the mail will be shown in the Browser, too.

## Building

```bash
npm run build -- --catalogUrl="http://path/to/catalog.json"
```

If you'd like to publish the STAC Browser instance not on the root path of your domain, 
you can use the `pathPrefix` option (see above).

## Publishing

After building, `dist/` will contain all assets necessary to
host the browser. These can be manually copied to your web host of choice.

## Contributing

STAC Browser uses [Vue](https://vuejs.org/).

To lint the source code, run `npm run lint`