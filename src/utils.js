import URI from 'urijs';

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

	static toAbsolute(href, baseUrl, stringify = true) {
		let uri = URI(href).absoluteTo(baseUrl);
		return stringify ? uri.toString() : uri;
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