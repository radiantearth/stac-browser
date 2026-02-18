import axios from "axios";
import Utils from "../utils";
import i18n from '../i18n';
import { usePageStore } from './page';
import { useConfigStore } from './config';

export class Loading {

  constructor(show = false) {
    this.show = Boolean(show);
  }

}

/**
 * Build request options for a STAC request.
 * Accepts either a store-like context (for backward compat with schema-org, Search, etc.)
 * or uses the Pinia stores directly.
 * @param {Object|null} cx - legacy store context or null
 * @param {string|Object} link - URL string or link object
 */
export function stacRequestOptions(cx, link) {
  // Convert a URL string to a Link Object
  if (typeof link === 'string') {
    link = {
      href: link
    };
  }
  if (!Utils.isObject(link) || typeof link.href !== 'string') {
    return {};
  }

  const pageStore = usePageStore();
  const config = useConfigStore();

  // Generate URL including query strings
  const url = pageStore.getRequestUrl(link.href);

  // Combine headers
  let headers = {
    'Accept-Language': pageStore.acceptedLanguages
  };
  if (Utils.hasText(link.type)) {
    headers.Accept = link.type;
  }
  if (!pageStore.isExternalUrl(url)) {
    Object.assign(headers, config.requestHeaders);
  }
  if (Utils.isObject(link.headers)) {
    Object.assign(headers, link.headers);
  }

  return {
    method: typeof link.method === 'string' ? link.method.toLowerCase() : 'get',
    url,
    headers,
    data: link.body
  };
}

/**
 * Execute a STAC HTTP request
 * @param {Object|null} cx - legacy store context (unused, kept for backward compat)
 * @param {string|Object} link - URL string or link object
 * @param {Object} axiosOptions - additional axios options
 */
export async function stacRequest(cx, link, axiosOptions = {}) {
  const options = stacRequestOptions(cx, link);
  return await axios(Object.assign(options, axiosOptions));
}

export function processSTAC(config, stac) {
  if (typeof config.preprocessSTAC === 'function') {
    stac = config.preprocessSTAC(stac, config);
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

export function getErrorMessage(error) {
  if (error instanceof Error) {
    if (error.isAxiosError) {
      const res = error.response;
      if (error.response) {
        if (res.status === 401) {
          return i18n.global.t('errors.unauthorized');
        } else if (res.status === 403) {
          return i18n.global.t('errors.authFailed');
        } else if (res.status === 404) {
          return i18n.global.t('errors.notFound');
        } else if (Utils.isObject(res.data) && Utils.hasText(res.data.description)) {
          return res.data.description;
        } else if (Utils.hasText(res.data)) {
          return res.data;
        } else if (res.status >= 500 && res.status < 600) {
          return i18n.global.t('errors.serverError');
        } else if (res.status >= 400 && res.status < 500) {
          return i18n.global.t('errors.badRequest');
        }
      }
      else if (error.code === 'ERR_NETWORK') {
        return i18n.global.t('errors.networkError');
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
