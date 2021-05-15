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

    static getLinksWithRel(links, rel) {
        if (Array.isArray(links)) {
            return links.filter(link => Utils.isObject(link) && typeof link.href === 'string' && link.rel === rel);
        }
        return [];
    }

	static resolveUrl(base, path) {
		let url = new URL(path, base);
		return url.toString();
	}

	static buildUrl() {

	}

}