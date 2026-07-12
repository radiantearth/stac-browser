# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- The Browse menu also loads additional Collections on demand

### Changed

- `getBrowserPath` for STAC Objects is not available any longer, use `toBrowserPath` or other URL comparison mechanisms instead.
  **Note:** This is commonly used in `preprocessSTAC` config option, ensure to update your `config.js`.
- Internal rewrite of how API children are maintained
- Loaded collections are cached and no longer re-fetched when returning to a page

### Fixed

- Redirect bare `pathPrefix` URLs to their trailing-slash form in the Docker/nginx image (e.g. `/browser` → `/browser/`)
- Fix global error handling in certain edge-cases
- Improve speed of catalog/collection duplicate detection
- Fix search link detection
- The configured default collection and item sort is also applied to the Browse menu
- More requests that fail due to missing authentication are retried after login (incl. searches and downloads)
- A failed background load no longer switches the page after login

## [5.0.0-rc.1] - 2026-06-27

### Added

- Adding `extent`s to the root catalog will restrict the Search filters
- Support free-text search for Collections in list of collections
- Add a link to Collection Search from the Collections overview page for advanced filters
- New locales:
  - Swedish
  - Russian
- New config options:
  - `catalogTitleAfterImage`: Set a different title in the header after a logo.
  - `defaultCollectionSort`: Default sort order for Collections (replaces `cardViewSort`). The new default is different from the old default behaviour.
  - `defaultItemSort`: Default sort order for Items (replaces `cardViewSort`). The new default is different from the old default behaviour.
  - `preferredAssets`: Configure which (alternate) asset is shown by default. Defaults to preferring HTTP(S) alternates; set to `false` to revert back to the previous behaviour.

### Changed

- Only show language chooser when more than one locale is available
- Restrict Collection item search date picker to collection's temporal extent
- Focus temporal extent filter for Collection item search on end of temporal extent
- Disable temporal extent filter when a single date/time is provided as temporal extent in the Collection metadata
- Better default STAC title detection within not fully loaded lists where only a URL is available
- No search / sort functionality available when a static catalog has only a subset of children loaded
- The default value for `catalogTitle` is `null` instead of `STAC Browser`.
- Improved how the title is handled

### Removed

- Removed `cardViewSort` config option in favor of `defaultCollectionSort` and `defaultItemSort`

### Fixed

- Link color on data source list selection improved
- Improve the background color for dark mode on the map text controls.
- Improve the map control background colors on dark mode.
- CQL2 text representation of array operators (`a_overlaps`, `a_contains`, `a_equals`, `a_contained_by`) now uses function-call syntax as defined by the CQL2 text grammar
- Fix loading the root route when a `catalogUrl` is set
- Fix that in some cases the `catalogUrl` is lost

## [5.0.0-beta.1] - 2026-05-12

**THIS IS A BREAKING RELEASE - MAKE SURE TO UPDATE ALL YOUR CONFIG FILES!**

### Added

- Allow manually entering bounding boxes for search
- Generate code examples for Global Item Search, Collection Search, and collection-scoped Item Search
- Inputs to enter bounding boxes for search manually
- Plugin system for widgets
- Support for Sortables
- Support `SB_CONFIG` for loading a custom config module
  - Expose `SB_CONFIG` as a Docker build argument
- Support Vite `loadEnv` for `.env` config overrides
- CQL2 / Queryables:
  - Allow negating CQL2 filters (globally and per filter)
  - Support CQL2 Advanced Comparison Operators
  - Support CQL2 Array Functions
- Ignored metadata fields can be configured in `fields.config.js`
- PlayWright tests
- Add config option `displayOverviewsForChildren` to toggle visualizing overviews for maps showing many STAC Items
- Color modes:
  - Support for dark mode (defaults to auto-detection based on system settings of the user)
  - Added `enforcedColorMode` config option to enforce a specific color mode (e.g. always show "light" mode)
  - Added a color mode switch in the header (next to the language chooser)
- Added more documentation around styling

### Changed

- Migrated from Vue.js 2 to 3 (incl. vue-router, vuex, vue-i18n, etc.)
- Migrated from vue-cli to Vite
- Migrated from BootstrapVue (Bootstrap 4) to BootstrapVueNext (Bootstrap 5)
  - Boostrap CSS variables might have been renamed, make sure to check your custom CSS
- Replaced the timepicker component, make sure to update the `datepicker.js` in any custom locales
- The config.js file needs to be updated, replace `module.exports =` with `export default`.
- The main HTML file (`public/index.html`) has moved to `index.html` and has various changes. Make sure to check any changes you made.
- The runtime config file (`public/config.js`) has been renamed to `public/runtime-config.js`
- Replaced `v-clipboard` with `@vueuse/core` clipboard support
- All link and asset actions must be updated, similarly also check all the config files for changes:
  - `i18n.t` must be replaced with `i18n.global.t`
  - You may also have to update imports of `Utils` or other constants.
    Most imports have moved to stac-js.
    For example, `Utils.isObject` is now `isObject` and can be imported from `stac-js/src/utils.js`.
- It is not needed any longer to update the path to the `runtime-config.js`, the `pathPrefix` is added automatically in the build process.
- User stay logged in across sessions (for OpenID Connect only)
- CSS declarations have been updated to reuse existing variables in favor of hardcoding certain colors etc.
- `configureBasemap` accepts an additional parameter, the VueX Store (e.g. for different basemaps depending on the color mode).

### Removed

- CLI parameters for npm commands (e.g. `npm run build -- --catalogUrl="https://example.com"`) as they are not supported by Vite. Make sure to check your CI scripts and Docker files.
- Support for customizing `authConfig` through the root catalog has been removed. Use the STAC Authentication extension instead.
- Removed the `DYNAMIC_CONFIG` Docker build argument and `<!--RC RC-->` comment-based mechanism to use runtime config options. Use `SB_RUNTIME` instead.

### Fixed

- Handle state of downloads better and confirm leaving the page when downloading
- Better error on request to the `/collections` or `.../items` endpoints
- Collection list on Global Item Search was empty in certain situations
- Show an error message when no operator is supported for a queryable
- Don't show an "unsupported" error when only Collection Search is supported by the API
- Remove download button for ZARR assets
- Fixed authentication for assets when authentication methods is not configured in STAC Browser

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

[Unreleased]: https://github.com/radiantearth/stac-browser/compare/v5.0.0-rc.1...HEAD
[5.0.0-rc.1]: https://github.com/radiantearth/stac-browser/compare/v5.0.0-beta.1...v5.0.0-rc.1
[5.0.0-beta.1]: https://github.com/radiantearth/stac-browser/compare/v4.0.1...v5.0.0-beta.1
[4.0.1]: https://github.com/radiantearth/stac-browser/compare/v4.0.0...v4.0.1
[4.0.0]: https://github.com/radiantearth/stac-browser/compare/v3.3.5...v4.0.0
[3.3.5]: https://github.com/radiantearth/stac-browser/releases/tag/v3.3.5
