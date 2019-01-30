# STAC Browser

This is a [Spatio-Temporal Asset Catalog
(STAC)](https://github.com/radiantearth/stac-spec) browser for static catalogs.
It attempts to surface all included data in a user-centric way (an approach
which can inform how data is represented in the evolving spec). It is
implemented as a single page application (SPA) for ease of development and to
limit the overall number of catalog reads necessary when browsing (as catalogs
may be nested and do not necessarily contain references to their parents).

## Examples

* [planet.stac.cloud](https://planet.stac.cloud) ([catalog on GitHub](https://github.com/cholmes/pdd-stac/))
* [CBERS](https://cbers.stac.cloud) ([catalog tools on GitHub](https://github.com/fredliporace/cbers-2-stac))
* [Google Earth Engine](https://gee.stac.cloud)
* [sat-api.stac.cloud](https://sat-api.stac.cloud) ([sat-api on GitHub](https://github.com/sat-utils/sat-api))

## Running

By default, stac-browser will browse the [testbed Planet
catalog](https://storage.googleapis.com/pdd-stac/disasters/catalog.json)
([GitHub](https://github.com/cholmes/pdd-stac/)). To browse your own, set
`CATALOG_URL` when building.

```bash
npm install
CATALOG_URL=http://path/to/catalog.json npm start -- --open
```

STAC Browser defaults to using [HTML5 History
Mode](https://router.vuejs.org/guide/essentials/history-mode.html), which can
cause problems on certain web hosts. To use _hash mode_, set
`HISTORY_MODE=hash` when running or building. This will be compatible with
S3, stock Apache, etc.

## Building

```bash
CATALOG_URL=http://path/to/catalog.json npm run build
```

## Prerendering

STAC Browser includes the ability to prerender catalog pages to HTML using
[Puppeteer](https://github.com/GoogleChrome/puppeteer) to control a headless
Chromium instance. This facilitates search engine indexing, as metadata and
content will be present in the HTML prior to loading external catalogs.

To prerender, run:

```bash
bin/prerender.js -p <public URL> <catalog URL>
```

`dist/` will contain all assets necessary to host the browser.

After publishing (see below), the generated sitemap can be submitted for
crawling by Google:

```bash
curl http://www.google.com/ping?sitemap=https://planet.stac.cloud/sitemap.txt
```

## Publishing

After building or prerendering, `dist/` will contain all assets necessary to
host the browser. These can be manually copied to your web host of choice.

Alternately, you can publish to [Netlify](https://www.netlify.com/) for free.

First, create a new site:

```bash
node_modules/.bin/netlify init
```

The generated site id will be used as `NETLIFY_SITE_ID` in your environment.

To deploy without prerendering:

```bash
CATALOG_URL=... NETLIFY_SITE_ID=... npm run deploy
```

To deploy a prerendered version you'll also need the target URL:

```bash
CATALOG_URL=... NETLIFY_SITE_ID=... STAC_URL=... npm run deploy-prerendered
```

## Crawling

To facilitate prerendering, STAC Browser includes functionality for crawling
catalogs in `bin/crawl.js`.

As-is, this will just output the type and URL for all entries in the catalog.
In real-world use, you'll probably want to use it as an example and write
custom JavaScript to process each entry (similar to how `bin/prerender.js`
uses it).

## Contributing

STAC Browser uses [Vue](https://vuejs.org/).

Catalogs and collections are rendered using the
[`Catalog`](src/components/Catalog.vue) component in
[`src/components/`](src/components/). Items are rendered using the
[`Item`](src/components/Item.vue) component. Common functionality across both
components exists in [`src/components/common.js`](src/components/common.js).
Mappings between property keys (e.g. `eo:platform`) are defined in
[`src/lib/stac/dictionary.json`](src/lib/stac/dictionary.json).

## Alternate Implementations

If you're interested in experimenting with a STAC browser built with different
JS frameworks, check out:

* [GravityLabGeo/stacjs](https://github.com/GravityLabGeo/stacjs) - a
  jQuery-based viewer
* [alkamin/stac-gdalsj-browser](https://github.com/alkamin/stac-gdaljs-browser) -
  an Ember-based viewer
