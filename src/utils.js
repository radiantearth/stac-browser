import URI from 'urijs';

const commonFileNames = ['catalog', 'collection', 'item'];

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

	static toAbsolute(href, baseUrl, stringify = true) {
		let uri = URI(href);
		if (uri.is("relative")) {
			uri = uri.absoluteTo(baseUrl);
		}
		return stringify ? uri.toString() : uri;
	}

	static stacLinkToAxiosRequest(link) {
		let method = typeof link.method === 'string' ? link.method.toLowerCase() : 'get'
		return {
			method,
			url: link.href,
			headers: link.headers,
			data: link.body
			// ToDo: Support for merge property from STAC API
		};
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
		let uri1 = URI(a);
		let uri2 = URI(b);
		// Ignore trailing slash in URL paths
		uri1.path(uri1.path().replace(/\/$/, ''));
		uri2.path(uri2.path().replace(/\/$/, ''));
		return uri1.equals(uri2);
	}

	static titleForHref(href) {
		let uri = URI(href);
		let auth = uri.authority();
		let file = uri.filename().replace(/^(.{1,})\.\w+$/, '$1');
		let dir = uri.directory().replace(/^\//, '');
		if (auth && file) {
			return `${file} at ${auth}`;
		}
		else if (auth) {
			return auth;
		}
		else if (file && !commonFileNames.includes(file)) {
			return file;
		}
		else if (dir) {
			return dir;
		}
		else {
			return href;
		}
	}

	static canBrowserDisplayImage(mediaType) {
		if (typeof mediaType !== 'string') {
			return false;
		}
		switch(mediaType.toLowerCase()) {
			case 'image/png':
			case 'image/jpg':
			case 'image/jpeg':
			case 'image/webp':
			case 'image/gif':
				return true;
			default:
				return false;
		}
	}

}