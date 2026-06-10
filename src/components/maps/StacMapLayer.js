import { STACReference } from 'stac-js';
import { PMTiles, SharedPromiseCache } from 'pmtiles';
import { pmtilesProtocol } from './MapMixin.js';

const sharedCache = new SharedPromiseCache(300);

const STAC_SOURCE = 'stac-footprint';
const STAC_FILL_LAYER = 'stac-footprint-fill';
const STAC_LINE_LAYER = 'stac-footprint-line';
const CHILDREN_SOURCE = 'stac-children';
const CHILDREN_FILL_LAYER = 'stac-children-fill';
const CHILDREN_LINE_LAYER = 'stac-children-line';
const CHILDREN_POINT_LAYER = 'stac-children-point';

const COG_MIME_TYPES = [
  'image/tiff',
  'image/tiff; application=geotiff',
  'image/tiff; application=geotiff; profile=cloud-optimized',
  'image/vnd.stac.geotiff',
  'application/x-geotiff',
];

const PMTILES_MIME_TYPES = [
  'application/vnd.pmtiles',
];

const MVT_MIME_TYPES = [
  'application/vnd.mapbox-vector-tile',
  'application/x-protobuf',
];

function assetHref(asset) {
  return asset.getAbsoluteUrl?.() || asset.href || '';
}

// Normalize a PMTiles source URL for comparison. Strips the `pmtiles://`
// prefix and resolves relative URLs to absolute so that a style source URL
// can be matched against a loaded source's URL regardless of form.
function normalizePmtilesUrl(url) {
  if (typeof url !== 'string' || url === '') {return null;}
  let u = url.startsWith('pmtiles://') ? url.slice('pmtiles://'.length) : url;
  try {
    u = new URL(u, typeof window !== 'undefined' ? window.location.href : undefined).href;
  } catch {
    /* leave as-is if it can't be resolved */
  }
  return u;
}

function isPmtilesAsset(asset) {
  const type = asset.type || '';
  const href = assetHref(asset);
  return PMTILES_MIME_TYPES.some(mt => type.includes(mt)) || href.endsWith('.pmtiles');
}

function isXyzVectorAsset(asset) {
  const type = asset.type || '';
  const href = assetHref(asset);
  if (!href.includes('{z}') || !href.includes('{x}') || !href.includes('{y}')) {return false;}
  return MVT_MIME_TYPES.some(mt => type.includes(mt));
}

function isTileJsonAsset(asset) {
  const type = asset.type || '';
  const roles = Array.isArray(asset.roles) ? asset.roles : [];
  if (!type.startsWith('application/json')) {return false;}
  return roles.includes('tiles');
}

function isTileAsset(asset) {
  return isTileJsonAsset(asset) || isXyzVectorAsset(asset) || isPmtilesAsset(asset);
}

// Prefer TileJSON > XYZ > PMTiles. If a server-rendered tile endpoint exists,
// drop the PMTiles asset so we only load one set of tiles.
function preferredTileAssets(assets) {
  const tilejson = assets.filter(isTileJsonAsset);
  const xyz = assets.filter(isXyzVectorAsset);
  if (tilejson.length > 0 || xyz.length > 0) {
    return [...tilejson, ...xyz];
  }
  return assets.filter(isPmtilesAsset);
}

export default class StacMapLayer {
  constructor(map, options = {}) {
    this.map = map;
    this.options = options;
    this.stac = null;
    this.children = null;
    this.assets = null;
    this.layerIds = [];
    this.sourceIds = [];
    this._cogLayers = [];
    this._cogAssetMeta = [];
    this._deckOverlay = null;
    this._pmtilesLayerIds = [];
    this._pmtilesSourceIds = [];
    this._pmtilesAssetMeta = [];
    this._glStyleLayerIds = [];
    this._glStyleSourceIds = [];
    this._activeGlStyle = null;
  }

