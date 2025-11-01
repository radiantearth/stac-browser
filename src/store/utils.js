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

export function getErrorCode(error) {
  if (error instanceof Error && error.isAxiosError && Utils.isObject(error.response)) {
    const res = error.response;
    if (Utils.isObject(res.data) && res.data.code) {
      return res.data.code;
    }
    else {
      return res.code || res.status;
    }
  }
  return null;
}

export function getErrorMessage(i18n, error) {
  if (error instanceof Error) {
    if (error.isAxiosError) {
      const res = error.response;
      if (error.response) {
        // Get a error message for HTTP codes where it's clear what the issue is
        if (res.status === 401) {
          return i18n.t('errors.unauthorized');
        } else if (res.status === 403) {
          return i18n.t('errors.authFailed');
        } else if (res.status === 404) {
          return i18n.t('errors.notFound');
        } else if (Utils.isObject(res.data) && Utils.hasText(res.data.description)) {
          // Get the error message from the error object as defined for STAC API JSON responses
          return res.data.description;
        } else if (Utils.hasText(res.data)) {
          // Get the error message from the plain text response
          return res.data;
        } else if (res.status >= 500 && res.status < 600) {
          // Return a generic error message for server issues (HTTP 5xx)
          return i18n.t('errors.serverError');
        } else if (res.status >= 400 && res.status < 500) {
          // Return a generic error message for issues that originate in the client request (HTTP 4xx)
          return i18n.t('errors.badRequest');
        }
      }
      else if (error.code === 'ERR_NETWORK') {
        return i18n.t('errors.networkError');
      }
    }
    else if (Utils.hasText(error.message)) {
      return error.message;
    }
  }
  return String(error);
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
