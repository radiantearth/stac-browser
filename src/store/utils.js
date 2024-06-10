import axios from "axios";
import URI from "urijs";
import Utils from "../utils";

export class Loading {

  constructor(show = false, loadApi = false) {
    this.show = Boolean(show);
    this.loadApi = Boolean(loadApi);
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


export function unproxyUrl(absoluteUrl, proxy) {
  if (absoluteUrl instanceof URI) {
    absoluteUrl = absoluteUrl.toString();
  }
  if (typeof absoluteUrl === 'string' && Array.isArray(proxy)) {
    return absoluteUrl.replace(proxy[1], proxy[0]);
  }
  return absoluteUrl;
}

export function proxyUrl(absoluteUrl, proxy) {
  if (absoluteUrl instanceof URI) {
    absoluteUrl = absoluteUrl.toString();
  }
  if (typeof absoluteUrl === 'string' && Array.isArray(proxy)) {
    return absoluteUrl.replace(proxy[0], proxy[1]);
  }
  return absoluteUrl;
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
