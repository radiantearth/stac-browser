import { hierarchical, pagination, queryables } from "stac-js/src/relationtypes.js";

// STAC relation types

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
].concat(hierarchical).concat(pagination);

// Rels that are handled in a special way and should not be shown in the link list
export const stacBrowserSpecialHandling = [
  'conformance', // API related v
  'data',
  'items',
  'search',
  'icon', // Other v
  'license',
].concat(hierarchical).concat(pagination).concat(queryables);

// OGC APIs
export const ogcRelPrefix = 'http://www.opengis.net/def/rel/ogc/1.0/';
