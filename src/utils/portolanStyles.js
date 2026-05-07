import { toAbsolute } from 'stac-js/src/http.js';

export function resolveStyles(stac) {
  const styleEntries = stac.properties?.['portolan:styles']
    || stac['portolan:styles']
    || [];

  if (!Array.isArray(styleEntries) || styleEntries.length === 0) return [];

  const baseUrl = stac.getAbsoluteUrl?.() || '';

  return styleEntries
    .map(entry => {
      if (typeof entry === 'string') {
        const asset = stac.assets?.[entry];
        if (!asset) return null;
        return {
          name: entry,
          title: asset.title || entry.replace('styles/', ''),
          href: asset.getAbsoluteUrl?.() || toAbsolute(asset.href, baseUrl),
        };
      }

      if (entry && typeof entry === 'object' && entry.href) {
        const matchingAsset = stac.assets?.[`styles/${entry.name}`];
        return {
          name: entry.name || entry.href,
          title: matchingAsset?.title || entry.name || entry.href,
          href: toAbsolute(entry.href, baseUrl),
        };
      }

      return null;
    })
    .filter(Boolean);
}

export async function loadStyleJson(href) {
  const response = await fetch(href);
  if (!response.ok) {
    throw new Error(`Failed to fetch style: ${response.status} ${href}`);
  }
  const data = await response.json();
  if (!data || data.version !== 8) {
    throw new Error(`Invalid Mapbox GL style (version !== 8) at ${href}`);
  }
  return data;
}
