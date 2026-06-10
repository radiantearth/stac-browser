import { toAbsolute } from 'stac-js/src/http.js';

export function resolveStyles(stac) {
  const styleEntries = stac.properties?.['portolan:styles']
    || stac['portolan:styles']
    || [];

  if (!Array.isArray(styleEntries) || styleEntries.length === 0) {return [];}

  const baseUrl = stac.getAbsoluteUrl?.() || '';

  const styles = styleEntries
    .map(entry => {
      if (typeof entry === 'string') {
        const asset = stac.assets?.[entry];
        if (!asset) {return null;}
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

  if (styles.length > 1) {
    const titles = styles.map(s => s.title);
    const prefix = commonPrefix(titles);
    if (prefix.length > 0) {
      for (const s of styles) {
        s.title = s.title.slice(prefix.length);
      }
    }
  }

  return styles;
}

function commonPrefix(strings) {
  if (strings.length === 0) {return '';}
  let prefix = strings[0];
  for (let i = 1; i < strings.length; i++) {
    while (!strings[i].startsWith(prefix)) {
      prefix = prefix.slice(0, -1);
      if (prefix.length === 0) {return '';}
    }
  }
  // Trim to last separator (space, dash, colon) so we don't cut mid-word
  const lastSep = Math.max(prefix.lastIndexOf(' '), prefix.lastIndexOf('—'), prefix.lastIndexOf('-'), prefix.lastIndexOf(':'));
  if (lastSep > 0) {prefix = prefix.slice(0, lastSep + 1);}
  else {prefix = '';}
  return prefix;
}

export function extractLegend(glStyle) {
  if (!glStyle?.layers) {return [];}

  const fillLayer = glStyle.layers.find(l => l.type === 'fill');
  if (!fillLayer) {return [];}

  const fillColor = fillLayer.paint?.['fill-color'];
  if (!fillColor || typeof fillColor === 'string') {return [];}
  if (!Array.isArray(fillColor)) {return [];}

  const type = fillColor[0];

  if (type === 'step') {
    // ["step", ["get", field], defaultColor, stop1, color1, stop2, color2, ...]
    const items = [];
    const defaultColor = fillColor[2];
    const stops = fillColor.slice(3);
    items.push({ color: defaultColor, label: `< ${stops[0]}` });
    for (let i = 0; i < stops.length; i += 2) {
      const value = stops[i];
      const color = stops[i + 1];
      const nextValue = stops[i + 2];
      items.push({
        color,
        label: nextValue != null ? `${value}–${nextValue}` : `${value}+`,
      });
    }
    return items;
  }

  if (type === 'match') {
    // ["match", ["get", field], val1, color1, val2, color2, ..., fallback]
    const items = [];
    const pairs = fillColor.slice(2, -1);
    for (let i = 0; i < pairs.length; i += 2) {
      items.push({ color: pairs[i + 1], label: String(pairs[i]) });
    }
    return items;
  }

  return [];
}

export async function loadStyleJson(href) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);
  let response;
  try {
    response = await fetch(href, { signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
  if (!response.ok) {
    throw new Error(`Failed to fetch style: ${response.status} ${href}`);
  }
  const data = await response.json();
  if (!data || data.version !== 8) {
    throw new Error(`Invalid Mapbox GL style (version !== 8) at ${href}`);
  }
  return data;
}
