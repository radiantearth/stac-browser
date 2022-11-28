import axios from "axios";
import Utils from "../utils";

export class Loading {
  
  constructor(show = false, loadApi = false) {
    this.show = Boolean(show);
    this.loadApi = Boolean(loadApi);
  }

}

export async function stacRequest(cx, link) {
  let opts;
  if (Utils.isObject(link)) {
    let method = typeof link.method === 'string' ? link.method.toLowerCase() : 'get';
    opts = {
      method,
      url: cx.getters.getRequestUrl(link.href),
      headers: Object.assign({}, cx.state.requestHeaders, link.headers),
      data: link.body
      // ToDo: Support for merge property from STAC API
    };
  }
  else if (typeof link === 'string') {
    opts = {
      method: 'get',
      url: cx.getters.getRequestUrl(link),
      headers: cx.state.requestHeaders
    };
  }
  else {
    opts = link;
  }
  return await axios(opts);
}

export function processSTAC(state, stac) {
  if (typeof state.preprocessSTAC === 'function') {
    stac = state.preprocessSTAC(stac, state);
  }
  return Object.freeze(stac);
}

export function isAuthenticationError(error) {
  return [401,403].includes(error?.response?.status);
}

export function addQueryIfNotExists(uri, query) {
  if (Utils.size(query) == 0) {
    return uri;
  }
  for(let key in query) {
    if (!uri.hasQuery(key)) {
      uri.addQuery(key, query[key]);
    }
  }
  return uri;
}