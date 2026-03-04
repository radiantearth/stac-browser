# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- PlayWright tests
- Allow manually entering bounding boxes for search
- Generate code examples for Global Item Search
- Support negating CQL2 filters (globally and per filter)
- Support CQL2 Advanced Comparison Operators
- Support CQL2 Array Functions

### Changed

- Migrated from Vue.js 2 to 3 (incl. vue-router, vuex, vue-i18n, etc.)
- Migrated from vue-cli to Vite
- Migrated from BootstrapVue (Bootstrap 4) to BootstrapVueNext (Bootstrap 5)
  - Boostrap CSS variables might have been renamed, make sure to check your custom CSS
- Replaced the timepicker component, make sure to update the `datepicker.js` in any custom locales
- The config.js file needs to be updated, replace `module.exports =` with `export default`.
- The main HTML file (`public/index.html`) has moved to `index.html` and has various changes. Make sure to check any changes you made.
- The runtime config file (`public/config.js`) has been renamed to `public/runtime-config.js`
- All link and asset actions must be updated, similarly also check all the config files for changes:
  - `i18n.t` must be replaced with `i18n.global.t`
  - You may also have to update imports of `Utils` or other constants.
    Most imports have moved to stac-js.
    For example, `Utils.isObject` is now `isObject` and can be imported from `stac-js/src/utils.js`.

### Deprecated


### Removed

- CLI parameters for npm commands (e.g. `npm run build -- --catalogUrl="https://example.com"`) as they are not supported by Vite
  - Make sure to check your CI scripts and Docker files

### Fixed

- Handle state of downloads better and confirm leaving the page when downloading
- Better error on request to the /collections or .../items endpoints
- Collection list on Global Item Search was empty in certain situations
- Show an error message when no operator is supported for a queryable
- Don't show an "unsupported" error when only Collection Search is supported by the API

## [4.0.1] - 2026-02-11

- Added a config option `footerLinks` to add links to the footer (e.g. imprint, privacy policy, etc.)
- Alphabetical sorting of badges
- Update F3D preview URL in F3D action plugin
- Prevent item and catalog cards from stretching to the entire grid width
- Prevent keywords from overlapping with temporal extent in item and catalog cards
- Improved list layout for catalogs/collections
- Fix map layer title detection for STAC Links
- Fix resolving auth and storage schemes
- Small UI improvements (e.g. icons, spacing)
- Updated dependencies and translations

## [4.0.0] - 2025-12-15

**THIS IS A BREAKING RELEASE - MAKE SURE TO UPDATE ALL YOUR CONFIG FILES!**

- Migrated from Leaflet (and stac-layer) to OpenLayers (and ol-stac)
  - New layer switcher
  - Support for multiple projections
  - Support for more advanced basemaps (e.g. Vector Tiles) - make sure to update your `basemap.config.js`, see new documentation for details
  - Support for more web-map-link types (WMS, WMTS KVP & REST, XYZ, PMTiles)
  - Read additional metadata for better default COG rendering
  - New or updated config options: `displayPreview`, `displayOverview`, `buildTileUrlTemplate`, `getMapSourceOptions`, `crs`
  - Removed config options: `geoTiffResolution`, `maxPreviewsOnMap`
  - and much more...
- Integration of stac-js into the codecase
  - Allows for more flexibility in Link and Asset actions
- Improved layout / design:
  - New header design with custom logo option (please provide feedback, we plan an even better version for v5.0)
  - New grid system for the item and catalog cards
- Locales:
  - Added Polish
  - Updated locales for several languages
- Collection Search shows a map of the results
- Support showing GeoJSON assets on the map (with a detail view)
- Improved sorting behavious in search requests with some small UI tweaks
- Show license for catalogs, if provided
- Sort the languages in the chooser using the native names
- Improved request error handling, e.g. show server error messages from response
- **BREAKING:** Configuration (in `config.js`) - see the documentation for details:
  - Removed deprecated options and related functionality for `redirectLegacyUrls` and `stacProxyUrl`
  - Renamed `maxItemsPerPage` to `maxEntriesPerPage`
  - Split config option `itemsPerPage` into `searchResultsPerPage`, `itemsPerPage`, `collectionsPerPage`
  - `allowedDomains` accepts more patterns
  - Config option `preprocessSTAC` now receives a stac-js object as parameter
  - New config option `catalogImage` to provide an logo for the header
- **Deprecation:** CLI parameters for npm commands (e.g. `npm run build -- --catalogUrl="https://example.com"`) are deprecated and will be removed in v5 as they are not supported by Vite
- Bug fixes, for example:
  - Search results display order did not match API response order #621
  - Fix number formatting in international English #639
  - Fix compatibility for OGC APIs #646
  - Make popovers work on MacOS (Safari) #655
  - Show links to prev/next/latest versions if deprecated is not set
  - CSS improvements for catalog/collection list layout
  - Handle thumbnails von S3 storage better
  - Fixed geojson.io action
  - Fixed the ability to define custom logos in the header
  - Avoid language reset after data source selection
  - Fixed item asset rendering
  - Fixed downloading of assets with relative URLs
  - `file:local_path` is correctly applied in alternative download mode
  - Fix confusing number representation in bullet point listings
  - Removed command `i18n:report`, which was not working anymore
  - Fix the default basemap config
  - Show only storage schemes that actually apply

## [3.3.5] - 2025-07-05

For releases prior to v4.0.0, please refer to the
[release notes in the GitHub Releases](https://github.com/radiantearth/stac-browser/releases).

[unreleased]: https://github.com/radiantearth/stac-browser/compare/v4.0.1...HEAD
[4.0.1]: https://github.com/radiantearth/stac-browser/compare/v4.0.0...v4.0.1
[4.0.0]: https://github.com/radiantearth/stac-browser/compare/v3.3.5...v4.0.0
[3.3.5]: https://github.com/radiantearth/stac-browser/releases/tag/v3.3.5