  setStac(stac) {
    this.stac = stac;
    this._clearLayers();

    if (!stac) {return;}

    const geojson = stac.toGeoJSON();
    if (!geojson) {return;}

    let featureCollection;
    if (geojson.type === 'FeatureCollection') {
      featureCollection = geojson;
    } else if (geojson.type === 'Feature') {
      featureCollection = { type: 'FeatureCollection', features: [geojson] };
    } else {
      featureCollection = { type: 'FeatureCollection', features: [{ type: 'Feature', geometry: geojson, properties: {} }] };
    }

    featureCollection.features = featureCollection.features.filter(f => f.geometry);
    if (featureCollection.features.length === 0) {return;}

    this._addSource(STAC_SOURCE, { type: 'geojson', data: featureCollection });

    this._addLayer({
      id: STAC_FILL_LAYER,
      type: 'fill',
      source: STAC_SOURCE,
      paint: {
        'fill-color': '#4163cc',
        'fill-opacity': 0.1,
      },
    });

    this._addLayer({
      id: STAC_LINE_LAYER,
      type: 'line',
      source: STAC_SOURCE,
      paint: {
        'line-color': '#4163cc',
        'line-width': 2,
      },
    });

  }

  async autoLoadVisualAssets(stac) {
    if (!stac || typeof stac.getAssets !== 'function') {return;}
    const visualAssets = stac.getAssets().filter(isTileAsset);
    if (visualAssets.length > 0) {
      await this.setAssets(visualAssets);
    }
  }

  setChildren(children) {
    this.children = children;
    this._removeLayersById([CHILDREN_FILL_LAYER, CHILDREN_LINE_LAYER, CHILDREN_POINT_LAYER]);
    this._removeSourceById(CHILDREN_SOURCE);

    if (!children) {return;}

    const geojson = children.toGeoJSON();
    if (!geojson) {return;}

    const featureCollection = geojson.type === 'FeatureCollection'
      ? geojson
      : { type: 'FeatureCollection', features: [geojson] };

    const items = children.isItemCollection
      ? children.features
      : children.collections;

    for (let i = 0; i < featureCollection.features.length; i++) {
      const feature = featureCollection.features[i];
      if (!feature.properties) {feature.properties = {};}
      feature.properties._stacIndex = i;
      const item = items?.[i];
      if (item) {
        feature.properties._stacId = item.id;
        feature.properties._stacTitle = item.getMetadata?.('title') || item.id;
      }
    }

    featureCollection.features = featureCollection.features.filter(f => f.geometry);
    if (featureCollection.features.length === 0) {return;}

    this._addSource(CHILDREN_SOURCE, { type: 'geojson', data: featureCollection });

    this._addLayer({
      id: CHILDREN_FILL_LAYER,
      type: 'fill',
      source: CHILDREN_SOURCE,
      filter: ['==', '$type', 'Polygon'],
      paint: {
        'fill-color': '#4163cc',
        'fill-opacity': 0.15,
      },
    });

    this._addLayer({
      id: CHILDREN_LINE_LAYER,
      type: 'line',
      source: CHILDREN_SOURCE,
      filter: ['any', ['==', '$type', 'Polygon'], ['==', '$type', 'LineString']],
      paint: {
        'line-color': '#4163cc',
        'line-width': 1.5,
      },
    });

    this._addLayer({
      id: CHILDREN_POINT_LAYER,
      type: 'circle',
      source: CHILDREN_SOURCE,
      filter: ['==', '$type', 'Point'],
      paint: {
        'circle-radius': 4,
        'circle-color': '#4163cc',
        'circle-stroke-color': '#fff',
        'circle-stroke-width': 1,
      },
    });
  }

  async setAssets(assets) {
    this.assets = assets;
    this._removeCogLayers();
    this._removePmtilesLayers();

    if (!assets || assets.length === 0) {return;}

    await this._addTileAssets(preferredTileAssets(assets));
    await this._addCogAssets(assets);
  }

