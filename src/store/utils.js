import axios from "axios";
import URI from "urijs";
import Utils from "../utils";

export class Loading {

  constructor(show = false, loadApi = false) {
    this.show = Boolean(show);
    this.loadApi = Boolean(loadApi);
  }

}

export async function stacRequest(cx, link) {
  let opts;
  let headers = {
    'Accept-Language': cx.getters.acceptedLanguages
  };
  if (Utils.isObject(link)) {
    let method = typeof link.method === 'string' ? link.method.toLowerCase() : 'get';
    let url = cx.getters.getRequestUrl(link.href);
    if (Utils.hasText(link.type)) {
      headers.Accept = link.type;
    }
    if (!cx.getters.isExternalUrl(url)) {
      Object.assign(headers, cx.state.requestHeaders);
    }
    if (Utils.isObject(link.headers)) {
      Object.assign(headers, link.headers);
    }
    opts = {
      method,
      url,
      headers,
      data: link.body
      // ToDo: Support for merge property from STAC API
    };
  }
  else if (typeof link === 'string') {
    let url = cx.getters.getRequestUrl(link);
    if (!cx.getters.isExternalUrl(url)) {
      Object.assign(headers, cx.state.requestHeaders);
    }
    opts = {
      method: 'get',
      url,
      headers
    };
  }
  else {
    opts = link;
  }
  return await axios(opts);
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