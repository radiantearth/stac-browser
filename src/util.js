import { TILE_SOURCE_TEMPLATE, STAC_PROXY_URL, TILE_PROXY_URL } from './config';

export const getProxiedUri = (uri) => {
  // If we are proxying a STAC Catalog, replace any URI with the proxied address.
  // STAC_PROXY_URL has the form https://thingtoproxy.com|http://proxy:111
  return !!STAC_PROXY_URL ? (
    uri.replace(STAC_PROXY_URL.split('|')[0], STAC_PROXY_URL.split('|')[1])
  ) : uri;
}

export async function fetchUri(uri) {
  const proxiedUri = getProxiedUri(uri);
  return fetch(proxiedUri);
};

const getTileProxiedUri = (uri) => {
  // Tile sources can be proxied differently than other assets, replace any asset HREF with the proxied address.
  // Note: This will occur after the STAC_PROXY_URL is used.
  // TILE_PROXY_URL has the form https://thingtoproxy.com|http://proxy:111
  return !!TILE_PROXY_URL ? (
    uri.replace(TILE_PROXY_URL.split('|')[0], TILE_PROXY_URL.split('|')[1])
  ) : uri;
}

export const getTileSource = (assetHref) => {
  const proxiedUri = getTileProxiedUri(assetHref);
  return TILE_SOURCE_TEMPLATE.replace("{ASSET_HREF}", proxiedUri);
}
