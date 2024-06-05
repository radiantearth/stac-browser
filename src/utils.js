import URI from 'urijs';
import removeMd from 'remove-markdown';
import { stacPagination } from "./rels";

export const commonFileNames = ['catalog', 'collection', 'item'];

export const geojsonMediaType = "application/geo+json";

export const schemaMediaType = "application/schema+json";

export const stacMediaTypes = [
  'application/json',
  geojsonMediaType,
  'text/json'
];

export const browserImageTypes = [
  'image/gif',
  'image/jpg',
  'image/jpeg',
  'image/apng',
  'image/png',
  'image/webp'
];

export const cogMediaTypes = [
  "image/tiff; application=geotiff; profile=cloud-optimized",
  "image/vnd.stac.geotiff; cloud-optimized=true"
];

export const geotiffMediaTypes = [
  "application/geotiff",
  "image/tiff; application=geotiff",
  "image/vnd.stac.geotiff",
].concat(cogMediaTypes);

export const browserProtocols = [
  'http',
  'https'
];

export const imageMediaTypes = browserImageTypes.concat(geotiffMediaTypes);
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

  /**
   * Checks whether a variable is a real object or not.
   * 
   * This is a more strict version of `typeof x === 'object'` as this example would also succeeds for arrays and `null`.
   * This function only returns `true` for real objects and not for arrays, `null` or any other data types.
   * 
   * @param {*} obj - A variable to check.
   * @returns {boolean} - `true` is the given variable is an object, `false` otherwise.
   */
  static isObject(obj) {
    return (typeof obj === 'object' && obj === Object(obj) && !Array.isArray(obj));
  }

  /**
   * Computes the size of an array (number of array elements) or object (number of key-value-pairs).
   * 
   * Returns 0 for all other data types.
   * 
   * @param {*} obj 
   * @returns {integer}
   */
  static size(obj) {
    if (typeof obj === 'object' && obj !== null) {
      if (Array.isArray(obj)) {
        return obj.length;
      }
      else {
        return Object.keys(obj).length;
      }
    }
    return 0;
  }

  static isStacMediaType(type, allowEmpty = false) {
    return Utils.isMediaType(type, stacMediaTypes, allowEmpty);
  }

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

  /**
   * Checks whether a variable is a string and contains at least one character.
   * 
   * @param {*} string - A variable to check.
   * @returns {boolean} - `true` is the given variable is an string with length > 0, `false` otherwise.
   */
  static hasText(string) {
    return (typeof string === 'string' && string.length > 0);
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

  static isGdalVfsUri(url) {
    return typeof url === 'string' && url.startsWith('/vsi') && !url.startsWith('/vsicurl/');
  }

  static toAbsolute(href, baseUrl, stringify = true) {
    return Utils.normalizeUri(href, baseUrl, false, stringify);
  }

  static normalizeUri(href, baseUrl = null, noParams = false, stringify = true) {
    // Convert vsicurl URLs to normal URLs
    if (typeof href === 'string' && href.startsWith('/vsicurl/')) {
      href = href.replace(/^\/vsicurl\//, '');
    }
    // Parse URL and make absolute, if required
    let uri = URI(href);
    // Don't convert GDAL VFS URIs: https://github.com/radiantearth/stac-browser/issues/116
    if (baseUrl && uri.is("relative") && !Utils.isGdalVfsUri(href)) {
      uri = uri.absoluteTo(baseUrl);
    }
    uri.normalize();
    if (noParams) {
      uri.query("");
      uri.fragment("");
    }
    return stringify ? uri.toString() : uri;
  }

  static getLinkWithRel(links, rel) {
    return Array.isArray(links) ? links.find(link => Utils.isObject(link) && Utils.hasText(link.href) && link.rel === rel) : null;
  }

  static getLinksWithRels(links, rels) {
    return Array.isArray(links) ? links.filter(link => Utils.isObject(link) && Utils.hasText(link.href) && rels.includes(link.rel)) : [];
  }

  static getLinksWithOtherRels(links, rels) {
    return Array.isArray(links) ? links.filter(link => Utils.isObject(link) && Utils.hasText(link.href) && !rels.includes(link.rel)) : [];
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
    } catch (error) {
      return false;
    }
  }

  static summarizeMd(text, maxLength = null) {
    if (!Utils.hasText(text)) {
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
    if (dt instanceof Date) {
      const value = new Date(dt);
      const offset = value.getTimezoneOffset();
      dt = new Date(value.getTime() + offset * 60 * 1000);
    }
    return dt;
  }

  static dateToUTC(dt) {
    if (dt instanceof Date) {
      const offset = new Date().getTimezoneOffset();
      return new Date(dt.getTime() - offset * 60 * 1000);
    }
    return dt;
  }

  static formatDatetimeQuery(value) {
    return value.map(dt => {
      if (dt instanceof Date) {
        return dt.toISOString();
      }
      else if (dt) {
        return dt;
      }
      else {
        return '..';
      }
    }).join('/');
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

  static getPaginationLinks(data) {
    let pages = {};
    if (Utils.isObject(data)) {
      let pageLinks = Utils.getLinksWithRels(data.links, stacPagination);
      for (let pageLink of pageLinks) {
        let rel = pageLink.rel === 'previous' ? 'prev' : pageLink.rel;
        pages[rel] = pageLink;
      }
    }
    return pages;
  }

  static addFiltersToLink(link, filters = {}, itemsPerPage = null) {
    let isEmpty = value => {
      return (value === null
      || (typeof value === 'number' && !Number.isFinite(value))
      || (typeof value === 'string' && value.length === 0)
      || (typeof value === 'object' && Utils.size(value) === 0));
    };

    if (!Utils.isObject(filters)) {
      filters = {};
    }
    else {
      filters = Object.assign({}, filters);
    }

    if (typeof filters.limit !== 'number' && typeof itemsPerPage === 'number') {
      filters.limit = itemsPerPage;
    }

    if (Utils.hasText(link.method) && link.method.toUpperCase() === 'POST') {
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

  static canBrowserDisplayImage(img) {
    if (typeof img.href !== 'string') {
      return false;
    }
    let uri = URI(img.href);
    let protocol = uri.protocol().toLowerCase();
    if (protocol && !browserProtocols.includes(protocol)) {
      return false;
    }
    else if (browserImageTypes.includes(img.type)) {
      return true;
    }
    else if (browserImageTypes.includes('image/' + uri.suffix().toLowerCase())) {
      return true;
    }
    else if (img.type) {
      return false;
    }
    else {
      return true; // If no img.type is given, try to load it anyway: https://github.com/radiantearth/stac-browser/issues/147
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
    if (Utils.isObject(target)) {
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

  static createLink(href, rel) {
    return { href, rel };
  }

  static supportsExtension(data, pattern) {
    if (!Utils.isObject(data) || !Array.isArray(data['stac_extensions'])) {
      return false;
    }
    let regexp = new RegExp('^' + pattern.replaceAll('*', '[^/]+') + '$');
    return Boolean(data['stac_extensions'].find(uri => regexp.test(uri)));
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

    if (Utils.isObject(target) && Utils.isObject(source)) {
      for (const key in source) {
        if (Utils.isObject(source[key])) {
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

}
