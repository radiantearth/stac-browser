export const CATALOG_URL =
  process.env.CATALOG_URL ||
  "";

export const STAC_VERSION =
  process.env.STAC_VERSION ||
  "0.7.0";

export const TILE_SOURCE_TEMPLATE =
  process.env.TILE_SOURCE_TEMPLATE ||
  "https://tiles.rdnt.io/tiles/{z}/{x}/{y}@2x?url={ASSET_HREF}";

export const STAC_PROXY_URL =
  process.env.STAC_PROXY_URL;

export const TILE_PROXY_URL =
  process.env.TILE_PROXY_URL