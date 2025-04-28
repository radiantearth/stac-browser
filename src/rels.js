// STAC relation types

// STAC hierarchical
export const stacHierarchy = [
  'child',
  'collection',
  'item',
  'parent',
  'root',
  'self',
];

// STAC API Pagination
export const stacPagination = [
  'first',
  'last',
  'next',
  'prev',
  'previous',
];

// Queryables
export const ogcQueryables = [
  'queryables', // Old way in STAC (deprecated)
  'http://www.opengis.net/def/rel/ogc/1.0/queryables', // STAC and OGC APIs
  'ogc-rel:queryables' // Alternative in OGC APIs
];

// Rels that STAC Browser can navigate to and display natively (i.e. Collections, Catalogs and Items)
export const stacBrowserNavigatesTo = [
  'canonical', // Links to other catalogs or items v
  'related',
  'derived_from',
  'latest-version', // version extension v
  'predecessor-version',
  'successor-version',
  'source', // label extension,
  'alternate' // language extension
].concat(stacHierarchy).concat(stacPagination);

// Rels that are handled in a special way and should not be shown in the link list
export const stacBrowserSpecialHandling = [
  'conformance', // API related v
  'data',
  'items',
  'search',
  'icon', // Other v
  'license',
].concat(stacHierarchy).concat(stacPagination).concat(ogcQueryables);

// OGC APIs
export const ogcRelPrefix = 'http://www.opengis.net/def/rel/ogc/1.0/';
