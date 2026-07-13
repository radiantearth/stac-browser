import { Catalog, Collection, Item, ItemCollection, CollectionCollection, STAC, STACReference } from 'stac-js';
import Migrate from '@radiantearth/stac-migrate';
import Utils from '../utils';
import { hasText, isObject } from 'stac-js/src/utils.js';
import { toAbsolute } from 'stac-js/src/http.js';
import { markRaw } from 'vue';

function setInternal(stac, key, value) {
  const internalKey = '_' + key;
  stac[internalKey] = value;
  stac._privateKeys.push(internalKey);
}

export function processSTAC(stac, store) {
  if (typeof store.state.preprocessSTAC === 'function') {
    stac = store.state.preprocessSTAC(stac, store.state, store.getters);
  }
  return markRaw(stac);
}

export function createSTAC(data, url = null, store = null) {
  // Uncomment this line if the old checksum: fields should be converted
  // This is usually not needed so it's not enabled by default to shrink the bundle size
  // Migrate.enableMultihash(require('multihashes'));

  // Migrate STAC to latest version
  let original = data._original ?? structuredClone(data);
  data = Migrate.stac(data, false);

  // Create stac-js object based on STAC type
  let obj;
  if (data.type === 'Feature') {
    obj = new Item(data, url);
  }
  else if (data.type === 'FeatureCollection') {
    obj = new ItemCollection(data, url);
  }
  else if (data.type === 'Collection' || (!data.type && typeof data.extent !== 'undefined' && typeof data.license !== 'undefined')) {
    obj = new Collection(data, url);
  }
  else if (!data.type && Array.isArray(data.collections)) {
    obj = new CollectionCollection(data, url);
  }
  else {
    obj = new Catalog(data, url);
  }

  // Set stac-browser internal properties
  if (obj.isApiCollection) {
    const originals = obj.isCollectionCollection ? original.collections : original.features;
    obj.getAll().forEach((child, i) => {
      setInternal(child, 'incomplete', true);
      setInternal(child, 'original', originals[i]);
    });
  }
  setInternal(obj, 'original', original);

  // Preprocess STAC objects
  if (store && obj.isItemCollection) {
    obj.features = obj.features.map(item => processSTAC(item, store));
  }
  else if (store && obj.isCollectionCollection) {
    obj.collections = obj.collections.map(collection => processSTAC(collection, store));
  }
  else if (store) {
    obj = processSTAC(obj, store);
  }

  return obj;
}

export function addMissingChildren(catalogs, stac) {
  const catalogUrls = new Set(catalogs.map(collection => collection.getAbsoluteUrl()));
  let links = stac.getStacLinksWithRel('child').filter(link => {
    // Don't add links that are already in collections: https://github.com/radiantearth/stac-browser/issues/103
    const absoluteUrl = toAbsolute(link.href, stac.getAbsoluteUrl());
    return !catalogUrls.has(absoluteUrl);
  });
  // place the children first to avoid conflicts with the paginated collections
  // where the children are always at the end and can never be reached due to infinite scrolling
  return links.concat(catalogs);
}

export function getDisplayTitle(entities, fallbackTitle = "") {
  if (!Array.isArray(entities)) {
    entities = [entities];
  }
  const stac = entities.find(o => o instanceof STAC);
  const ref = entities.find(o => o instanceof STACReference);
  const entity = stac || ref;
  if (!entity) {
    return fallbackTitle;
  }
  const title = entity.getMetadata("title");
  if (hasText(title)) {
    return title;
  }
  const id = entity.getMetadata("id");
  if (hasText(id)) {
    return id;
  }
  if (hasText(fallbackTitle)) {
    return fallbackTitle;
  }
  // Use file or directory name from STAC entity as title
  return Utils.titleForHref(entity.getAbsoluteUrl(), true);
}

export function sortStac(entities, sort, uiLanguage) {
  const collator = new Intl.Collator(uiLanguage);
  const field = typeof sort.field === 'string' && sort.field.length > 0 ? sort.field.split(".") : null;
  const getFieldValue = (entity) => {
    if (!field) {
      return getDisplayTitle(entity);
    }
    let value = entity;
    for (let part of field) {
      if (!isObject(value)) {
        return null;
      }
      value = value[part];
      if (typeof value === 'undefined') {
        return null;
      }
    }
    return value;
  };

  const sorted = entities.slice(0).sort((a, b) => {
    const aValue = getFieldValue(a);
    const bValue = getFieldValue(b);
    if (aValue === null && bValue === null) {
      return 0;
    }
    if (aValue === null) {
      return 1;
    }
    if (bValue === null) {
      return -1;
    }
    if (typeof aValue === 'number' && typeof bValue === 'number') {
      return aValue - bValue;
    }
    return collator.compare(String(aValue), String(bValue));
  });
  if (sort.direction === -1) {
    return sorted.reverse();
  }
  return sorted;
}
