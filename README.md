# STAC Browser

This is a full-fledged [Spatio-Temporal Asset Catalog (STAC)](https://github.com/radiantearth/stac-spec) browser for STAC APIs and static STAC catalogs.

Version: **5.0.0-dev** (supports all STAC versions between 0.6.0 and 1.1.0)

This package has also been published to npm as [`@radiantearth/stac-browser`](https://www.npmjs.com/package/@radiantearth/stac-browser).

It's not officially supported, but you may also be able to use it for
certain _OGC API - Records_ and _OGC API - Features_ compliant servers.

**Please note that STAC Browser is currently with limited funding for both maintenance, bug fixes and improvements. This means issues and PRs may be addressed very slowly.
If you care about STAC Browser and have some funds to support the future of STAC Browser, please contact <mail@moregeo.it>.**

**Table of Contents:**

- [STAC Browser](#stac-browser)
  - [Examples](#examples)
  - [Get Started](#get-started)
    - [Private query parameters](#private-query-parameters)
    - [Versions](#versions)
    - [Migrate from old versions](#migrate-from-old-versions)
  - [Customize](#customize)
    - [Options](#options)
    - [Languages](#languages)
    - [Themes](#themes)
    - [Basemaps](#basemaps)
    - [Actions](#actions)
    - [Code Generators](#code-generators)
    - [Additional metadata fields](#additional-metadata-fields)
      - [Example](#example)
    - [Custom extensions](#custom-extensions)
  - [Docker](#docker)
  - [Contributing](#contributing)
  - [Sponsors](#sponsors)

## Examples

A demo instance is running at <https://radiantearth.github.io/stac-browser/>.

The catalog section of [STAC Index](https://stacindex.org) is also built on top of STAC Browser (currently v2).

## Get Started

First, you need to clone or download this repository.

Then switch into the newly created folder and install all dependencies:

```bash
npm install
```

By default, STAC Browser will let you browse all catalogs on STAC Index.

To browse only your own static STAC catalog or STAC API, set the [`catalogUrl`](docs/options.md#catalogurl) config parameter when running the dev server.
In this example we point to EarthSearch (`https://earth-search.aws.element84.com/v1/`):

```bash
# Linux / MacOS
SB_catalogUrl="https://earth-search.aws.element84.com/v1/" npm start
# Windows (PowerShell)
$env:SB_catalogUrl="https://earth-search.aws.element84.com/v1/"; npm start
```

This will start the development server on <http://localhost:8080>, which you can then open in your preferred browser.

To open a local file on your system, see the chapter [Using Local Files](docs/local_files.md).

If you'd like to publish the STAC Browser instance use the following command:

```bash
# Linux / MacOS
SB_catalogUrl="https://earth-search.aws.element84.com/v1/" npm run build
# Windows (PowerShell)
$env:SB_catalogUrl="https://earth-search.aws.element84.com/v1/"; npm run build
```

This will only work on the root path of your domain though. If you'd like to publish in a sub-folder,
you can use the [`pathPrefix`](docs/options.md#pathprefix) option.

After building, `dist/` will contain all assets necessary
host the browser. These can be manually copied to your web host of choice.
**Important:** If `historyMode` is set to `history` (which is the default value), you'll need to add
an additional configuration file for URL rewriting.
Please see the [`historyMode`](docs/options.md#historymode) option for details.

You can customize STAC Browser, too. See the options and theming details below.
If not stated otherwise, all options can be specified in the [config file](config.js), in an external config file via `SB_CONFIG`, via `SB_*` environment variables, or in the runtime config file..
Vite also loads `.env`, `.env.local`, `.env.[mode]` and `.env.[mode].local`, so you can keep local overrides in e.g. `.env.local`.
For example, `SB_CONFIG=./config.local.mjs npm start` loads `config.local.mjs` (\*nix-based systems) on top of `config.js`.
You can also provide configuration options "at runtime" (after the build).

### Private query parameters

**_experimental_**

STAC Browser supports "private query parameters", e.g. for passing an API key through. Any query parameter that is starting with a `~` will be stored internally, removed from the URL and be appended to STAC requests. This is useful for token-based authentication via query parameters.

So for example if your API requires to pass a token via the `API_KEY` query parameter, you can request STAC Browser as such:
`https://examples.com/stac-browser/?~API_KEY=123` which will change the URL to `https://examples.com/stac-browser/` and store the token `123` internally. The request then will have the query parameter attached and the Browser will request e.g. `https://examples.com/stac-api/?API_KEY=123`.

Please note: If the server hosting STAC Browser should not get aware of private query parameters and you are having `historyMode` set to `"history"`, you can also append the private query parameters to the hash so that it doesn't get transmitted to the server hosting STAC Browser.
In this case use for example `https://examples.com/stac-browser/#?~API_KEY=123` instead of `https://examples.com/stac-browser/?~API_KEY=123`.

### Versions

STAC Browser has gone recently through a number of major versions.
The following table shows the major differences between versions and the upcoming plans:

| Version   | Summary |
| --------- | ------- |
| 3.3.x     | The last version that uses Leaflet as mapping library. |
| 4.0.x     | Uses OpenLayers as mapping library. The last version based on VueJS 2, vue-cli and Bootstrap 4. |
| **5.x.x** | The upcoming version based on VueJS 3, Vite and Bootstrap 5. Target: Q1 2026 |
| 6.x.x     | Planned version with a new layout, a pluggable interface, and better integration into existing sites. Target: Q4 2026 |

For more details on our plans, please check our
[milestones](https://github.com/radiantearth/stac-browser/milestones).

### Migrate from old versions

Please read the [release notes](https://github.com/radiantearth/stac-browser/releases).
They contain notes on required changes for a smooth migration.

## Customize

### Options

STAC Browser supports customization through a long list of options that can be set in various ways.

Please read the **[documentation for the options](docs/options.md)**.

### Languages

STAC Browser can be translated into other languages and can localize number formats, date formats etc.
Currently, we support more than 10 different languages plus a variety of local dialects and other localizations.

Please read the **[localization documentation](docs/localization.md)** for more details.

### Themes

You can customize STAC Browser in the `src/theme` folder. It contains Sass files (a CSS preprocessor), which you can change to suit your needs.

The easiest solution is to start with the `variables.scss` file and customize the options given there.
For simplicity we just provide some common options as default, but you can also add and customize any Bootstrap variable,
see <https://getbootstrap.com/docs/4.0/getting-started/theming/> for details.

The file `page.scss` contains some Sass declarations for the main sections of STAC Browser and you can adopt those to suit your needs.

If you need even more flexibility, you need to dig into the Vue files and their dependencies though.

### Basemaps

STAC Browser supports various types of basemaps and projections.

More information about how to configure and customize the basemaps can be found in the **[Basemap documentation](docs/basemaps.md)**.

### Actions

STAC Browser has a pluggable interface to share or open assets and links with other services, which we call "actions".

More information about how to add or implement actions can be found in the **[Actions documentation](docs/actions.md)**.
### Code Generators

The list of supported code snippet languages is configured in [`codeGenerators.config.js`](codeGenerators.config.js).

Code generator templates are selected in generator classes based on endpoint and method (for example `query` for `GET`, `post-cql` for request-body paths), so generated snippets stay minimal and concrete for the currently selected search flow.

For step-by-step instructions on adding or removing a language, see the **[Code Generators documentation](docs/code-generators.md)**.

### Additional metadata fields

The metadata that STAC Browser renders is rendered primarily through the library [`stac-fields`](https://www.npmjs.com/package/@radiantearth/stac-fields).
It contains a lot of rules for rendering [many existing STAC extensions](https://github.com/stac-utils/stac-fields/blob/main/fields.json) nicely.
Nevertheless, if you use custom extensions to the STAC specification you may want to register your own rendering rules for the new fields.
This can be accomplished by customizing the file [`fields.config.js`](./fields.config.js).
It uses the [Registry](https://github.com/stac-utils/stac-fields/blob/main/README.md#registry) defined in stac-fields to add more extensions and fields to stac-fields and STAC Browser.

To add your own fields, please consult the documentation for the [Registry](https://github.com/stac-utils/stac-fields/blob/main/README.md#registry).

#### Example

If you have a custom extension with the title "Radiant Earth" that uses the prefix `radiant:` you can add the extension as such:

```js
Registry.addExtension("radiant", "Radiant Earth");
```

If this extension has a boolean field `radiant:public_access` that describes whether an entity can be accessed publicly or not, this could be described as follows:

```js
Registry.addMetadataField("radiant:public_access", {
  label: "Data Access",
  formatter: (value) => (value ? "Public" : "Private"),
});
```

### Widgets

STAC Browser has a pluggable interface and allows to add additional content to the pages, which we call "widgets".

More information about how to add or implement widgets can be found in the **[Widgets documentation](docs/widgets.md)**.

### Metadata fields

STAC Browsers offers several ways to customize and extend its metadata rendering.

More information can be found in the **[Metadata documentation](docs/metadata.md)**.

### Customization through root catalog

You can also provide a couple of the config options through the root catalog.
You need to provide a field `stac_browser` and then you can set any of the following options:

- `apiCatalogPriority`
- `authConfig` (except for the `formatter` as function)
- `cardViewMode`
- `cardViewSort`
- `crossOriginMedia`
- `defaultThumbnailSize`
- `displayGeoTiffByDefault`
- `showThumbnailsAsAssets`

### Custom extensions

STAC Browser supports some non-standardized extensions to the STAC specification that you can use to improve the user-experience.

1. [Provider Object](https://github.com/radiantearth/stac-spec/blob/master/collection-spec/collection-spec.md#provider-object):
   Add an `email` (or `mail`) field with an e-mail address and the mail will be shown in the Browser.
2. [Alternative Assets Object](https://github.com/stac-extensions/alternate-assets?tab=readme-ov-file#alternate-asset-object):
   Add a `name` field and it will be used as title in the tab header, the same applies for the core Asset Object.
3. A link with relation type `icon` and a Browser-supported media type in any STAC entity will show an icon in the header and the lists of Catalogs, Collections and Items.

## Docker

You can use the Docker to work with STAC Browser. Please read [Docker documentation](docs/docker.md) for more details.

## Testing
To run the testing suite locally:

```bash
npm test
```

For more information on testing, see [CONTRIBUTING.md](CONTRIBUTING.md#tests)

## Contributing

Please see [CONTRIBUTING.md](CONTRIBUTING.md) for details on how to contribute to STAC Browser.

## Sponsors

The following sponsors have provided a substantial amount of funding for STAC Browser in the past:

- [swisstopo](https://www.swisstopo.admin.ch/) (maintenance, base funding for version 3, 4, 5 and 6)
- [Radiant Earth](https://radiant.earth) (base funding for versions 1, 2 and 3)
- [National Resources Canada](https://natural-resources.canada.ca/home) (multi-language support, maintenance)
- [moreGeo GmbH](https://moregeo.it) (maintenance)
- [Spacebel](https://spacebel.com) (collection search, mapping)
- [Planet](https://planet.com) (authentication, maintenance)
- [CloudFerro](https://cloudferro.com) (authentication, alternate asset and storage extension)
- [Geobeyond](http://www.geobeyond.it/) (mapping)
