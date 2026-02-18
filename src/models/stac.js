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
    data._original = data;
    data = Migrate.stac(data, updateVersionNumber);
  }
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
  if (data._original) {
    obj._privateKeys.push('_original');
  }
  return obj;
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
}

export class CollectionCollection extends BaseCollectionCollection {
}

export class Collection extends BaseCollection {

  getSearchLink() {
    return getSearchLink(this);
  }

}

export class Catalog extends BaseCatalog {

  getSearchLink() {
    return getSearchLink(this);
  }

}

export class Item extends BaseItem {
}
