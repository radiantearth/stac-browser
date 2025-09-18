import axios from "axios";
import Utils from "../utils";

export class Loading {

  constructor(show = false) {
    this.show = Boolean(show);
  }

}

export function stacRequestOptions(cx, link) {
  // Convert a URL string to a Link Object
  if (typeof link === 'string') {
    link = {
      href: link
    };
  }
  // Return if the link is not an object or doesn't contain an href
  if (!Utils.isObject(link) || typeof link.href !== 'string') {
    return {};
  }

  // Generate URL including query strings
  const url = cx.getters.getRequestUrl(link.href);

  // Combine headers
  let headers = {
    'Accept-Language': cx.getters.acceptedLanguages
  };
  if (Utils.hasText(link.type)) {
    headers.Accept = link.type;
  }
  if (!cx.getters.isExternalUrl(url)) {
    Object.assign(headers, cx.state.requestHeaders);
  }
  if (Utils.isObject(link.headers)) {
    Object.assign(headers, link.headers);
  }

  // Combine all options for axios request
  return {
    method: typeof link.method === 'string' ? link.method.toLowerCase() : 'get',
    url,
    headers,
    data: link.body
    // ToDo: Support for merge property from STAC API
  };
}

export async function stacRequest(cx, link, axiosOptions = {}) {
  // Get options
  const options = stacRequestOptions(cx, link);
  // Execute the request
  return await axios(Object.assign(options, axiosOptions));
}

export function processSTAC(state, stac) {
  if (typeof state.preprocessSTAC === 'function') {
    stac = state.preprocessSTAC(stac, state);
  }
  return Object.freeze(stac);
}

export function isAuthenticationError(error) {
  return [401, 403].includes(error?.response?.status);
}

export function addQueryIfNotExists(uri, query) {
  if (Utils.size(query) == 0) {
    return uri;
  }
  for (let key in query) {
    if (!uri.hasQuery(key)) {
      uri.addQuery(key, query[key]);
    }
  }
  return uri;
}

/**
 * Checks whether a given URI is in the authority of a given pattern.
 * 
 * Pattern can be one of the following:
 * - A regular expression that will be tested against the normalized absolute URL.
 * - A domain (e.g. `example.com`) -> It will match example.com and any subdomains (case insensitive).
 * - A subdomain (e.g. stac.example.com) -> It will match stac.example.com and any subdomains (case insensitive).
 * 
 * Domain and subdomain patterns ignore schema, userinfo, port, path, query and fragment.
 * 
 * @param {RegExp|string} pattern The pattern to check against.
 * @param {URI} uri The absolute URI object.
 * @returns {boolean} true if the URI is in the authority of the pattern, false otherwise.
 */
export function hasAuthority(pattern, uri) {
  if (pattern instanceof RegExp) {
    return pattern.test(uri.normalize().toString());
  }
  else if (typeof pattern !== 'string') {
    return false;
  }
  else if (uri.domain().toLowerCase() === pattern.toLowerCase()) {
    return true;
  }
  else {
    pattern = new RegExp('(^|\\.)' + RegExp.escape(pattern) + '$', 'i');
    return pattern.test(uri.hostname());
  }
}