  async _addTileAssets(assets) {
    for (let i = 0; i < assets.length; i++) {
      const asset = assets[i];
      const url = assetHref(asset);
      const sourceId = `stac-tile-${i}`;

      this._pmtilesAssetMeta.push({
        title: asset.title || asset.key || `Tiles ${i + 1}`,
        sourceId,
      });

      try {
        if (isTileJsonAsset(asset)) {
          await this._addTileJsonSource(url, sourceId);
        } else if (isXyzVectorAsset(asset)) {
          this._addXyzVectorSource(url, sourceId, asset);
        } else if (isPmtilesAsset(asset)) {
          const pm = new PMTiles(url, sharedCache);
          pmtilesProtocol.add(pm);
          const header = await pm.getHeader();

          if (header.tileType === 1) {
            await this._addVectorPmtiles(pm, url, sourceId);
          } else {
            this._addRasterPmtiles(url, sourceId);
          }
        }
      } catch (err) {
        console.warn(`Failed to add tile asset ${url}`, err);
      }
    }
  }

  async _addTileJsonSource(url, sourceId) {
    this.map.addSource(sourceId, { type: 'vector', url });
    this._pmtilesSourceIds.push(sourceId);

    let layerNames = [];
    try {
      const resp = await fetch(url);
      if (resp.ok) {
        const tj = await resp.json();
        if (Array.isArray(tj.vector_layers)) {
          layerNames = tj.vector_layers.map(l => l.id);
        }
      }
    } catch {
      /* TileJSON metadata may be unavailable; fall back to default layer */
    }

    this._addDefaultVectorLayers(sourceId, layerNames);
  }

  _addXyzVectorSource(url, sourceId, asset) {
    const spec = { type: 'vector', tiles: [url] };
    if (typeof asset.minzoom === 'number') {spec.minzoom = asset.minzoom;}
    if (typeof asset.maxzoom === 'number') {spec.maxzoom = asset.maxzoom;}
    this.map.addSource(sourceId, spec);
    this._pmtilesSourceIds.push(sourceId);

    this._addDefaultVectorLayers(sourceId, []);
  }

  async _addVectorPmtiles(pm, url, sourceId) {
    this.map.addSource(sourceId, {
      type: 'vector',
      url: `pmtiles://${url}`,
    });
    this._pmtilesSourceIds.push(sourceId);

    let layerNames = [];
    try {
      const metadata = await pm.getMetadata();
      if (metadata.vector_layers && metadata.vector_layers.length > 0) {
        layerNames = metadata.vector_layers.map(l => l.id);
      }
    } catch {
      /* metadata may not be available */
    }

    this._addDefaultVectorLayers(sourceId, layerNames);
  }

  _addDefaultVectorLayers(sourceId, layerNames) {
    const names = layerNames.length > 0 ? layerNames : ['default'];
    const colors = ['#4163cc', '#cc6341', '#41cc63', '#cc41a8', '#ccb341'];

    for (let j = 0; j < names.length; j++) {
      const sourceLayer = names[j];
      const color = colors[j % colors.length];
      const fillLayerId = `${sourceId}-${sourceLayer}-fill`;
      const lineLayerId = `${sourceId}-${sourceLayer}-line`;
      const pointLayerId = `${sourceId}-${sourceLayer}-point`;

      this.map.addLayer({
        id: fillLayerId,
        type: 'fill',
        source: sourceId,
        'source-layer': sourceLayer,
        filter: ['==', '$type', 'Polygon'],
        paint: {
          'fill-color': color,
          'fill-opacity': 0.3,
        },
      });
      this._pmtilesLayerIds.push(fillLayerId);

      this.map.addLayer({
        id: lineLayerId,
        type: 'line',
        source: sourceId,
        'source-layer': sourceLayer,
        filter: ['any', ['==', '$type', 'LineString'], ['==', '$type', 'Polygon']],
        paint: {
          'line-color': color,
          'line-width': 1,
        },
      });
      this._pmtilesLayerIds.push(lineLayerId);

      this.map.addLayer({
        id: pointLayerId,
        type: 'circle',
        source: sourceId,
        'source-layer': sourceLayer,
        filter: ['==', '$type', 'Point'],
        paint: {
          'circle-radius': 3,
          'circle-color': color,
          'circle-stroke-color': '#fff',
          'circle-stroke-width': 0.5,
        },
      });
      this._pmtilesLayerIds.push(pointLayerId);
    }
  }

