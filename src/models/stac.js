import Utils, { geojsonMediaType } from "../utils";
import Migrate from '@radiantearth/stac-migrate';
import { getBest } from '../locale-id';

let stacObjCounter = 0;

// STAC Entity
class STAC {

  constructor(data, url, path, migrate = true) {
    this._id = stacObjCounter++;
    this._url = url;
    this._path = path;
    this._apiChildrenListeners = {};
    this._incomplete = false;
    this._apiChildren = {
      list: [],
      prev: false,
      next: false
    };

    if (migrate) {
      // Uncomment this line if the old checksum: fields should be converted
      // This is usually not needed so it's not enabled by default to shrink the bundle size
      // Migrate.enableMultihash(require('multihashes'));
      if (data.type === 'FeatureCollection') {
        data.features = data.features.map(item => Migrate.item(item, false));
      }
      else {
        data = Migrate.stac(data, false);
      }
    }
    for (let key in data) {
      if (typeof this[key] === 'undefined') {
        this[key] = data[key];
      }
    }
  }

  isPotentiallyIncomplete() {
    return this._incomplete;
  }

  markPotentiallyIncomplete() {
    this._incomplete = true;
  }

  isItem() {
    return this.type === 'Feature';
  }

  isCatalog() {
    return this.type === 'Catalog';
  }

  isCatalogLike() {
    return this.isCatalog() || this.isCollection();
  }

  isCollection() {
    return this.type === 'Collection';
  }

  isItemCollection() {
    return this.type === 'FeatureCollection';
  }

