## Running

```bash
npm install
npx parcel --open
```

## Building

```bash
npx parcel build
```

## Contributing

tk - something about how the catalog / sub-catalog / item templates are laid out

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
