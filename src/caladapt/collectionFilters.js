// Home page filters, shown as rows of pill buttons by PillFilters.vue: Topic (the
// collection keywords), then one row per collection field below. Labels are in
// src/locales/en/custom.json under catalogFilters.<key>; values are listed in
// the order the pills appear.
export const COLLECTION_FILTERS = [
  { key: 'dataType', field: 'caladapt:spatial_type', values: ['grid', 'point', 'spatial-aggregate'] },
  { key: 'source', field: 'caladapt:source', values: ['wrf', 'loca2', 'observations', 'other'] }
];

// Selected values per row, e.g. { topic: ['energy'], dataType: [], source: ['wrf'] }
export function emptyPillSelection() {
  return Object.fromEntries(['topic', ...COLLECTION_FILTERS.map(filter => filter.key)].map(key => [key, []]));
}

export function hasPillSelection(selection) {
  return Object.values(selection).some(values => values.length > 0);
}

// Within a row a collection matches any selected value; across rows it must match every row
export function matchesPillSelection(catalog, selection) {
  const keywords = Array.isArray(catalog.keywords) ? catalog.keywords : [];
  if (selection.topic.length > 0 && !selection.topic.some(keyword => keywords.includes(keyword))) {
    return false;
  }
  return COLLECTION_FILTERS.every(filter => {
    const values = selection[filter.key];
    return values.length === 0 || values.includes(catalog[filter.field]);
  });
}
