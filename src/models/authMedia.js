import { size } from 'stac-js/src/utils.js';

/**
 * Loads media (e.g. images) through an authenticated request when needed.
 *
 * Plain media elements such as `<img>` can't send the HTTP headers that
 * header-based authentication methods (API key in header, HTTP Basic, OIDC)
 * require. For those, the media is requested through the regular
 * (authenticated) request pipeline and exposed as an object URL instead.
 *
 * Object URLs are cached per source URL and reference-counted so that
 * repeated usage (e.g. the same icon in a list of cards) only requests
 * the media once and the object URL is revoked once no user is left.
 *
 * The cache key deliberately doesn't include the credentials: for the same
 * user, the media bytes don't change when a token rotates (e.g. OIDC
 * renewal), failed requests are never cached, and on logout the consumers
 * fall back to plain URLs and release their references, which drains the
 * cache before other credentials can be entered.
 */

const cache = new Map();

/**
 * Whether the given URL must be loaded through an authenticated request
 * to receive the credentials (i.e. request headers are configured and the
 * URL is part of the catalog).
 *
 * Query-parameter based credentials don't need this, they are part of the
 * URL returned by the `getRequestUrl` getter.
 *
 * @param {Object} store The Vuex store.
 * @param {string} url The absolute URL of the media.
 * @returns {boolean} `true` if an authenticated request is needed.
 */
export function needsAuthenticatedFetch(store, url) {
  return size(store.state.requestHeaders) > 0 && !store.getters.isExternalUrl(url);
}

/**
 * Releases a usage of the object URL for the given URL, revoking it once
 * it is no longer used.
 *
 * @param {Object} store The Vuex store.
 * @param {string} url The absolute URL of the media that was acquired.
 */
export function release(store, url) {
  const entry = cache.get(url);
  if (!entry) {
    return;
  }
  entry.refs--;
  if (entry.refs <= 0) {
    cache.delete(url);
    if (entry.objectUrl) {
      URL.revokeObjectURL(entry.objectUrl);
    }
  }
}

/**
 * Requests the given URL with the configured credentials and returns an
 * object URL for the response.
 *
 * Every successful call must be paired with a `release` call for the same
 * URL. Failed requests are not cached, but do NOT trigger the login dialog
 * (a page full of protected images must not open a login dialog per image).
 *
 * @param {Object} store The Vuex store.
 * @param {string} url The absolute URL of the media.
 * @returns {Promise<string>} The object URL for the media.
 */
export async function acquire(store, url) {
  let entry = cache.get(url);
  if (!entry) {
    entry = {
      refs: 0,
      objectUrl: null,
      promise: store
        .dispatch('request', {
          link: url,
          axiosOptions: { responseType: 'blob' },
          noRetry: true
        })
        .then(response => {
          entry.objectUrl = URL.createObjectURL(response.data);
          return entry.objectUrl;
        })
    };
    cache.set(url, entry);
  }
  entry.refs++;
  try {
    return await entry.promise;
  } catch (error) {
    release(store, url);
    throw error;
  }
}