  hasApiData() {
    return this._apiChildren.list.length > 0;
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

  getFileFormats() {
    let assets = [];
    if ((this.isItem() || this.isCollection()) && Utils.isObject(this.assets)) {
      assets = assets.concat(Object.values(this.assets));
    }
    if (this.isCollection() && Utils.isObject(this.item_assets)) {
      assets = assets.concat(Object.values(this.item_assets));
    }
    return assets
      .filter(asset => Array.isArray(asset.roles) && asset.roles.includes('data') && typeof asset.type === 'string') // Look for data files
      .map(asset => asset.type) // Array shall only contain media types
      .filter((v, i, a) => a.indexOf(v) === i); // Unique values
  }

  getChildren(priority = null) {
    if (!this.isCatalogLike()) {
      return [];
    }

    let showCollections = !priority || priority === 'collections';
    let showChilds = !priority || priority === 'childs';

    let children = [];
    if (showCollections && this._apiChildren.prev) {
      children.push(this._apiChildren.prev);
    }
    if (showCollections && this._apiChildren.list.length > 0) {
      children = this._apiChildren.list.slice(0);
    }
    if (showChilds) {
      children = STAC.addMissingChildren(children, this).concat(this.getLinksWithRels(['item']));
    }
    if (showCollections && this._apiChildren.next) {
      children.push(this._apiChildren.next);
    }
    return children;
  }

  static addMissingChildren(catalogs, stac) {
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

  getSearchLink() {
    // The search link MUST be 'application/geo+json' as otherwise it's likely not STAC
    // See https://github.com/opengeospatial/ogcapi-features/issues/832
    let links = Utils.getLinksWithRels(this.links, ['search'])
      .filter(link => Utils.isMediaType(link.type, geojsonMediaType))
      .map(link => Object.assign({}, link, {href: Utils.toAbsolute(link.href, this._url)}));
    // Prefer POST if present
    let post = links.find(link => Utils.hasText(link.method) && link.method.toUpperCase() === 'POST');
    return post || links[0] || null;
  }

  getApiCollectionsLink() {
    return this.getStacLinkWithRel('data');
  }

  getApiItemsLink() {
    return this.getStacLinkWithRel('items');
  }

  getMetadata(field) {
    if (this.isItem()) {
      return this.properties[field];
    }
    else if (this.isCatalogLike()) {
      return this[field];
    }
    return null;
  }

  getBrowserPath() {
    return this._path;
  }

  getAbsoluteUrl() {
    return this._url;
  }

  getLocaleLink(locale, fallbackLocale = null) {
    let links = this.getStacLinksWithRel('alternate')
      .filter(link => Utils.hasText(link.hreflang));
    
    let available;
    if (Array.isArray(this.languages)) {
      available = this.languages.map(l => l.code);
    }
    else {
      available = links.map(link => link.hreflang);
    }
    
    let best = getBest(available, locale, fallbackLocale);
    return links.find(link => link.hreflang === best) || null;
  }

  getStacLinksWithRel(rel, allowEmpty = true) {
    return Utils.getLinksWithRels(this.links, [rel])
      .filter(link => Utils.isStacMediaType(link.type, allowEmpty));
  }

  getStacLinkWithRel(rel, allowEmpty = true) {
    const links = this.getStacLinksWithRel(rel, allowEmpty);
    if (links.length > 0) {
      return links[0];
    }
    else {
      return null;
    }
  }

  getLinkWithRel(rel) {
    return Utils.getLinkWithRel(this.links, rel);
  }

  getLinksWithRels(rels) {
    return Utils.getLinksWithRels(this.links, rels);
  }

  getLinksWithOtherRels(rels) {
    return Utils.getLinksWithOtherRels(this.links, rels);
  }

  getAssetsWithRoles(roles) {
    let matches = [];
    if (Utils.isObject(this.assets)) {
      for (let key in this.assets) {
        let asset = this.assets[key];
        if (Utils.isObject(asset) && typeof asset.href === 'string' && Array.isArray(asset.roles) && asset.roles.find(role => roles.includes(role))) {
          matches.push(asset);
        }
      }
    }
    return matches;
  }

  static getDisplayTitle(sources, fallbackTitle = null) {
    if (!Array.isArray(sources)) {
      sources = [sources];
    }
    let stac = sources.find(o => o instanceof STAC);
    let link = sources.find(o => Utils.isObject(o) && !(o instanceof STAC));
    // Get title from STAC item/catalog/collection
    if (stac && Utils.hasText(stac.getTitle())) {
      return stac.getTitle();
    }
    // Get title from link
    else if (link && Utils.hasText(link.title)) {
      return link.title;
    }
    // Use id from STAC item/catalog/collection instead of titles
    else if (stac && Utils.hasText(stac.id)) {
      return stac.id;
    }
    // Use fallback title
    else if (Utils.hasText(fallbackTitle)) {
      return fallbackTitle;
    }
    // Use file or directory name from STAC as title
    else if (stac) {
      return Utils.titleForHref(stac.getAbsoluteUrl(), true);
    }
    // Use file or directory name from link as title
    else if (link && Utils.hasText(link.href)) {
      return Utils.titleForHref(link.href, true);
    }
    // Nothing available, return "untitled"
    else {
      return "Untitled";
    }
  }

  getTitle() {
    return this.getMetadata("title");
  }

  _linkToAbsolute(link) {
    return Object.assign({}, link, { href: Utils.toAbsolute(link.href, this.getAbsoluteUrl()) });
  }

  getIcons() {
    return this.getLinksWithRels(['icon'])
      .filter(img => Utils.canBrowserDisplayImage(img))
      .map(img => this._linkToAbsolute(img));
  }

  /**
   * Get the thumbnails from the assets and links in a STAC entity.
   * 
   * @param {boolean} browserOnly - Return only images that can be shown in a browser natively (PNG/JPG/GIF/WEBP).
   * @param {?string} prefer - If not `null` (default), prefers a role over the other. Either `thumbnail` or `overview`.
   * @returns 
   */
  getThumbnails(browserOnly = false, prefer = null) { // prefer can be either 
    let thumbnails = this.getAssetsWithRoles(['thumbnail', 'overview']);
    if (prefer && thumbnails.length > 1) {
      thumbnails.sort(a => a.roles.includes(prefer) ? -1 : 1);
    }
    // Get from links only if no assets are available as they should usually be the same as in assets
    if (thumbnails.length === 0) {
      thumbnails = this.getLinksWithRels(['preview']);
    }
    // Some old catalogs use just a asset key
    if (thumbnails.length === 0 && Utils.isObject(this.assets) && Utils.isObject(this.assets.thumbnail)) {
      thumbnails = [this.assets.thumbnail];
    }
    if (browserOnly) {
      // Remove all images that can't be displayed in a browser
      thumbnails = thumbnails.filter(img => Utils.canBrowserDisplayImage(img));
    }
    return thumbnails.map(img => this._linkToAbsolute(img));
  }

  equals(other) {
    if (!Utils.isObject(other)) {
      return false;
    }
    if (this === other) {
      return true;
    }
    if (this.id === other.id && this.type == other.type) {
      return true;
    }
    return false;
  }

}

export default STAC;
