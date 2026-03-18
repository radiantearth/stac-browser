import { ignoreMetadata } from '../fields.config.js';

const ignoredFields = {
  CatalogLike: [
    // Catalog and Collection fields that are handled directly
    'stac_version',
    'stac_extensions',
    'id',
    'type',
    'title',
    'description',
    'keywords',
    'providers',
    'license',
    'extent',
    'summaries',
    'links',
    'assets',
    'item_assets',
    // Don't show these complex lists of coordinates:
    // https://github.com/radiantearth/stac-browser/issues/141
    'proj:bbox',
    'proj:geometry',
    // API landing page, not very useful to display,
    // but https://github.com/radiantearth/stac-browser/issues/136
    'conformsTo',
    // Will be rendered with a custom renderer
    'deprecated',
    // Special handling for the warning of the anonymized-location extension
    'anon:warning',
    // Special handling for the stats extension
    'stats:catalogs',
    'stats:collections',
    'stats:items',
    // Special handling for auth
    'auth:schemes',
    // Special handling for the STAC Browser config
    'stac_browser'
  ],
  Item: [
    'description',
    'keywords',
    'providers',
    'title',
    // Will be rendered with a custom renderer
    'deprecated',
    // Don't show these complex lists of coordinates: https://github.com/radiantearth/stac-browser/issues/141
    'proj:bbox',
    'proj:geometry',
    // Special handling for auth
    'auth:schemes',
    // Special handling for the warning of the anonymized-location extension
    'anon:warning'
  ],
  Asset: [
    // Core Asset fields that are handled directly
    'href',
    'title',
    'description',
    'type',
    'roles',
    // Don't show these complex lists of coordinates:
    // https://github.com/radiantearth/stac-browser/issues/141
    'proj:bbox',
    'proj:geometry',
    // Don't show very specific options that can't be rendered nicely
    'table:storage_options',
    'xarray:open_kwargs',
    'xarray:storage_options',
    // Special handling for auth and storage
    'auth:refs',
    'storage:refs',
    // Alternative Assets are displayed separately
    'alternate',
    'alternate:name',
  ],
  Link: [
    // Core Link fields that are handled directly
    'href',
    'type',
    'rel',
    'title',
    'description',
  ],
  Provider: [
    // Core Provider fields that are handled directly
    'url',
    'name',
    'description',
    'roles',
  ]
};

export function getIgnoredFields(object, type = null) {
  if (type === null && typeof object.getObjectType === 'function') {
    type = object.getObjectType();
  }
  if (!type || !ignoredFields[type]) {
    return [];
  }
  const ignored = ignoredFields[type];
  if (typeof ignoreMetadata !== 'function') {
    return ignored;
  }
  const result = ignoreMetadata(object, ignored.slice(0), type);
  return Array.isArray(result) ? result : ignored;
}
