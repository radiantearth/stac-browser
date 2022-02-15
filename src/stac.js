import Utils from "./utils";
import Migrate from '@radiantearth/stac-migrate';

let stacObjCounter = 0;

// STAC Entity
class STAC {

    constructor(data, url, path, migrate = true) {
        this._id = stacObjCounter++;
        this._url = url;
        this._path = path;
        this._apiChildren = {
            list: [],
            prev: false,
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

    hasApiData() {
        return this._apiChildren.list.length > 0;
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
            // ToDo: Don't add collections that are already present in children, see index.js, catalogs() getter
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
        if (this.isItem()) {
			return this.properties.title;
		}
		else {
			return this.title;
		}
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

export default STAC;