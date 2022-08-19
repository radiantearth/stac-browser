import URI from 'urijs';
import Queryable from './models/queryable';

export const commonFileNames = ['catalog', 'collection', 'item'];

export const geojsonMediaType = "application/geo+json";

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

export const geotiffMediaTypes = [
  "application/geotiff",
  "image/tiff; application=geotiff",
  "image/tiff; application=geotiff; profile=cloud-optimized",
  "image/vnd.stac.geotiff",
  "image/vnd.stac.geotiff; cloud-optimized=true"
];

export const browserProtocols = [
	'http',
	'https'
];

export const imageMediaTypes = browserImageTypes.concat(geotiffMediaTypes);
export const mapMediaTypes = imageMediaTypes.concat([geojsonMediaType]);

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
		if (allowEmpty && !type) {
			return true;
		}
		else if (typeof type !== 'string') {
			return false;
		}
		else {
			return stacMediaTypes.includes(type.toLowerCase());
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

	static urlType(url, type) {
		let uri = URI(url);
		return uri.is(type);
	}

	static isGdalVfsUri(url) {
		return typeof url === 'string' && url.startsWith('/vsi') && !url.startsWith('/vsicurl/');
	}

	static toAbsolute(href, baseUrl, stringify = true) {
		// Convert vsicurl URLs to normal URLs
		if (typeof href === 'string' && href.startsWith('/vsicurl/')) {
			href = href.replace(/^\/vsicurl\//, '');
		}
		// Parse URL and make absolute, if required
		let uri = URI(href);
		if (uri.is("relative") && !Utils.isGdalVfsUri(href)) { // Don't convert GDAL VFS URIs: https://github.com/radiantearth/stac-browser/issues/116
			// Avoid that baseUrls that have a . in the last parth part will be removed (e.g. https://example.com/api/v1.0 )
			if (!baseUrl.endsWith('/') && !baseUrl.endsWith('.json')) {
				baseUrl += '/';
			}
			uri = uri.absoluteTo(baseUrl);
		}
		return stringify ? uri.toString() : uri;
	}

	static getLinkWithRel(links, rel) {
		return Array.isArray(links) ? links.find(link => Utils.isObject(link) && typeof link.href === 'string' && link.rel === rel) : null;
	}

	static getLinksWithRels(links, rels) {
			return Array.isArray(links) ? links.filter(link => Utils.isObject(link) && typeof link.href === 'string' && rels.includes(link.rel)) : [];
	}

	static getLinksWithOtherRels(links, rels) {
			return Array.isArray(links) ? links.filter(link => Utils.isObject(link) && typeof link.href === 'string' && !rels.includes(link.rel)) : [];
	}

	static equalUrl(a, b) {
		try {
			let uri1 = URI(a);
			let uri2 = URI(b);
			// Ignore trailing slash in URL paths
			uri1.path(uri1.path().replace(/\/$/, ''));
			uri2.path(uri2.path().replace(/\/$/, ''));
			return uri1.equals(uri2);
		} catch(error) {
			return false;
		}
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

	static formatBboxQuery(value) {
		if (typeof value.toBBoxString === 'function') {
			// This is a Leaflet LatLngBounds Object
			const Y = 85.06;
			const X = 180;
			value = [
				Math.max(value.getWest(), -X),
				Math.max(value.getSouth(), -Y),
				Math.min(value.getEast(), X),
				Math.min(value.getNorth(), Y)
			];
		}
		return value.join(',');
	}

	static addFiltersToLink(link, filters = {}) {
		// Construct new link with search params
		let url = new URI(link.href);

		for (let key in filters) {
			let value = filters[key];
			if (
				value === null
				|| (typeof value === 'number' && !Number.isFinite(value))
				|| (typeof value === 'string' && value.length === 0)
				|| (typeof value === 'object' && Utils.size(value) === 0)
			) {
					url.removeQuery(key);
					continue;
			}

			if (key === 'datetime') {
				value = Utils.formatDatetimeQuery(value);
			}
			else if (key === 'bbox') {
				value = Utils.formatBboxQuery(value);
			}
			else if ((key === 'collections' || key === 'ids') && Array.isArray(value)) {
				value = value.join(',');
			}
			else if (key === 'filters') {
				let params = Queryable.formatText(value);
				url.setQuery(params);
				continue;
			}

			url.setQuery(key, value);
		}

		return Object.assign({}, link, {href: url.toString()});
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
				return `${file} at ${auth}`;
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
		let uri = new URI(img.href);
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
	static getValueFromObjectUsingPath (object, path) {
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

}