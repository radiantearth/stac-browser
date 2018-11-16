# STAC Browser

This is a [Spatio-Temporal Asset Catalog
(STAC)](https://github.com/radiantearth/stac-spec) browser for static catalogs.
It attempts to surface all included data in a user-centric way (an approach
which can inform how data is represented in the evolving spec). It is
implemented as a single page application (SPA) for ease of development and to
limit the overall number of catalog reads necessary when browsing (as catalogs
may be nested and do not necessarily contain references to their parents).

## Running

By default, stac-browser will browse the ISERV catalog. To browse your own, set
`CATALOG_URL` when building.

```bash
npm install
CATALOG_URL=http://path/to/catalog.json npm start -- --open
```

STAC Browser defaults to using [HTML5 History
Mode](https://router.vuejs.org/guide/essentials/history-mode.html), which can
cause problems on certain web hosts. To use _hash mode_, set
`HISTORY_MODE=hash` when running or building. This will be compatible with
S3, etc.

## Building

```bash
CATALOG_URL=http://path/to/catalog.json npm run build
```

## Contributing

tk - something about how the catalog (`src/components/Catalog.vue`) /
sub-catalog (`src/components/Catalog.vue`) / item (`src/components/Item.vue`)
templates are laid out

## Why Vue?

This is my (Seth's) first Vue app. I've previously built a number of React SPAs
and have helped maintain + create apps with Backbone, D3, jQuery, and others,
though I'm mostly a server-side guy.

Of these, React (with Webpack) has provided me with the best development
experience, especially for apps with relatively complex functionality.

However, when approaching the problem of building a STAC browser intended for
others to (easily) contribute to and run against their own catalogs (both
dynamically and when generating a static site), I wanted something with relative
self-contained HTML and CSS (so that those unfamiliar with Vue wouldn't need to
face JavaScript when making minor changes). Vue's [single file
components](https://vuejs.org/v2/guide/single-file-components.html) fit the
bill.

For pre-rendering catalogs,
[chrisvfritz/prerender-spa-plugin](https://github.com/chrisvfritz/prerender-spa-plugin)
looks like a promising way to use headless Chrome (puppeteer) to generate HTML
for ease of search engine indexing.

If you're interested in experimenting with a STAC browser built with different
JS frameworks, check out:

* [GravityLabGeo/stacjs](https://github.com/GravityLabGeo/stacjs) - a
  jQuery-based viewer
* [alkamin/stac-gdalsj-browser](https://github.com/alkamin/stac-gdaljs-browser) -
  an Ember-based viewer