  _addRasterPmtiles(url, sourceId) {
    this.map.addSource(sourceId, {
      type: 'raster',
      url: `pmtiles://${url}`,
      tileSize: 256,
    });
    this._pmtilesSourceIds.push(sourceId);

    const layerId = `${sourceId}-raster`;
    this.map.addLayer({
      id: layerId,
      type: 'raster',
      source: sourceId,
    });
    this._pmtilesLayerIds.push(layerId);
  }

  async _addCogAssets(assets) {
    const cogAssets = assets.filter(asset => {
      const type = asset.type || '';
      return COG_MIME_TYPES.some(mt => type.includes(mt));
    });

    if (cogAssets.length === 0) {return;}

    try {
      const [{ MapboxOverlay }, { COGLayer }] = await Promise.all([
        import('@deck.gl/mapbox'),
        import('@developmentseed/deck.gl-geotiff'),
      ]);

      this._cogAssetMeta = cogAssets.map((asset, i) => ({
        title: asset.title || asset.key || `COG ${i + 1}`,
      }));

      const layers = cogAssets.map((asset, i) => {
        const url = asset.getAbsoluteUrl?.() || asset.href;
        return new COGLayer({
          id: `stac-cog-${i}`,
          geotiff: url,
        });
      });

      if (this._deckOverlay) {
        this.map.removeControl(this._deckOverlay);
      }

      this._deckOverlay = new MapboxOverlay({ layers });
      this.map.addControl(this._deckOverlay);
      this._cogLayers = layers;
    } catch (err) {
      console.warn('Failed to load COG layers via deck.gl', err);
    }
  }

  fit(padding = { top: 160, bottom: 50, left: 50, right: 50 }) {
    if (!this.stac || !this.map) {return;}
    const bbox = this.stac.getBoundingBox();
    if (!bbox || bbox.length < 4) {return;}
    this.map.fitBounds(
      [[bbox[0], bbox[1]], [bbox[2], bbox[3]]],
      { padding, maxZoom: 16 }
    );
  }

  isEmpty() {
    return this.layerIds.length === 0 && this._cogLayers.length === 0 && this._pmtilesLayerIds.length === 0;
  }

  getChildrenLayerIds() {
    return [CHILDREN_FILL_LAYER, CHILDREN_LINE_LAYER, CHILDREN_POINT_LAYER].filter(id =>
      this.layerIds.includes(id)
    );
  }

  getFootprintLayerIds() {
    return [STAC_FILL_LAYER, STAC_LINE_LAYER].filter(id =>
      this.layerIds.includes(id)
    );
  }

  getAllOverlayLayerIds() {
    return [...this.getFootprintLayerIds(), ...this.getChildrenLayerIds(), ...this._pmtilesLayerIds];
  }

  getAssetOverlays() {
    const overlays = [];
    for (let i = 0; i < this._pmtilesAssetMeta.length; i++) {
      const meta = this._pmtilesAssetMeta[i];
      const layerIds = this._pmtilesLayerIds.filter(id => id.startsWith(meta.sourceId));
      if (layerIds.length > 0) {
        const vis = this.map?.getLayoutProperty(layerIds[0], 'visibility');
        overlays.push({
          id: meta.sourceId,
          title: meta.title,
          type: 'maplibre',
          visible: vis !== 'none',
          layerIds,
        });
      }
    }
    for (let i = 0; i < this._cogLayers.length; i++) {
      const meta = this._cogAssetMeta[i] || {};
      overlays.push({
        id: `cog-${i}`,
        title: meta.title || `COG ${i + 1}`,
        type: 'deckgl',
        visible: this._cogLayers[i]?.props?.visible !== false,
        deckIndex: i,
      });
    }
    return overlays;
  }

