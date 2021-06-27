import Utils from "./utils";
import Migrate from '@radiantearth/stac-migrate';

// STAC Entity
class STAC {

    constructor(data, url, path) {
        this.url = url;
        this.path = path;

        let migrated = Migrate.stac(data);
        for(let key in migrated) {
            if (typeof this[key] === 'undefined') {
                this[key] = migrated[key];
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

    getMetadata(field) {
        if (this.isItem()) {
            return this.properties[field];
        }
        else if (this.isCatalogLike()) {
            return this[field];
        }
        return null;
    }

    getDisplayTitle(defaultTitle = STAC.DEFAULT_TITLE) {
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
        return this.path;
    }

    getAbsoluteUrl() {
        return this.url;
    }

    getLinkWithRel(rel) {
        return this.links.find(link => Utils.isObject(link) && typeof link.href === 'string' && link.rel === rel);
    }

    getLinksWithRels(rels) {
        return this.links.filter(link => Utils.isObject(link) && typeof link.href === 'string' && rels.includes(link.rel));
    }

    getLinksWithOtherRels(rels) {
        return this.links.filter(link => Utils.isObject(link) && typeof link.href === 'string' && !rels.includes(link.rel));
    }

    getAssetsWithRoles(roles) {
        let matches = [];
        for(let key in this.assets) {
            let asset = this.assets[key];
            if (Utils.isObject(asset) && typeof asset.href === 'string' && Array.isArray(asset.roles) && roles.find(role => asset.roles.includes(role))) {
                matches.push(asset);
            }
        }
        return matches;
    }

    getThumbnails() {
      // Get from assets
      let thumbnails = this.getAssetsWithRoles(['thumbnail', 'overview']);
      // Get from links only if no assets are available as they should usually be the same as in assets
      if (thumbnails.length === 0) {
        thumbnails = this.getLinksWithRels(['preview']);
      }
      return thumbnails;
    }

}

STAC.DEFAULT_TITLE = 'Untitled';

export default STAC;