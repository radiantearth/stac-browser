import { STACReference } from 'stac-js';
import { PMTiles } from 'pmtiles';

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

let deckOverlay = null;

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
    this._pmtilesLayerIds = [];
    this._pmtilesSourceIds = [];
  }

  setStac(stac) {
    this.stac = stac;
    this._clearLayers();

    if (!stac) return;

    const geojson = stac.toGeoJSON();
    if (!geojson) return;

    let featureCollection;
    if (geojson.type === 'FeatureCollection') {
      featureCollection = geojson;
    } else if (geojson.type === 'Feature') {
      featureCollection = { type: 'FeatureCollection', features: [geojson] };
    } else {
      featureCollection = { type: 'FeatureCollection', features: [{ type: 'Feature', geometry: geojson, properties: {} }] };
    }

    featureCollection.features = featureCollection.features.filter(f => f.geometry);
    if (featureCollection.features.length === 0) return;

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

    this._autoLoadVisualAssets(stac);
  }

  _autoLoadVisualAssets(stac) {
    if (!stac || typeof stac.getAssets !== 'function') return;
    const assets = stac.getAssets();
    const visualAssets = assets.filter(asset => {
      const type = asset.type || '';
      const href = asset.href || asset.getAbsoluteUrl?.() || '';
      if (PMTILES_MIME_TYPES.some(mt => type.includes(mt)) || href.endsWith('.pmtiles')) return true;
      return false;
    });
    if (visualAssets.length > 0) {
      this.setAssets(visualAssets);
    }
  }

  setChildren(children) {
    this.children = children;
    this._removeLayersById([CHILDREN_FILL_LAYER, CHILDREN_LINE_LAYER, CHILDREN_POINT_LAYER]);
    this._removeSourceById(CHILDREN_SOURCE);

    if (!children) return;

    const geojson = children.toGeoJSON();
    if (!geojson) return;

    const featureCollection = geojson.type === 'FeatureCollection'
      ? geojson
      : { type: 'FeatureCollection', features: [geojson] };

    const items = children.isItemCollection
      ? children.features
      : children.collections;

    for (let i = 0; i < featureCollection.features.length; i++) {
      const feature = featureCollection.features[i];
      if (!feature.properties) feature.properties = {};
      feature.properties._stacIndex = i;
      const item = items?.[i];
      if (item) {
        feature.properties._stacId = item.id;
        feature.properties._stacTitle = item.getMetadata?.('title') || item.id;
      }
    }

    featureCollection.features = featureCollection.features.filter(f => f.geometry);
    if (featureCollection.features.length === 0) return;

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

    if (!assets || assets.length === 0) return;

    await this._addPmtilesAssets(assets);
    await this._addCogAssets(assets);
  }

  async _addPmtilesAssets(assets) {
    const pmtilesAssets = assets.filter(asset => {
      const type = asset.type || '';
      const href = asset.href || asset.getAbsoluteUrl?.() || '';
      return PMTILES_MIME_TYPES.some(mt => type.includes(mt)) || href.endsWith('.pmtiles');
    });

    for (let i = 0; i < pmtilesAssets.length; i++) {
      const asset = pmtilesAssets[i];
      const url = asset.getAbsoluteUrl?.() || asset.href;
      const sourceId = `stac-pmtiles-${i}`;

      try {
        const pm = new PMTiles(url);
        const header = await pm.getHeader();

        if (header.tileType === 1) {
          await this._addVectorPmtiles(pm, url, sourceId);
        } else {
          this._addRasterPmtiles(url, sourceId);
        }
      } catch (err) {
        console.warn(`Failed to add PMTiles asset ${url}`, err);
      }
    }
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

    if (layerNames.length === 0) {
      layerNames = ['default'];
    }

    const colors = ['#4163cc', '#cc6341', '#41cc63', '#cc41a8', '#ccb341'];

    for (let j = 0; j < layerNames.length; j++) {
      const sourceLayer = layerNames[j];
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

    if (cogAssets.length === 0) return;

    try {
      const [{ MapboxOverlay }, { COGLayer }] = await Promise.all([
        import('@deck.gl/mapbox'),
        import('@developmentseed/deck.gl-geotiff'),
      ]);

      const layers = cogAssets.map((asset, i) => {
        const url = asset.getAbsoluteUrl?.() || asset.href;
        return new COGLayer({
          id: `stac-cog-${i}`,
          geotiff: url,
        });
      });

      if (deckOverlay) {
        this.map.removeControl(deckOverlay);
      }

      deckOverlay = new MapboxOverlay({ layers });
      this.map.addControl(deckOverlay);
      this._cogLayers = layers;
    } catch (err) {
      console.warn('Failed to load COG layers via deck.gl', err);
    }
  }

  fit(padding = 50) {
    if (!this.stac || !this.map) return;
    const bbox = this.stac.getBoundingBox();
    if (!bbox || bbox.length < 4) return;
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

  setFootprintVisible(visible) {
    const val = visible ? 'visible' : 'none';
    for (const id of this.getFootprintLayerIds()) {
      if (this.map.getLayer(id)) {
        this.map.setLayoutProperty(id, 'visibility', val);
      }
    }
  }

  getVisibleStacReferences() {
    if (!this.children) return [];
    const items = this.children.isItemCollection
      ? this.children.features
      : this.children.collections;
    if (!items) return [];
    return items.filter(item => item instanceof STACReference);
  }

  remove() {
    this._clearLayers();
    this._removeCogLayers();
    this._removePmtilesLayers();
  }

  readdAfterStyleChange() {
    const { stac, children, assets } = this;
    this.layerIds = [];
    this.sourceIds = [];
    this._pmtilesLayerIds = [];
    this._pmtilesSourceIds = [];
    if (stac) this.setStac(stac);
    if (children) this.setChildren(children);
    if (assets) this.setAssets(assets);
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
    if (!this.sourceIds.includes(id)) this.sourceIds.push(id);
  }

  _addLayer(spec) {
    if (this.map.getLayer(spec.id)) {
      this.map.removeLayer(spec.id);
    }
    this.map.addLayer(spec);
    if (!this.layerIds.includes(spec.id)) this.layerIds.push(spec.id);
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
    if (deckOverlay && this.map) {
      try { this.map.removeControl(deckOverlay); } catch { /* already removed */ }
      deckOverlay = null;
    }
    this._cogLayers = [];
  }

  _removePmtilesLayers() {
    for (const id of [...this._pmtilesLayerIds]) {
      try { if (this.map.getLayer(id)) this.map.removeLayer(id); } catch { /* ignore */ }
    }
    for (const id of [...this._pmtilesSourceIds]) {
      try { if (this.map.getSource(id)) this.map.removeSource(id); } catch { /* ignore */ }
    }
    this._pmtilesLayerIds = [];
    this._pmtilesSourceIds = [];
  }
}
