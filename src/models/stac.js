import { Catalog, Collection, Item, ItemCollection, CollectionCollection, STAC, STACReference } from 'stac-js';
import Migrate from '@radiantearth/stac-migrate';
import Utils from '../utils';
import { hasText, isObject } from 'stac-js/src/utils.js';
import { toAbsolute } from 'stac-js/src/http.js';

const apiChildrenState = new WeakMap();
const apiChildrenListeners = new WeakMap();

function ensureApiChildren(stac) {
  let state = apiChildrenState.get(stac);
  if (!state) {
    state = {
      list: [],
      prev: false,
      next: false
    };
    apiChildrenState.set(stac, state);
  }
  return state;
}

function ensureApiChildrenListeners(stac) {
  let listeners = apiChildrenListeners.get(stac);
  if (!listeners) {
    listeners = {};
    apiChildrenListeners.set(stac, listeners);
  }
  return listeners;
}

function setInternal(stac, key, value) {
  const internalKey = '_' + key;
  stac[internalKey] = value;
  stac._privateKeys.push(internalKey);
}

export function createSTAC(data, url = null, preprocess = null) {
  // Uncomment this line if the old checksum: fields should be converted
  // This is usually not needed so it's not enabled by default to shrink the bundle size
  // Migrate.enableMultihash(require('multihashes'));

  // Migrate STAC to latest version
  let original = JSON.parse(JSON.stringify(data)); // todo: use structuredClone()
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
    obj.getAll().forEach(child => setInternal(child, 'incomplete', true));
  }
  setInternal(obj, 'original', original);
  // todo: Should we set original for API children?

  // Preprocess the STAC object if a preprocess function is provided
  if (preprocess) {
    if (obj.isSTAC) {
      obj = preprocess(obj);
    }
    else if (obj.isApiCollection) {
      const key = obj.isCollectionCollection ? 'collections' : 'features';
      obj[key] = obj[key].map(child => preprocess(child));
    }
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

export function getChildren(stac, priority = null) {
  if (!stac.isCatalogLike) {
    return [];
  }

  const apiChildren = ensureApiChildren(stac);

  let showCollections = !priority || priority === 'collections';
  let showChilds = !priority || priority === 'childs';

  let children = [];
  if (showCollections && apiChildren.prev) {
    children.push(apiChildren.prev);
  }
  if (showCollections && apiChildren.list.length > 0) {
    children = apiChildren.list.slice(0);
  }
  if (showChilds) {
    children = addMissingChildren(children, stac).concat(stac.getLinksWithRels(['item']));
  }
  if (showCollections && apiChildren.next) {
    children.push(apiChildren.next);
  }
  return children;
}

export function getApiChildrenState(stac) {
  if (!stac.isCatalogLike) {
    return null;
  }
  return ensureApiChildren(stac);
}

export function setApiDataListener(stac, id, listener = null) {
  if (!stac.isCatalogLike || typeof id !== 'string' || id.length === 0) {
    return;
  }

  const listeners = ensureApiChildrenListeners(stac);
  if (typeof listener === 'function') {
    listeners[id] = listener;
  }
  else {
    delete listeners[id];
  }
}

export function setApiData(stac, list, next = null, prev = null) {
  if (!stac.isCatalogLike) {
    return;
  }

  const apiChildren = ensureApiChildren(stac);
  if (prev) {
    apiChildren.prev = prev;
  }
  if (next) {
    apiChildren.next = next;
  }
  apiChildren.list = Array.isArray(list) ? list : [];

  const listeners = ensureApiChildrenListeners(stac);
  for (let id in listeners) {
    try {
      listeners[id](apiChildren);
    }
    catch (error) {
      console.error(error);
    }
  }
}
