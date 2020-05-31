const STAC_PROXY_URL =
  process.env.STAC_PROXY_URL;

export async function fetchUri(uri) {
  // If we are proxying a STAC Catalog, replace any URI with the proxied address.
  // STACC_PROXY_URL has the form https://thingtoproxy.com|http://proxy:111
  const proxiedUri = !!STAC_PROXY_URL ? (
    uri.replace(STAC_PROXY_URL.split('|')[0], STAC_PROXY_URL.split('|')[1])
  ) : uri;
  return fetch(proxiedUri);
};
