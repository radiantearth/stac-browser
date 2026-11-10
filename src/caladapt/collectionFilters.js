// Home page filters on collection fields, shown as rows of pill buttons below Topic
// (src/components/Catalogs.vue). Labels are in src/locales/en/custom.json under
// catalogFilters.<key>; values are listed in the order the pills appear.
export const COLLECTION_FILTERS = [
  { key: 'dataType', field: 'caladapt:spatial_type', values: ['grid', 'point', 'spatial-aggregate'] },
  { key: 'source', field: 'caladapt:source', values: ['wrf', 'loca2', 'observations', 'other'] }
];