  setCogVisible(index, visible) {
    if (!this._deckOverlay || index >= this._cogLayers.length) {return;}
    this._cogLayers[index] = this._cogLayers[index].clone({ visible });
    this._deckOverlay.setProps({ layers: [...this._cogLayers] });
  }

  setFootprintVisible(visible) {
    const val = visible ? 'visible' : 'none';
    for (const id of this.getFootprintLayerIds()) {
      if (this.map.getLayer(id)) {
        this.map.setLayoutProperty(id, 'visibility', val);
      }
    }
  }

  getVisibleStacReferences() {
    if (!this.children) {return [];}
    const items = this.children.isItemCollection
      ? this.children.features
      : this.children.collections;
    if (!items) {return [];}
    return items.filter(item => item instanceof STACReference);
  }

  remove() {
    this._clearLayers();
    this._removeCogLayers();
    this._removePmtilesLayers();
  }

  async readdAfterStyleChange() {
    const { stac, children, assets, _activeGlStyle } = this;
    this.layerIds = [];
    this.sourceIds = [];
    this._pmtilesLayerIds = [];
    this._pmtilesSourceIds = [];
    this._glStyleLayerIds = [];
    this._glStyleSourceIds = [];
    if (stac) {this.setStac(stac);}
    if (children) {this.setChildren(children);}
    if (assets) {
      await this.setAssets(assets);
    } else if (stac) {
      await this.autoLoadVisualAssets(stac);
    }
    if (_activeGlStyle) {this.applyGlStyle(_activeGlStyle);}
  }

  _addSource(id, spec) {
    if (this.map.getSource(id)) {
      const style = this.map.getStyle();
      if (style?.layers) {
        for (const layer of style.layers) {
          if (layer.source === id) {
            this.map.removeLayer(layer.id);
          }
        }
      }
      this.map.removeSource(id);
    }
    this.map.addSource(id, spec);
    if (!this.sourceIds.includes(id)) {this.sourceIds.push(id);}
  }

  _addLayer(spec) {
    if (this.map.getLayer(spec.id)) {
      this.map.removeLayer(spec.id);
    }
    this.map.addLayer(spec);
    if (!this.layerIds.includes(spec.id)) {this.layerIds.push(spec.id);}
  }

  _removeLayersById(ids) {
    for (const id of ids) {
      if (this.map.getLayer(id)) {
        this.map.removeLayer(id);
      }
      this.layerIds = this.layerIds.filter(lid => lid !== id);
    }
  }

  _removeSourceById(id) {
    if (this.map.getSource(id)) {
      this.map.removeSource(id);
    }
    this.sourceIds = this.sourceIds.filter(sid => sid !== id);
  }

  _clearLayers() {
    for (const id of [...this.layerIds]) {
      if (this.map.getLayer(id)) {
        this.map.removeLayer(id);
      }
    }
    for (const id of [...this.sourceIds]) {
      if (this.map.getSource(id)) {
        this.map.removeSource(id);
      }
    }
    this.layerIds = [];
    this.sourceIds = [];
  }

  _removeCogLayers() {
    if (this._deckOverlay && this.map) {
      try { this.map.removeControl(this._deckOverlay); } catch { /* already removed */ }
      this._deckOverlay = null;
    }
    this._cogLayers = [];
    this._cogAssetMeta = [];
  }

  _removePmtilesLayers() {
    this._clearPmtilesLayers();
    for (const id of [...this._pmtilesSourceIds]) {
      try { if (this.map.getSource(id)) {this.map.removeSource(id);} } catch { /* ignore */ }
    }
    this._pmtilesSourceIds = [];
    this._pmtilesAssetMeta = [];
  }

  _clearPmtilesLayers() {
    for (const id of [...this._pmtilesLayerIds]) {
      try { if (this.map.getLayer(id)) {this.map.removeLayer(id);} } catch { /* ignore */ }
    }
    this._pmtilesLayerIds = [];
    this._clearGlStyleExtras();
  }

