import {
  Catalog as BaseCatalog,
  Collection as BaseCollection,
  Item as BaseItem,
  ItemCollection as BaseItemCollection,
  CollectionCollection as BaseCollectionCollection,
  STAC,
  STACReference
} from 'stac-js';
import Migrate from '@radiantearth/stac-migrate';
import Utils, { geojsonMediaType } from "../utils";

export function createSTAC(data, url, path, migrate = true, updateVersionNumber = false) {
  if (migrate) {
    // Uncomment this line if the old checksum: fields should be converted
    // This is usually not needed so it's not enabled by default to shrink the bundle size
    // Migrate.enableMultihash(require('multihashes'));
    data = Migrate.stac(data, updateVersionNumber);
  }
  if (data.type === 'Feature') {
    return new Item(data, url, path);
  }
  else if (data.type === 'FeatureCollection') {
    return new ItemCollection(data, url, path);
  }
  else if (data.type === 'Collection' || (!data.type && typeof data.extent !== 'undefined' && typeof data.license !== 'undefined')) {
    return new Collection(data, url, path);
  }
  else if (!data.type && Array.isArray(data.collections)) {
    return new CollectionCollection(data, url, path);
  }
  else {
    return new Catalog(data, url, path);
  }
}

export function addMissingChildren(catalogs, stac) {
  let links = stac.getStacLinksWithRel('child').filter(link => {
    // Don't add links that are already in collections: https://github.com/radiantearth/stac-browser/issues/103
    // ToDo: The runtime of this can probably be improved
    let absoluteUrl = Utils.toAbsolute(link.href, stac.getAbsoluteUrl());
    return !catalogs.find(collection => collection.getAbsoluteUrl() === absoluteUrl);
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
  if (Utils.hasText(title)) {
    return title;
  }
  const id = entity.getMetadata("id");
  if (Utils.hasText(id)) {
    return id;
  }
  if (Utils.hasText(fallbackTitle)) {
    return fallbackTitle;
  }
  // Use file or directory name from STAC entity as title
  return Utils.titleForHref(entity.getAbsoluteUrl(), true);
}

function getChildren(stac, priority = null) {
  if (!stac.isCatalogLike()) {
    return [];
  }

  let showCollections = !priority || priority === 'collections';
  let showChilds = !priority || priority === 'childs';

  let children = [];
  if (showCollections && stac._apiChildren.prev) {
    children.push(stac._apiChildren.prev);
  }
  if (showCollections && stac._apiChildren.list.length > 0) {
    children = stac._apiChildren.list.slice(0);
  }
  if (showChilds) {
    children = addMissingChildren(children, stac).concat(stac.getLinksWithRels(['item']));
  }
  if (showCollections && stac._apiChildren.next) {
    children.push(stac._apiChildren.next);
  }
  return children;
}


function getSearchLink(stac) {
  // The search link MUST be 'application/geo+json' as otherwise it's likely not STAC
  // See https://github.com/opengeospatial/ogcapi-features/issues/832
  let links = Utils.getLinksWithRels(stac.links, ['search'])
    .filter(link => Utils.isMediaType(link.type, geojsonMediaType))
    .map(link => Object.assign({}, link, {href: Utils.toAbsolute(link.href, stac.getAbsoluteUrl())}));
  // Prefer POST if present
  let post = links.find(link => Utils.hasText(link.method) && link.method.toUpperCase() === 'POST');
  return post || links[0] || null;
}

export class ItemCollection extends BaseItemCollection {

  constructor(data, url, path) {
    super(data, url);
    this._path = path;
  }

  getBrowserPath() {
    return this._path;
  }

}

export class CollectionCollection extends BaseCollectionCollection {

  constructor(data, url, path) {
    super(data, url);
    this._path = path;
  }

  getBrowserPath() {
    return this._path;
  }

}

export class Collection extends BaseCollection {

  constructor(data, url, path) {
    super(data, url);
    this._path = path;
    this._incomplete = false;
    this._apiChildrenListeners = {};
    this._apiChildren = {
      list: [],
      prev: false,
      next: false
    };
  }

  getBrowserPath() {
    return this._path;
  }

  getSearchLink() {
    return getSearchLink(this);
  }

  getChildren(priority = null) {
    return getChildren(this, priority);
  }

  setApiDataListener(id, listener = null) {
    if (typeof listener === 'function') {
      this._apiChildrenListeners[id] = listener;
    }
    else {
      delete this._apiChildrenListeners[id];
    }
  }

  setApiData(list, next = null, prev = null) {
    if (prev) {
      this._apiChildren.prev = prev;
    }
    if (next) {
      this._apiChildren.next = next;
    }
    this._apiChildren.list = list;

    for (let id in this._apiChildrenListeners) {
      try {
        this._apiChildrenListeners[id](this._apiChildren);
      } catch (error) {
        console.error(error);
      }
    }
  }

}

export class Catalog extends BaseCatalog {

  constructor(data, url, path) {
    super(data, url);
    this._path = path;
    this._incomplete = false;
    this._apiChildrenListeners = {};
    this._apiChildren = {
      list: [],
      prev: false,
      next: false
    };
  }

  getBrowserPath() {
    return this._path;
  }

  getSearchLink() {
    return getSearchLink(this);
  }

  getChildren(priority = null) {
    return getChildren(this, priority);
  }

  setApiDataListener(id, listener = null) {
    if (typeof listener === 'function') {
      this._apiChildrenListeners[id] = listener;
    }
    else {
      delete this._apiChildrenListeners[id];
    }
  }

  setApiData(list, next = null, prev = null) {
    if (prev) {
      this._apiChildren.prev = prev;
    }
    if (next) {
      this._apiChildren.next = next;
    }
    this._apiChildren.list = list;

    for (let id in this._apiChildrenListeners) {
      try {
        this._apiChildrenListeners[id](this._apiChildren);
      } catch (error) {
        console.error(error);
      }
    }
  }

}

export class Item extends BaseItem {

  constructor(data, url, path) {
    super(data, url);
    this._path = path;
    this._incomplete = false;
  }

  getBrowserPath() {
    return this._path;
  }

}
