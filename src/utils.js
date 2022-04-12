import URI from 'urijs';

const commonFileNames = ['catalog', 'collection', 'item'];

const stacMediaTypes = [
	'application/json',
	'application/geo+json',
	'text/json'
];

const browserImageTypes = [
	'gif',
	'jpg',
	'jpeg',
	'png',
	'webp'
];

const browserMediaTypeRegexp = new RegExp(`^image/(${browserImageTypes.join('|')})`, 'i');

const browserProtocols = [
	'http',
	'https'
];

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

	static addFiltersToLink(link, filters = {}) {
		// Construct new link with search params
		let newLink = Object.assign({}, link);
		let url = new URI(newLink.href);
		for(let key in filters) {
			let value = filters[key];
			if (value) {
				if (key === 'datetime') {
					value = value.map(dt => {
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
				else if (key === 'bbox') {
					if (typeof value.toBBoxString === 'function') {
						value = value.toBBoxString();
					}
					else {
						value = value.join(',');
					}
				}
				else if (key === 'collections' || key === 'ids') {
					if (Array.isArray(value) && value.length > 0) {
						value = value.join(',');
					}
					else {
						continue;
					}
				}
				url.setQuery(key, value);
			}
			else {
				url.removeQuery(key);
			}
		}
		newLink.href = url.toString();
		return newLink;
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
		else if (browserMediaTypeRegexp.test(img.type)) {
			return true;
		}
		else if (browserImageTypes.includes(uri.suffix().toLowerCase())) {
			return true;
		}
		else if (img.type) {
			return false;
		}
		else {
			return true; // If no img.type is given, try to load it anyway: https://github.com/radiantearth/stac-browser/issues/147
		}
	}

}