import URI from 'urijs';
import removeMd from 'remove-markdown';
import { Link, Asset } from 'stac-js';
import { hasText, isObject, size } from 'stac-js/src/utils.js';
import { geojsonMediaType, imageMediaTypes } from 'stac-js/src/mediatypes.js';
import { pagination } from "stac-js/src/relationtypes.js";

export const commonFileNames = ['catalog', 'collection', 'item'];

export const mapMediaTypes = imageMediaTypes.concat([geojsonMediaType]);

export class BrowserError extends Error {
  constructor(message) {
    super(message);
  }
}

/**
 * General utilities
 * 
 * @class
 */
export default class Utils {

  static isMediaType(type, types, allowEmpty = false) {
    if (!Array.isArray(types)) {
      types = [types];
    }
    if (allowEmpty && !type) {
      return true;
    }
    else if (typeof type !== 'string') {
      return false;
    }
    else {
      return types.includes(type.toLowerCase());
    }
  }

  static shortenTitle(fullStr, strLen, separator = '…') {
    if (fullStr.length <= strLen) {
      return fullStr;
    }

    let sepLen = separator.length;
    let charsToShow = strLen - sepLen;
    let frontChars = Math.ceil(charsToShow/2);
    let backChars = Math.floor(charsToShow/2);
    return fullStr.substr(0, frontChars) + 
           separator + 
           fullStr.substr(fullStr.length - backChars);
  }

  static getLinkWithRel(links, rel) {
    return Array.isArray(links) ? links.find(link => isObject(link) && hasText(link.href) && link.rel === rel) : null;
  }

  static getLinksWithRels(links, rels) {
    return Array.isArray(links) ? links.filter(link => isObject(link) && hasText(link.href) && rels.includes(link.rel)) : [];
  }

  static removeTrailingSlash(str) {
    return str.replace(/\/$/, '');
  }

  static equalUrl(a, b) {
    try {
      let uri1 = URI(a);
      let uri2 = URI(b);
      // Ignore trailing slash in URL paths
      uri1.path(Utils.removeTrailingSlash(uri1.path()));
      uri2.path(Utils.removeTrailingSlash(uri2.path()));
      return uri1.equals(uri2);
    } catch {
      return false;
    }
  }

  static summarizeMd(text, maxLength = null) {
    if (!hasText(text)) {
      return '';
    }
    // Best-effort approach to remove some CommonMark (Markdown).
    // Likely not perfect, but seems good enough for most cases.
    text = removeMd(text).replaceAll(/[\r\n]+/g, ' ');
    if (maxLength > 0 && text.length > maxLength) {
      text = text.substr(0, maxLength) + '…';
    }
    return text;
  }

