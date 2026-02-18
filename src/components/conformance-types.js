/**
 * Conformance class patterns for different STAC API endpoint types.
 * Extracted to its own file to avoid circular dependencies between
 * ApiCapabilitiesMixin.js and the catalog store.
 */
export const TYPES = {
  // OGC / STAC API - Features
  Items: {
    BasicFilters: [
      'https://api.stacspec.org/v1.*/ogcapi-features',
      'http://www.opengis.net/spec/ogcapi-features-1/1.*/conf/core'
    ],
    CollectionIdFilter: false,
    ItemIdFilter: false,
    // It seems some conformance classes use conf (correct) and some req (deprecated?) after the version number
    CqlFilters: ['http://www.opengis.net/spec/ogcapi-features-3/1.*/*/features-filter'],
    Sort: [
      'https://api.stacspec.org/v1.*/ogcapi-features#sort',
      'http://www.opengis.net/spec/ogcapi-records-1/1.*/conf/sorting'
    ],
    FreeText: ['https://api.stacspec.org/v1.*/ogcapi-features#free-text']
  },
  // STAC API - Item Search
  Global:  {
    BasicFilters: ['https://api.stacspec.org/v1.*/item-search'],
    CollectionIdFilter: true,
    ItemIdFilter: true,
    CqlFilters: ['https://api.stacspec.org/v1.*/item-search#filter'],
    Sort: ['https://api.stacspec.org/v1.*/item-search#sort'],
    FreeText: ['https://api.stacspec.org/v1.*/item-search#free-text']
  },
  // OGC / STAC API - Collections
  Collections: {
    BasicFilters: ['https://api.stacspec.org/v1.*/collection-search'],
    CollectionIdFilter: false,
    ItemIdFilter: false,
    CqlFilters: ['https://api.stacspec.org/v1.*/collection-search#filter'],
    Sort: ['https://api.stacspec.org/v1.*/collection-search#sort'],
    FreeText: ['https://api.stacspec.org/v1.*/collection-search#free-text']
  }
};
