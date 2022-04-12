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
                data.features = data.features.map(item => Migrate.item(item, false));
            }
            else {
                data = Migrate.stac(data, false);
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
        if (this._apiChildren.list.length > 0) {
            children = this._apiChildren.list;
        }
        children = STAC.addMissingChildren(children, this).concat(this.getLinksWithRels(['item']));
        if (this._apiChildren.next) {
            children.push(this._apiChildren.next);
        }
        return children;
    }

    static addMissingChildren(catalogs, stac) {
        let links = stac.getLinksWithRels(['child']).filter(link => {
          // Don't add non-JSON links
          if (!Utils.isStacMediaType(link.type, true)) {
            return false;
          }
          // Don't add links that are already in collections: https://github.com/radiantearth/stac-browser/issues/103
          // ToDo: The runtime of this can probably be improved
          let absoluteUrl = Utils.toAbsolute(link.href, stac.getAbsoluteUrl());
          return !catalogs.find(collection => collection.getAbsoluteUrl() === absoluteUrl);
        });
        return catalogs.concat(links);
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
        if (Utils.isObject(this.assets)) {
            for(let key in this.assets) {
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
        if (this.isItem()) {
			return this.properties.title;
		}
		else {
			return this.title;
		}
    }

    _linkToAbsolute(link) {
        return Object.assign({}, link, {href: Utils.toAbsolute(link.href, this.getAbsoluteUrl())});
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