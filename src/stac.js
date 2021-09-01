import Utils from "./utils";
import Migrate from '@radiantearth/stac-migrate';

// STAC Entity
class STAC {

    constructor(data, url, path, migrate = true) {
        this._url = url;
        this._path = path;
        this._apiChildren = {
            list: [],
            next: false
        };

        if (migrate) {
            if (data.type === 'FeatureCollection') {
                data.features = data.features.map(item => Migrate.item(item));
            }
            else {
                data = Migrate.stac(data);
            }
        }
        for(let key in data) {
            if (typeof this[key] === 'undefined') {
                this[key] = data[key];
            }
        }
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

    getChildren() {
        if (!this.isCatalogLike()) {
            return [];
        }

        let children = [];
        if (this._apiChildren.prev) {
            children.push(this._apiChildren.prev);
        }
        children = children.concat(this.getLinksWithRels(['child', 'item']));
        if (this._apiChildren.list.length > 0) {
            children = children.concat(this._apiChildren.list);
        }
        if (this._apiChildren.next) {
            children.push(this._apiChildren.next);
        }
        return children;
    }

    getApiCollectionsLink() {
        return this.getLinkWithRel('data');
    }

    getApiItemsLink() {
        return this.getLinkWithRel('items');
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

    getDisplayTitle(defaultTitle = null) {
        if (this.isItem() && Utils.hasText(this.properties.title)) {
            return this.properties.title;
        }
        else if (Utils.hasText(this.title)) {
            return this.title;
        }
        else if (Utils.hasText(this.id)) {
            return this.id;
        }
        else {
            return defaultTitle;
        }
    }

    getBrowserPath() {
        return this._path;
    }

    getAbsoluteUrl() {
        return this._url;
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
        for(let key in this.assets) {
            let asset = this.assets[key];
            if (Utils.isObject(asset) && typeof asset.href === 'string' && Array.isArray(asset.roles) && asset.roles.find(role => roles.includes(role))) {
                matches.push(asset);
            }
        }
        return matches;
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
      if (browserOnly) {
          // Remove all images that can't be displayed in a browser
          return thumbnails.filter(img => Utils.canBrowserDisplayImage(img));
      }
      else {
        return thumbnails;
      }
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

STAC.DEFAULT_TITLE = 'Untitled';

export default STAC;