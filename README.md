# STAC Browser

This is a [Spatio-Temporal Asset Catalog (STAC)](https://github.com/radiantearth/stac-spec) browser for static catalogs.
Minimal support for APIs is implemented, but it not the focus of the Browser and may lead to issues.
It attempts to surface all included data in a user-centric way (an approach
which can inform how data is represented in the evolving spec). It is
implemented as a single page application (SPA) for ease of development and to
limit the overall number of catalog reads necessary when browsing (as catalogs
may be nested and do not necessarily contain references to their parents).

Version: **3.1.0** (supports all STAC versions between 0.6.0 and 1.0.0)

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
  - [Actions](#actions)
  - [Additional metadata fields](#additional-metadata-fields)
  - [Customize through root catalog](#customize-through-root-catalog)
  - [Custom extensions](#custom-extensions)
- [Docker](#docker)
- [Contributing](#contributing)
  - [Adding a new language](#adding-a-new-language)
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

To browse only your own static STAC catalog or STAC API, set the `catalogUrl` CLI parameter when running the dev server.
In this example we point to EarthSearch (`https://earth-search.aws.element84.com/v1/`):

```bash
npm start -- --open --catalogUrl="https://earth-search.aws.element84.com/v1/"
```
To open a local file on your system, see the chapter [Using Local Files](docs/local_files.md).

If you'd like to publish the STAC Browser instance use the following command:

```bash
npm run build -- --catalogUrl="https://earth-search.aws.element84.com/v1/"
```

This will only work on the root path of your domain though. If you'd like to publish in a sub-folder, 
you can use the [`pathPrefix`](docs/options.md#pathprefix) option.

After building, `dist/` will contain all assets necessary
host the browser. These can be manually copied to your web host of choice.
**Important:** If `historyMode` is set to `history` (which is the default value), you'll need to add
an additional configuration file for URL rewriting.
Please see the [`historyMode`](docs/options.md#historymode) option for details.

You can customize STAC Browser, too. See the options and theming details below.
If not stated otherwise, all options can either be specified via CLI, ENV variables or in the [config file](config.js).
You can also provide configuration options "at runtime" (after the build).

### Private query parameters

***experimental***

STAC Browser supports "private query parameters", e.g. for passing an API key through. Any query parameter that is starting with a `~` will be stored internally, removed from the URL and be appended to STAC requests. This is useful for token-based authentication via query parameters.

So for example if your API requires to pass a token via the `API_KEY` query parameter, you can request STAC Browser as such:
`https://examples.com/stac-browser/?~API_KEY=123` which will change the URL to `https://examples.com/stac-browser/` and store the token `123` internally. The request then will have the query parameter attached and the Browser will request e.g. `https://examples.com/stac-api/?API_KEY=123`.

Please note: If the server hosting STAC Browser should not get aware of private query parameters and you are having `historyMode` set to `"history"`, you can also append the private query parameters to the hash so that it doesn't get transmitted to the server hosting STAC Browser. 
In this case use for example `https://examples.com/stac-browser/#?~API_KEY=123` instead of `https://examples.com/stac-browser/?~API_KEY=123`.

### Migrate from old versions

Please read the [migration documentation](docs/migrate.md) for details.

## Customize

### Options

STAC Browser supports customization through a long list of options that can be set in various ways.

Please read the **[documentation for the options](docs/options.md)**.

### Languages

STAC Browser can be translated into other languages and can localize number formats, date formats etc.

You need to change the [`locale`](docs/options.md#locale) and [`supportedLocales`](docs/options.md#supportedlocales) settings to select the default language and the languages available to users.

The following languages are currently supported:
- de: German (Germany, Switzerland)
- es: Spanish
- en: English
- fr: French (Canada, France, Switzerland)
- it: Italian (Italy, Switzerland)
- ro: Romanian

We manage the translations in Crowdin, please see <https://crowdin.com/project/stac-browser/> for details.

To add your own language, please follow the guide below: [Adding a new langauge](#adding-a-new-language)

#### Custom phrases
You can define custom phrases in the `custom.json`.
This is especially useful for phrases that are coming from non-standadized metadata fields (see the chapter "[Additional metadata fields](#additional-metadata-fields)").
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

### Actions

STAC Browser has a pluggable interface to share or open assets and links with other services, which we call "actions".

More information about how to add or implement actions can be found in the **[documentation](docs/actions.md)**.

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
Registry.addExtension('radiant', 'Radiant Earth');
```

If this extension has a boolean field `radiant:public_access` that describes whether an entity can be accessed publicly or not, this could be described as follows:

```js
Registry.addMetadataField('radiant:public_access', {
  label: "Data Access",
  formatter: value => value ? "Public" : "Private"
});
```

This displays the field (with a value of `true`) in STAC Browser as follows: `Data Access: Public`.

The first parameter is the field name, the second parameter describes the field using a ["field specification"](https://github.com/stac-utils/stac-fields/blob/main/README.md#fieldsjson).
Please check the field specification for available options.

#### Translation

STAC Browser supports [multiple languages](#languages).
If you use more than one language, you likely want to also translate the phrases that you've added above (in the example `Data Access`, `Public` and `Private`, assuming that `Radiant Earth` is a name and doesn't need to be translated).
All new phrases should be added to the [active languages](docs/options.md#supportedlocales).
To add the phrases mentioned above you need to go through the folders in `src/locales` and in the folders of the active languages update the file `custom.json` as described in the section that describes [adding custom phrases](#custom-phrases).
All new phrases must be added to the property `fields`.

Below you can find an example of an updated `custom.json` for the German language (folder `de`). It also includes the `authConfig`, which is contained in the file by default for [other purposes](docs/options.md#authconfig).
```
{
  "authConfig": {
    "description": ""
  },
  "fields": {
    "Data Access": "Zugriff auf die Daten",
    "Public": "Öffentlich",
    "Private": "Privat"
  }
}
```

### Customize through root catalog

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
- `stacLint` (can only be disabled)

### Custom extensions

STAC Browser supports some non-standardized extensions to the STAC specification that you can use to improve the user-experience.

1. To the [Provider Object](https://github.com/radiantearth/stac-spec/blob/master/collection-spec/collection-spec.md#provider-object) you can add an `email` (or `mail`) field with an e-mail address and the mail will be shown in the Browser, too.
2. A link with relation type `icon` and a Browser-supported media type in any STAC entity will show an icon in the header and the lists.

## Docker

When building the Dockerfile, you can add the [`catalogUrl`](docs/options.md#catalogurl) 
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

You can run the following commands (see also "[Get started](#get-started)" above):
- `npm run install`: Install the dependencies, this is required once at the beginning.
- `npm start`: Start the development server
- `npm run lint`: Lint the source code files
- `npm run build`: Compile the source code into deployable files for the web. The resulting files can be found in the folder `dist` and you can then deploy STAC Browser on a web host. There are two other variants:
  - `npm run build:report`: Same as above, but also generates a bundle size report (see `dist/report.html`), which should not be deployed.
  - `npm run build:minimal`: Same as above, but tries to generate a minimal version without bundle size report and without source maps.
- `npm run i18n:fields`: Generates an updated version of the locales from the stac-fields package.

The [release process is documented separately](docs/release.md).

### Adding a new language

You can translate STAC Browser into other languages.
You can also use one of the existing languages and provide an alternate version for a specifc country, e.g. a Australian English (en-AU) version of the US-English language pack (en).

**Please follow this guide:**
- Copy the `en` folder (or any other language without a country code that you want to base the translation on).
  - Note: If you start with the `en` folder, you have to remove the leading `//` from the line `// { fields: require('./fields.json') }` in the file `default.js`.
- Name the new folder according to [RFC5646](https://www.rfc-editor.org/rfc/rfc5646).
- Add the language to the list of supported locales ([`supportedLocales`](docs/options.md#supportedlocales)) in the `config.js` file.
- Add the language to the [list of languages in this README file](#languages).
- Add yourself to the list of code owners (`.github/CODEOWNERS`) for this language (we'll invite you to this repository after you've opened a PR). **Persons contributing languages are expected to maintain them long-term! If you are not able to maintain the language pack, please indicate so in the PR and we'll release it separately.**
- Translate the `.json` files, most importantly `config.json`, `fields.json` and `texts.json`.
  - Please note that you never need to translate any object keys!
  - If you base your language on another existing language (e.g. create `en-IN` based on `en`) you can delete individual files and import existing files from other languages in `default.js`.
- Adapt the `datepicker.js` and `duration.js` files to import the existing definitions from their corresponding external packages, but you could also define the specifics yourself.
- Check that your translation works by running the development server (`npm start`) and navigating to the STAC Browser instance in your browser (usually `http://localhost:8080`).
- Once completed, please open a pull request and we'll get back to you as soon as possible.
- After merging the PR for the first time, we'll add you to our translation management tool Crowdin: <https://crowdin.com/project/stac-browser/>. Please get in touch to get your invite!

# Sponsors

The following sponsors have provided a subststantial amount of funding for STAC Browser in the past:

- [Radiant Earth](https://radiant.earth) (base funding for versions 1, 2 and 3)
- [National Resources Canada](https://natural-resources.canada.ca/home) (multi-language support, maintenance)
- [Matthias Mohr - Softwareentwicklung](https://mohr.ws) (maintenance)
- [Spacebel](https://spacebel.com) (collection search)
- [Planet](https://planet.com) (OpenID Connect authentication, other features, maintenance)

**Please note that STAC Browser is currently mostly without funding for both maintenance, bug fixes and improvements.
If you care about STAC Browser and have some funds to support the future of STAC Browser, please contact me: matthias@mohr.ws**