  static scrollTo(el) {
    if (!el) {
      return;
    }
    var rect = el.getBoundingClientRect();
    var isVisible = rect.top < window.innerHeight && rect.bottom >= 0;
    if (!isVisible) {
      el.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });
    }
  }

  // Convert from UTC to locale time (needed for vue2-datetimepicker)
  // see https://github.com/mengxiong10/vue2-datepicker/issues/388
  static dateFromUTC(dt) {
    if (dt) {
      const value = new Date(dt);
      dt = new Date(value.getTime() + value.getTimezoneOffset() * 60 * 1000);
    }
    return dt;
  }

  static dateToUTC(dt) {
    if (dt instanceof Date) {
      dt = new Date(dt.getTime() - dt.getTimezoneOffset() * 60 * 1000);
    }
    return dt;
  }

  static formatDatetimeQuery(value) {
    if (Array.isArray(value) && value.length === 2 && (value[0] || value[1])) {
      return value.map(dt => {
        if (dt instanceof Date) {
          return dt.toISOString();
        }
        else {
          return dt || '..';
        }
      }).join('/');
    }
    return null;
  }

  static formatSortbyForPOST(value) {
    // POST search requires sortby to be an array of objects containing a property name and sort direction.
    // See spec here: https://api.stacspec.org/v1.0.0-rc.1/item-search/#tag/Item-Search/operation/postItemSearch
    // This function converts the property name to the desired format.
    const sortby = {
      field: '',
      direction: 'asc'
    };
  
    // Check if the value starts with a minus sign ("-")
    if (value.startsWith('-')) {
      // sort by descending order
      sortby.field = value.substring(1);
      sortby.direction = 'desc';
    } else {
      //sort by ascending order
      sortby.field = value;
    }
    
    // Put the object in an array
    return [sortby];
  }

  // todo: remove when all usage is gone, replace with stac-js method
  static getPaginationLinks(data) {
    let pages = {};
    if (isObject(data)) {
      let pageLinks = Utils.getLinksWithRels(data.links, pagination);
      for (let pageLink of pageLinks) {
        let rel = pageLink.rel === 'previous' ? 'prev' : pageLink.rel;
        pages[rel] = pageLink;
      }
    }
    return pages;
  }

  static addFiltersToLink(link, filters = {}, defaultLimit = null) {
    let isEmpty = value => {
      return (value === null
      || (typeof value === 'number' && !Number.isFinite(value))
      || (typeof value === 'string' && value.length === 0)
      || (typeof value === 'object' && size(value) === 0));
    };

    if (!isObject(filters)) {
      filters = {};
    }
    else {
      filters = Object.assign({}, filters);
    }

    if (typeof filters.limit !== 'number' && typeof defaultLimit === 'number') {
      filters.limit = defaultLimit;
    }

    if (hasText(link.method) && link.method.toUpperCase() === 'POST') {
      let body = Object.assign({}, link.body);

      for (let key in filters) {
        let value = filters[key];
        if (isEmpty(value)) {
          delete body[key];
          continue;
        }

        if (key === 'sortby') {
          value = Utils.formatSortbyForPOST(value);
        }
        else if (key === 'datetime') {
          value = Utils.formatDatetimeQuery(value);
          if (!value) {
            continue; // skip empty datetime
          }
        }
        else if (key === 'filters') {
          Object.assign(body, value.toJSON());
          continue;
        }

        body[key] = value;
      }
      return Object.assign({}, link, { body });
    }
    else { // GET
      // Construct new link with search params
      let url = URI(link.href);

      for (let key in filters) {
        let value = filters[key];
        if (isEmpty(value)) {
          url.removeQuery(key);
          continue;
        }

        if (key === 'datetime') {
          value = Utils.formatDatetimeQuery(value);
        }
        else if (key === 'bbox') {
          value = value.join(',');
        }
        else if ((key === 'collections' || key === 'ids' || key === 'q')) {
          value = value.join(',');
        }
        else if (key === 'filters') {
          let params = value.toText();
          url.setQuery(params);
          continue;
        }

        url.setQuery(key, value);
      }

      return Object.assign({}, link, { href: url.toString() });
    }
  }

  static titleForHref(href, preferFileName = false) {
    let uri = URI(href);
    let auth = uri.authority();
    let file = uri.filename().replace(/^(.{1,})\.\w+$/, '$1');
    let dir = uri.directory().replace(/^\//, '');
    if (auth && file && !preferFileName) {
      let path = uri.path().replace(/^\//, '');
      if (auth === 'doi.org' && path.startsWith('10.')) {
        return `DOI ${path}`;
      }
      else {
        return `${file} (${auth})`;
      }
    }
    else if (file && !commonFileNames.includes(file)) {
      return file;
    }
    else if (auth) {
      return auth;
    }
    else if (dir) {
      return dir;
    }
    else {
      return href;
    }
  }

  // Gets the value at path of object.
  // Drop in replacement for lodash.get
  static getValueFromObjectUsingPath(object, path) {
    if (object === null || typeof object !== 'object') {
      return;
    }
    object = object[path[0]];
    if (typeof object !== 'undefined' && path.length > 1) {
      return this.getValueFromObjectUsingPath(object, path.slice(1));
    }
    return object;
  }

  static search(searchterm, target, and = true) {
    if (typeof searchterm !== 'string' || searchterm.length === 0) {
      return false;
    }
    if (isObject(target)) {
      target = Object.values(target);
    }
    else if (typeof target === 'string') {
      target = [target];
    }

    if (!Array.isArray(target)) {
      return false;
    }

    let splitChars = /[\s.,;!&({[)}]]+/g;

    // Prepare search terms
    searchterm = searchterm.toLowerCase().split(splitChars);

    // Prepare text to search in
    target = target
      .filter(s => typeof s === 'string') // Remove non-strings
      .join(' ') // Merge into a single string
      .replace(splitChars, ' ') // replace split chars with white spaces
      .toLowerCase(); // Lowercase

    // Search with "and" or "or"
    let fn = and ? 'every' : 'some';
    return searchterm[fn](term => target.includes(term));
  }

  static createLink(href, rel, title) {
    return new Link({ href, rel, title });
  }

  /**
   * Deep merge two objects.
   * @param target
   * @param ...sources
   */
  static mergeDeep(target, ...sources) {
    if (!sources.length) {
      return target;
    }
    const source = sources.shift();

    if (isObject(target) && isObject(source)) {
      for (const key in source) {
        if (isObject(source[key])) {
          if (!target[key]) {
            Object.assign(target, { [key]: {} });
          }
          Utils.mergeDeep(target[key], source[key]);
        } else {
          Object.assign(target, { [key]: source[key] });
        }
      }
    }

    return Utils.mergeDeep(target, ...sources);
  }

  static convertHumanizedSortOrder(value) {
    switch (value) {
      case 'asc':
        return 1;
      case 'desc':
        return -1;
      default:
        return 0;
    }
  }

  static assetFilename(asset, response = null) {
    // Get the preferred filename from the file:local_path property
    if (asset instanceof Asset) {
      const localPath = asset.getMetadata('file:local_path');
      if (typeof localPath === 'string') {
        return URI(localPath).filename();
      }
    }
    // Get the filename from the content-disposition header
    const contentDisposition = response?.headers.get('content-disposition');
    if (typeof contentDisposition === 'string') {
      const parts = contentDisposition.match(/filename=(?:"|)([^"]+)(?:"|)(?:;|$)/);
      if (parts) {
        return parts[1];
      }
    }
    // Fallback to the filename from the href
    if (isObject(asset) && typeof asset.href === 'string') {
      return URI(asset.href).filename();
    }
    // Fallback to a default filename
    return 'download';
  }

}
