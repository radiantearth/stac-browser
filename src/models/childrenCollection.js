import { APICollection, Catalog, Collection, STAC } from 'stac-js';
import { isObject } from 'stac-js/src/utils.js';

/**
 * A list of children (Catalogs and Collections) as returned by the
 * `/children` endpoint of the STAC API - Children extension.
 *
 * @class
 * @property {Array.<Catalog|Collection>} children
 * @property {Array.<Link>} links
 *
 * @param {Object} data The STAC API Children object
 * @param {string|null} absoluteUrl Absolute URL of the children endpoint
 */
class ChildrenCollection extends APICollection {
  static isResponse(data) {
    return isObject(data) && Array.isArray(data.children);
  }

  constructor(data, absoluteUrl = null) {
    const keyMap = {
      children: children => children.map(child => {
        if (child instanceof STAC) {
          return child;
        }
        return child?.type === 'Collection' ? new Collection(child) : new Catalog(child);
      })
    };
    super(data, absoluteUrl, keyMap);
  }

  getObjectType() {
    return 'ChildrenCollection';
  }

  getAll() {
    return this.children;
  }

  get isChildrenCollection() {
    return true;
  }
}

export default ChildrenCollection;