  _clearGlStyleExtras() {
    for (const id of [...this._glStyleLayerIds]) {
      try { if (this.map.getLayer(id)) {this.map.removeLayer(id);} } catch { /* ignore */ }
    }
    this._glStyleLayerIds = [];
    for (const id of [...this._glStyleSourceIds]) {
      try { if (this.map.getSource(id)) {this.map.removeSource(id);} } catch { /* ignore */ }
    }
    this._glStyleSourceIds = [];
  }

  applyGlStyle(glStyle) {
    if (!glStyle || !glStyle.layers) {return;}

    this._clearPmtilesLayers();

    const sources = glStyle.sources || {};
    const styleSourceNames = Object.keys(sources);

    // Add non-PMTiles sources (currently geojson) directly. PMTiles sources
    // in the style are matched positionally to the loaded PMTiles sources.
    const directSourceIds = new Set();
    const pmtilesStyleSourceNames = [];
    for (const name of styleSourceNames) {
      const src = sources[name];
      if (src && src.type === 'geojson') {
        try {
          this.map.addSource(name, src);
          this._glStyleSourceIds.push(name);
          directSourceIds.add(name);
        } catch (err) {
          console.warn(`Failed to add geojson source "${name}" from style`, err);
        }
      } else {
        pmtilesStyleSourceNames.push(name);
      }
    }

    if (pmtilesStyleSourceNames.length > 0 && pmtilesStyleSourceNames.length !== this._pmtilesSourceIds.length) {
      console.warn(`Style defines ${pmtilesStyleSourceNames.length} PMTiles-style source(s) but ${this._pmtilesSourceIds.length} PMTiles source(s) are loaded — mapping by position`);
    }

    // Build a lookup from each loaded PMTiles source's underlying URL to its
    // source ID, so style sources can be matched by URL when they specify one.
    const loadedUrlToSourceId = {};
    for (const sourceId of this._pmtilesSourceIds) {
      const loaded = this.map.getSource(sourceId);
      const norm = normalizePmtilesUrl(loaded && loaded.url);
      if (norm) {loadedUrlToSourceId[norm] = sourceId;}
    }

    // Match style sources to loaded sources by URL first, falling back to
    // positional mapping for sources that don't carry a matching URL. This
    // matters when an item has multiple PMTiles assets and a style references
    // a specific one by its pmtiles:// URL.
    const sourceMapping = {};
    const usedSourceIds = new Set();
    const unmatchedStyleNames = [];
    for (const name of pmtilesStyleSourceNames) {
      const norm = normalizePmtilesUrl(sources[name] && sources[name].url);
      const matched = norm ? loadedUrlToSourceId[norm] : undefined;
      if (matched) {
        sourceMapping[name] = matched;
        usedSourceIds.add(matched);
      } else {
        unmatchedStyleNames.push(name);
      }
    }
    const remainingSourceIds = this._pmtilesSourceIds.filter(id => !usedSourceIds.has(id));
    for (let i = 0; i < unmatchedStyleNames.length; i++) {
      if (i < remainingSourceIds.length) {
        sourceMapping[unmatchedStyleNames[i]] = remainingSourceIds[i];
      }
    }

    for (const layer of glStyle.layers) {
      let layerSpec;
      if (directSourceIds.has(layer.source)) {
        layerSpec = { ...layer };
      } else {
        const mappedSource = sourceMapping[layer.source];
        if (!mappedSource) {continue;}
        layerSpec = { ...layer, source: mappedSource };
      }

      if (this.map.getLayer(layerSpec.id)) {
        this.map.removeLayer(layerSpec.id);
      }
      this.map.addLayer(layerSpec);
      if (directSourceIds.has(layer.source)) {
        this._glStyleLayerIds.push(layerSpec.id);
      } else {
        this._pmtilesLayerIds.push(layerSpec.id);
      }
    }

    this._activeGlStyle = glStyle;
  }

}
