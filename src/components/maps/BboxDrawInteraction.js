export default class BboxDrawInteraction {
  constructor(map, onExtentChanged) {
    this.map = map;
    this.onExtentChanged = onExtentChanged;
    this._drawing = false;
    this._startPoint = null;
    this._sourceId = 'bbox-draw-source';
    this._fillLayerId = 'bbox-draw-fill';
    this._lineLayerId = 'bbox-draw-line';

    this._onMouseDown = this._onMouseDown.bind(this);
    this._onMouseMove = this._onMouseMove.bind(this);
    this._onMouseUp = this._onMouseUp.bind(this);

    this._addSource();
    this._attachEvents();
  }

  _addSource() {
    if (this.map.getSource(this._sourceId)) return;
    this.map.addSource(this._sourceId, {
      type: 'geojson',
      data: { type: 'FeatureCollection', features: [] },
    });
    this.map.addLayer({
      id: this._fillLayerId,
      type: 'fill',
      source: this._sourceId,
      paint: { 'fill-color': '#4163cc', 'fill-opacity': 0.2 },
    });
    this.map.addLayer({
      id: this._lineLayerId,
      type: 'line',
      source: this._sourceId,
      paint: { 'line-color': '#4163cc', 'line-width': 2, 'line-dasharray': [2, 2] },
    });
  }

  _attachEvents() {
    const canvas = this.map.getCanvas();
    canvas.addEventListener('mousedown', this._onMouseDown);
    canvas.addEventListener('mousemove', this._onMouseMove);
    canvas.addEventListener('mouseup', this._onMouseUp);
  }

  _onMouseDown(e) {
    if (!e.shiftKey) return;
    e.preventDefault();
    this._drawing = true;
    this._startPoint = { x: e.offsetX, y: e.offsetY };
    this.map.dragPan.disable();
  }

  _onMouseMove(e) {
    if (!this._drawing || !this._startPoint) return;
    const current = { x: e.offsetX, y: e.offsetY };
    this._updateRect(this._startPoint, current);
  }

  _onMouseUp(e) {
    if (!this._drawing || !this._startPoint) return;
    this._drawing = false;
    const end = { x: e.offsetX, y: e.offsetY };
    this.map.dragPan.enable();

    const sw = this.map.unproject([
      Math.min(this._startPoint.x, end.x),
      Math.max(this._startPoint.y, end.y),
    ]);
    const ne = this.map.unproject([
      Math.max(this._startPoint.x, end.x),
      Math.min(this._startPoint.y, end.y),
    ]);

    if (Math.abs(end.x - this._startPoint.x) < 5 && Math.abs(end.y - this._startPoint.y) < 5) {
      this._startPoint = null;
      return;
    }

    this._startPoint = null;
    const extent = [sw.lng, sw.lat, ne.lng, ne.lat];
    this.onExtentChanged(extent);
  }

  _updateRect(start, end) {
    const corners = [
      this.map.unproject([Math.min(start.x, end.x), Math.min(start.y, end.y)]),
      this.map.unproject([Math.max(start.x, end.x), Math.min(start.y, end.y)]),
      this.map.unproject([Math.max(start.x, end.x), Math.max(start.y, end.y)]),
      this.map.unproject([Math.min(start.x, end.x), Math.max(start.y, end.y)]),
    ];

    const coords = corners.map(c => [c.lng, c.lat]);
    coords.push(coords[0]);

    const source = this.map.getSource(this._sourceId);
    if (source) {
      source.setData({
        type: 'Feature',
        geometry: { type: 'Polygon', coordinates: [coords] },
        properties: {},
      });
    }
  }

  setExtent(extent) {
    const source = this.map.getSource(this._sourceId);
    if (!source) return;

    if (!extent) {
      source.setData({ type: 'FeatureCollection', features: [] });
      return;
    }

    const [w, s, e, n] = extent;
    source.setData({
      type: 'Feature',
      geometry: {
        type: 'Polygon',
        coordinates: [[[w, s], [e, s], [e, n], [w, n], [w, s]]],
      },
      properties: {},
    });
  }

  destroy() {
    const canvas = this.map.getCanvas();
    canvas.removeEventListener('mousedown', this._onMouseDown);
    canvas.removeEventListener('mousemove', this._onMouseMove);
    canvas.removeEventListener('mouseup', this._onMouseUp);

    if (this.map.getLayer(this._lineLayerId)) this.map.removeLayer(this._lineLayerId);
    if (this.map.getLayer(this._fillLayerId)) this.map.removeLayer(this._fillLayerId);
    if (this.map.getSource(this._sourceId)) this.map.removeSource(this._sourceId);
  }
}
