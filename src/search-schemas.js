import { isObject } from 'stac-js/src/utils.js';
import Queryable from './models/cql2/queryable';

// Loads a JSON Schema (queryables, sortables) and returns the entries of its
// `properties` as [key, schema] pairs, with all $refs resolved.
export async function fetchSchemaProperties(store, link) {
  if (!isObject(link)) {
    return [];
  }
  // Go through the request action so that requests are retried after login
  const response = await store.dispatch('request', { link });
  if (!isObject(response.data)) {
    return [];
  }
  let schemas;
  try {
    const { default: refParser } = await import('@apidevtools/json-schema-ref-parser');
    schemas = await refParser.dereference(response.data);
  } catch (error) {
    // Use data with $refs included as fallback anyway
    console.error(error);
    schemas = response.data;
  }
  if (!isObject(schemas?.properties)) {
    return [];
  }
  return Object.entries(schemas.properties);
}

export async function fetchQueryablesForLink(store, link) {
  const properties = await fetchSchemaProperties(store, link);
  return properties.map(([key, schema]) => new Queryable(key, schema));
}

// Loads the sortable field names for a sortables link
export async function fetchSortablesForLink(store, link) {
  const properties = await fetchSchemaProperties(store, link);
  return properties.map(([key]) => key);
}
