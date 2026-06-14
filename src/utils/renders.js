// Support for the STAC `render` extension on raster (COG) assets.
//
// The portolan-browser renders COGs directly with deck.gl (no tile server), so a
// raster "style" is a colormap + rescale + nodata applied to a band — exactly the
// render extension's fields. `renders` is a map of named render objects, each with a
// `title` and an `assets` list, so it natively supports multiple pickable styles.
//
// We colormap on the CPU in a custom COGLayer `getTileData` (band -> ImageData),
// which is robust and avoids GPU shader wiring. See portolan-cli#521.

/** Built-in colormaps as [t(0..1), [r,g,b]] stops. */
const COLORMAPS = {
  // FTW inference-app confidence ramp (RdYlGn, weighted toward the top like the app).
  rdylgn: [
    [0.0, [215, 25, 28]],
    [0.7, [254, 195, 121]],
    [0.8, [243, 250, 187]],
    [0.9, [207, 236, 176]],
    [1.0, [51, 160, 44]],
  ],
  // FTW field-density ramp: magenta (low) -> green (high).
  ftw_density: [
    [0.0, [255, 0, 238]],
    [1.0, [0, 255, 0]],
  ],
  viridis: [
    [0.0, [68, 1, 84]], [0.25, [59, 82, 139]], [0.5, [33, 145, 140]],
    [0.75, [94, 201, 98]], [1.0, [253, 231, 37]],
  ],
  magma: [
    [0.0, [0, 0, 4]], [0.25, [81, 18, 124]], [0.5, [183, 55, 121]],
    [0.75, [252, 137, 97]], [1.0, [252, 253, 191]],
  ],
  ylgn: [
    [0.0, [255, 255, 229]], [0.5, [120, 198, 121]], [1.0, [0, 104, 55]],
  ],
};

/** Read `renders` from a STAC Item or Collection (top-level per the render extension). */
export function resolveRenders(stac) {
  const renders = stac?.renders || stac?.properties?.renders || {};
  return renders && typeof renders === 'object' ? renders : {};
}

// A colormap is well-formed when every stop is [t:number, [r, g, b, ...]] with a
// color array of at least three channels. Catalog-supplied colormaps are
// untrusted, so a malformed one must fall back to a built-in rather than produce
// NaN channels (which silently clamp to black).
function isValidStops(stops) {
  return Array.isArray(stops) && stops.length > 0 && stops.every(s =>
    Array.isArray(s) && typeof s[0] === 'number' && Array.isArray(s[1]) && s[1].length >= 3
    && s[1].slice(0, 3).every(c => typeof c === 'number'));
}

/** Build a 256x RGBA lookup table (Uint8ClampedArray) from a render definition. */
function buildLut(render) {
  let stops = COLORMAPS[render.colormap_name];
  // Allow an explicit linear-gradient colormap: [[t,[r,g,b(,a)]], ...]
  if (!stops && isValidStops(render.colormap)) {
    stops = render.colormap;
  }
  if (!stops) {stops = COLORMAPS.viridis;}

  const lut = new Uint8ClampedArray(256 * 4);
  for (let i = 0; i < 256; i++) {
    const t = i / 255;
    let lo = stops[0], hi = stops[stops.length - 1];
    for (let s = 0; s < stops.length - 1; s++) {
      if (t >= stops[s][0] && t <= stops[s + 1][0]) { lo = stops[s]; hi = stops[s + 1]; break; }
    }
    const span = (hi[0] - lo[0]) || 1;
    const f = (t - lo[0]) / span;
    lut[i * 4] = Math.round(lo[1][0] + (hi[1][0] - lo[1][0]) * f);
    lut[i * 4 + 1] = Math.round(lo[1][1] + (hi[1][1] - lo[1][1]) * f);
    lut[i * 4 + 2] = Math.round(lo[1][2] + (hi[1][2] - lo[1][2]) * f);
    lut[i * 4 + 3] = 255;
  }
  return lut;
}

/**
 * Build COGLayer `getTileData`/`renderTile` callbacks that colormap a single band
 * on the CPU into an ImageData, per a STAC render definition.
 */
// The CPU colormap loop runs on the main thread (only tile *decode* is offloaded
// to the decoder worker), so cap the per-tile pixel budget. Normal COG internal
// tiles are 256–1024px square; anything past ~2048² (or an untiled/striped COG
// returning a giant block) would freeze the UI or OOM the tab, so we skip it
// (renders transparent) rather than trust the tile dimensions from the file.
const MAX_TILE_PIXELS = 2048 * 2048;
// A render's nodata list is untrusted; a real one has a handful of sentinels.
// Cap it so a hostile/garbage array can't build a huge Set.
const MAX_NODATA_VALUES = 256;

export function makeRenderTileLoader(render) {
  const lut = buildLut(render);
  const [min, max] = (render.rescale && render.rescale[0]) || [0, 1];
  const span = (max - min) || 1;
  const band = ((render.bidx && render.bidx[0]) || 1) - 1; // 1-based -> 0-based
  // nodata may be a single value or an array (e.g. a display asset that should
  // drop both "empty" (0) and its physical no-data sentinel).
  const nodataSet = new Set(
    (Array.isArray(render.nodata) ? render.nodata : [render.nodata])
      .filter(v => v != null)
      .slice(0, MAX_NODATA_VALUES));

  // deck.gl-geotiff 0.7 COGLayer callbacks. The default GPU pipeline only supports
  // unsigned-integer COGs, so for float (and to apply a colormap) we read the tile
  // ourselves and CPU-colormap a single band into an ImageData, returned via the
  // RenderTileResult `image` field (which accepts any TextureSource).
  const getTileData = async (image, { x, y, signal }) => {
    const tile = await image.fetchTile(x, y, { boundless: false, signal });
    const arr = tile.array;
    const { data, width: w, height: h } = arr;
    if (arr.layout === 'band-separate') {
      throw new Error('band-separate COGs are not supported by the render colormap loader');
    }
    const npix = w * h;
    // Guard against degenerate or pathologically large tiles before allocating
    // or looping (see MAX_TILE_PIXELS) — render nothing rather than freeze.
    if (!(w > 0) || !(h > 0) || npix > MAX_TILE_PIXELS) {
      if (npix > MAX_TILE_PIXELS) {
        console.warn(`COG tile ${w}x${h} exceeds the colormap budget; skipping`);
      }
      return null;
    }
    const stride = Math.max(1, Math.round(data.length / npix)); // samples per pixel (interleaved)
    const out = new Uint8ClampedArray(npix * 4);
    for (let i = 0; i < npix; i++) {
      const v = data[i * stride + band];
      if (nodataSet.has(v) || Number.isNaN(v)) { continue; } // alpha stays 0
      let t = (v - min) / span;
      t = t < 0 ? 0 : t > 1 ? 1 : t;
      const idx = (t * 255 + 0.5 | 0) * 4;
      out[i * 4] = lut[idx];
      out[i * 4 + 1] = lut[idx + 1];
      out[i * 4 + 2] = lut[idx + 2];
      out[i * 4 + 3] = lut[idx + 3];
    }
    return { colorImage: new ImageData(out, w, h), width: w, height: h, byteLength: out.byteLength };
  };

  const renderTile = (data) => (data ? { image: data.colorImage } : null);
  return { getTileData, renderTile };
}
