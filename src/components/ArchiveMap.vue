<template>
  <div class="archive-map-root">
    <div ref="mapContainer" id="wyvern-map"></div>

    <div id="projection-toggle" @click="toggleProjection">
      {{ projectionButtonLabel }}
    </div>

    <div id="upload-card">
      <h3>Search Polygon</h3>
      <input type="file" ref="fileInput" @change="onFileChange" accept=".geojson,.json,.kml,.zip,.shp" />
      <p class="upload-note">Supported: GeoJSON, KML, Shapefile (.zip)</p>
    </div>

    <div id="visible-ids" v-show="isDesktop">
      <h3>Images On Map</h3>
      <div id="ids-list">
        <div
          v-for="f in visibleFeatures"
          :key="f.properties.id"
          class="id-item"
          :data-id="f.properties.id"
          @mouseenter="highlightFeature(f.properties.id)"
          @mouseleave="clearHighlight()"
          @click="focusFeature(f.properties.id)"
        >
          <div class="id-name">{{ f.properties.name }}</div>
          <div class="id-code">{{ f.properties.id }}</div>
        </div>
      </div>
    </div>

    <transition name="fade">
      <div v-if="loading" class="loading-overlay">
        <div class="spinner"></div>
      </div>
    </transition>
  </div>
</template>

<script>
import mapboxgl from 'mapbox-gl';
import "mapbox-gl/dist/mapbox-gl.css";
import * as turf from '@turf/turf';
import shp from 'shpjs';
import { kml } from '@tmcw/togeojson';

export default {
  name: 'ArchiveMap',
  props: {
    accessToken: {
      type: String,
      default: 'pk.eyJ1Ijoid3l2ZXJuZGV2ZWxvcGVycyIsImEiOiJjbWU4cG92dnQwaTNwMmpwd3B3NXJ0bGR2In0.KxjqgZ71F8GOzLUJS8XZmg'
    },
    geojsonUrl: {
      type: String,
      default: 'https://wyvern-prod-public-open-data-program.s3.ca-central-1.amazonaws.com/wyvern_open_data.geojson'
    }
  },
  data() {
    return {
      allData: null,
      hoveredId: null,
      listHoverId: null,
      selectedId: null,
      currentPopup: null,
      visibleFeatures: [],
      loading: true,
      isGlobe: true
    };
  },
  computed: {
    isDesktop() {
      return typeof window !== 'undefined' && window.innerWidth >= 800;
    },
    projectionButtonLabel() {
      return this.isGlobe ? '🗺️ Map' : '🌎 Globe';
    }
  },
  mounted() {
    this.initMap();
    document.addEventListener('visibilitychange', this.handleVis);
  },
  beforeUnmount() {
    document.removeEventListener('visibilitychange', this.handleVis);
    if (this.map) this.map.remove();
  },
  methods: {
    handleResize() { this.$forceUpdate(); },
      handleVis() {
      if (!document.hidden) this.resizeMap();
    },
    resizeMap() {
      if (this.map) {
        this.map.resize();
        // Force a tiny bearing change and revert (hacky but works)
        const b = this.map.getBearing();
        this.map.setBearing(b + 0.01);
        this.map.setBearing(b);
      }
    },
    initMap() {
      mapboxgl.accessToken = this.accessToken;
      this.map = new mapboxgl.Map({
        container: 'wyvern-map',
        style: 'mapbox://styles/mapbox/light-v11',
        center: [-113.495, 53.546],
        zoom: 3,
        projection: 'globe'
      });

      this.map.on('load', () => {
        fetch(this.geojsonUrl)
          .then(r => r.json())
          .then(data => {
            this.allData = data; // properties.id guaranteed
            this.addBaseLayers(data);
            this.addEventHandlers();
            this.updateVisibleIDs();
            this.loading = false;
          })
          .catch(err => {
            console.error('GeoJSON load error:', err);
            this.loading = false;
          });
      });

      this.map.on('error', e => console.error('Mapbox error event:', e.error));
    },

    addBaseLayers(data) {
      this.map.addSource('polygons', { type: 'geojson', data, promoteId: 'id' });

      const firstType = data.features?.[0]?.geometry?.type;
      const isPoly = firstType === 'Polygon' || firstType === 'MultiPolygon';

      if (isPoly) {
        this.map.addLayer({
          id: 'polygon-layer',
          type: 'fill',
          source: 'polygons',
          paint: {
            'fill-color': [
              'case',
              ['boolean', ['feature-state', 'selected'], false], '#ff9900',
              ['boolean', ['feature-state', 'hover'], false], '#ff9900',
              '#3b26f9'
            ],
            'fill-opacity': [
              'case',
              ['boolean', ['feature-state', 'selected'], false], 0.6,
              ['boolean', ['feature-state', 'hover'], false], 0.6,
              0.5
            ]
          }
        });
        this.map.addLayer({
          id: 'polygon-outline',
          type: 'line',
          source: 'polygons',
          paint: { 'line-color': '#000', 'line-width': 2 }
        });
      } else {
        this.map.addLayer({
          id: 'polygon-layer',
          type: 'circle',
          source: 'polygons',
          paint: {
            'circle-radius': 4,
            'circle-color': [
              'case',
              ['boolean', ['feature-state', 'selected'], false], '#ff9900',
              ['boolean', ['feature-state', 'hover'], false], '#ff9900',
              '#3b26f9'
            ],
            'circle-opacity': [
              'case',
              ['boolean', ['feature-state', 'selected'], false], 0.7,
              ['boolean', ['feature-state', 'hover'], false], 0.7,
              0.5
            ]
          }
        });
      }
    },

    addEventHandlers() {
      if (this.map.getLayer('polygon-layer')) {
        this.map.on('mousemove', 'polygon-layer', e => {
          if (!e.features.length) return;
          const fid = e.features[0].properties.id;
          if (!fid) return;
          if (this.hoveredId && this.hoveredId !== fid && this.hoveredId !== this.selectedId) {
            this.map.setFeatureState({ source: 'polygons', id: this.hoveredId }, { hover: false });
          }
          this.hoveredId = fid;
          if (fid !== this.selectedId) {
            this.map.setFeatureState({ source: 'polygons', id: fid }, { hover: true });
          }
        });

        this.map.on('mouseleave', 'polygon-layer', () => {
          if (this.hoveredId && this.hoveredId !== this.selectedId) {
            this.map.setFeatureState({ source: 'polygons', id: this.hoveredId }, { hover: false });
          }
          this.hoveredId = null;
        });

        this.map.on('click', 'polygon-layer', e => {
          if (!e.features[0]) return;
          this.selectFeature(e.features[0]);
        });
      }

      this.map.on('moveend', () => this.updateVisibleIDs());
    },

    selectFeature(feature) {
      const fid = feature.properties.id;
      if (!fid) return;
      if (this.selectedId && this.selectedId !== fid) {
        this.map.setFeatureState({ source: 'polygons', id: this.selectedId }, { selected: false });
      }
      this.selectedId = fid;
      this.map.setFeatureState({ source: 'polygons', id: fid }, { selected: true, hover: false });
      this.openPopup(feature);
    },

    openPopup(feature) {
      const props = feature.properties || {};
      const fid = props.id;
      const name = props.name || fid;
      const satellite = props.satellite || 'Unknown';

      if (this.currentPopup) this.currentPopup.remove();

      let centroid;
      try {
        centroid = turf.centroid(feature).geometry.coordinates;
      } catch {
        if (feature.geometry.type === 'Point') centroid = feature.geometry.coordinates;
        else centroid = [0,0];
      }

      // Button now triggers internal navigation via emitted event
      const html = `
        <div class="wyv-popup" data-id="${fid}">
          <div class="wyv-popup-header">
            <div class="wyv-popup-title" title="${name}">${name}</div>
          </div>
          <div class="wyv-popup-meta">
            <span class="wyv-badge" title="Satellite">${satellite}</span>
            <span class="wyv-id" title="ID">${fid}</span>
          </div>
          <div class="wyv-popup-divider"></div>
          <div class="wyv-popup-actions">
            <button class="wyv-btn wyv-open-stac" data-fid="${fid}">
              View in STAC Browser
            </button>
          </div>
        </div>
      `;

      this.currentPopup = new mapboxgl.Popup({
        closeButton: true,
        closeOnClick: false,
        maxWidth: '340px'
      })
        .setLngLat(centroid)
        .setHTML(html)
        .addTo(this.map);

      // Attach click handler to emitted event
      const btn = this.currentPopup.getElement().querySelector('.wyv-open-stac');
      if (btn) {
        btn.addEventListener('click', (ev) => {
          ev.preventDefault();
            ev.stopPropagation();
          const targetId = btn.getAttribute('data-fid');
          if (targetId) {
            this.$emit('open-stac', targetId);
          }
        });
      }
    },

    updateVisibleIDs() {
      if (!this.map.getLayer('polygon-layer')) return;
      const feats = this.map.queryRenderedFeatures({ layers: ['polygon-layer'] });
      const uniq = [];
      const seen = new Set();
      feats.forEach(f => {
        const id = f.properties.id;
        if (!seen.has(id)) {
          seen.add(id);
          uniq.push(f);
        }
      });
      this.visibleFeatures = uniq;
    },

    highlightFeature(id) {
      if (!this.map || !this.map.getSource('polygons')) return;
      if (id === this.selectedId) return;
      if (this.listHoverId && this.listHoverId !== this.selectedId) {
        this.map.setFeatureState({ source: 'polygons', id: this.listHoverId }, { hover: false });
      }
      this.listHoverId = id;
      if (id !== this.selectedId) {
        this.map.setFeatureState({ source: 'polygons', id }, { hover: true });
      }
    },

    clearHighlight() {
      if (this.listHoverId && this.listHoverId !== this.selectedId) {
        this.map.setFeatureState({ source: 'polygons', id: this.listHoverId }, { hover: false });
      }
      this.listHoverId = null;
    },

    focusFeature(id) {
      if (!this.allData) return;
      const f = this.allData.features.find(x => x.properties && x.properties.id === id);
      if (!f) return;

      if (this.selectedId && this.selectedId !== id) {
        this.map.setFeatureState({ source: 'polygons', id: this.selectedId }, { selected: false });
      }
      this.selectedId = id;
      this.map.setFeatureState({ source: 'polygons', id }, { selected: true, hover: false });

      this.openPopup(f);

      const b = new mapboxgl.LngLatBounds();
      const add = c => Array.isArray(c[0]) ? c.forEach(add) : b.extend(c);
      try {
        add(f.geometry.coordinates);
        this.map.fitBounds(b, { padding: 60 });
      } catch { /* ignore */ }
    },

    toggleProjection() {
      if (this.map.getProjection().name === 'globe') {
        this.map.setProjection('mercator');
        this.isGlobe = false;
      } else {
        this.map.setProjection('globe');
        this.isGlobe = true;
      }
    },

    async onFileChange(e) {
      const file = e.target.files[0];
      if (!file) return;
      const ext = file.name.split('.').pop().toLowerCase();
      let geojson;

      try {
        if (ext === 'geojson' || ext === 'json') {
          geojson = JSON.parse(await file.text());
        } else if (ext === 'kml') {
          const text = await file.text();
          const dom = new DOMParser().parseFromString(text, 'application/xml');
          geojson = kml(dom);
        } else if (ext === 'zip' || ext === 'shp') {
          const buf = await file.arrayBuffer();
          geojson = await shp(buf);
        } else {
          alert('Unsupported file type.');
          return;
        }
      } catch (err) {
        console.error('Upload parse error:', err);
        alert('Could not parse file.');
        return;
      }

      if (!geojson || !geojson.features || !geojson.features.length) {
        alert('No valid features found.');
        return;
      }

      geojson.features.forEach((f, i) => {
        if (!f.properties) f.properties = {};
        if (!f.properties.id) f.properties.id = f.id || `upload_${i}`;
      });

      if (this.map.getSource('upload')) {
        this.map.getSource('upload').setData(geojson);
      } else {
        this.map.addSource('upload', { type: 'geojson', data: geojson });
        this.map.addLayer({
          id: 'upload-fill',
          type: 'fill',
          source: 'upload',
          paint: { 'fill-color': '#00aa51', 'fill-opacity': 0.35 }
        }, 'polygon-layer');
        this.map.addLayer({
          id: 'upload-outline',
          type: 'line',
          source: 'upload',
          paint: { 'line-color': '#00833d', 'line-width': 2 }
        }, 'polygon-layer');
      }

      const bounds = new mapboxgl.LngLatBounds();
      const add = c => Array.isArray(c[0]) ? c.forEach(add) : bounds.extend(c);
      geojson.features.forEach(f => {
        try { add(f.geometry.coordinates); } catch {}
      });
      if (!bounds.isEmpty()) {
        this.map.fitBounds(bounds, { padding: 60 });
      }

      if (this.allData) {
        const bufferPoly = turf.buffer(geojson, 10, { units: 'kilometers' });
        const ids = this.allData.features
          .filter(f => {
            try { return turf.booleanIntersects(f, bufferPoly); } catch { return false; }
          })
          .map(f => f.properties.id);

        if (this.selectedId) {
          this.map.setFeatureState({ source: 'polygons', id: this.selectedId }, { selected: false });
          this.selectedId = null;
        }
        ids.forEach(id => {
          this.map.setFeatureState({ source: 'polygons', id }, { selected: true });
        });
      }
    },

    openExternal(url) {
      window.open(url, '_blank', 'noopener');
    }
  }
};
</script>

<style>
:root {
  --wyv-accent: #3b26f9;
  --wyv-accent-hover: #301fd0;
  --wyv-accent-soft: #f4f4ff;
  --wyv-text: #000;
  --wyv-text-soft: #333;
  --wyv-border: #eee;
  --wyv-radius-sm: 4px;
  --wyv-radius: 8px;
  --wyv-radius-lg: 12px;
  --wyv-shadow: 0 4px 18px rgba(24,73,163,0.15), 0 2px 6px rgba(0,0,0,0.08);
  --wyv-shadow-popup: 0 10px 28px -6px rgba(59,38,249,0.25), 0 2px 10px rgba(0,0,0,0.08);
}

.archive-map-root {
  position: relative;
  width: 100%;
  height: 100%;
  font-family: "Roboto", sans-serif;
}

#wyvern-map {
  position: absolute;
  top: 0; bottom: 0; left: 0; right: 0;
}

#projection-toggle {
  position: absolute;
  top: 20px;
  right: 20px;
  z-index: 30;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 6px rgba(0,0,0,0.2);
  padding: 8px 12px;
  cursor: pointer;
  font-size: 0.9em;
  font-weight: 500;
  color: #3b26f9;
  border: 1px solid #ddd;
  user-select: none;
}
#projection-toggle:hover { background: #f4f4ff; }

#upload-card {
  position: absolute;
  top: 20px;
  left: 20px;
  z-index: 40;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.15);
  padding: 14px 16px;
  border: 1px solid #eee;
  min-width: 220px;
  max-width: 280px;
  font-size: 0.9em;
}

@media (max-width: 800px)  {
  #upload-card {
    visibility: hidden;
  }
}

#upload-card h3 {
  margin: 0 0 10px;
  font-size: 1em;
  font-weight: 500;
  color: #000;
}
#upload-card input[type="file"] {
  width: 100%;
  font-size: 0.85em;
  border: 1px solid #ddd;
  border-radius: 6px;
  padding: 6px;
  cursor: pointer;
}
#upload-card input[type="file"]::-webkit-file-upload-button {
  background: #3b26f9;
  color: #fff;
  border: none;
  border-radius: 6px;
  padding: 6px 12px;
  margin-right: 8px;
  cursor: pointer;
  font-size: 0.85em;
}
#upload-card input[type="file"]::-webkit-file-upload-button:hover {
  background: #301fd0;
}
.upload-note {
  font-size: 0.75em;
  color: #555;
  margin-top: 8px;
}

#logo-container {
  position: absolute;
  top: 32px;
  left: 32px;
  z-index: 20;
  display: flex;
  flex-direction: column;
  align-items: center;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.13);
  padding: 18px 40px 14px 40px;
  border: 1px solid #eee;
  min-width: 180px;
  max-width: 300px;
}
#logo-container:hover {
  background: rgb(251, 251, 251);
  box-shadow: 0 4px 18px rgba(24,73,163,0.15);
}
#center-logo {
  width: 200px;
  object-fit: contain;
  cursor: pointer;
  display: block;
  margin-bottom: 8px;
}
#center-logo-text {
  font-size: 1.25em;
  font-weight: 500;
  color: #000;
  text-align: center;
  letter-spacing: 0.5px;
  margin: 0;
  user-select: none;
}
#center-logo-text-small {
  font-size: 0.85em;
  font-weight: 400;
  color: #000;
  text-align: center;
  letter-spacing: 0.5px;
  margin-top: 1em;
  user-select: none;
}

#visible-ids {
  position: absolute;
  bottom: 40px;
  right: 30px;
  z-index: 20;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.15);
  padding: 10px 14px;
  font-size: 0.85em;
  border: 1px solid #eee;
  max-width: 350px;
  max-height: 360px;
  overflow: hidden;
}
#visible-ids h3 {
  margin: 0 0 6px;
  font-size: 1em;
  font-weight: 500;
}
#ids-list {
  max-height: 300px;
  overflow-y: auto;
}
.id-item {
  padding: 6px 0;
  border-bottom: 1px solid #ddd;
  cursor: pointer;
}
.id-item:last-child { border-bottom: none; }
.id-item:hover { background: #f4f4ff; }
.id-name {
  font-weight: 500;
  font-size: 0.95em;
  color: #000;
}
.id-code {
  font-size: 0.8em;
  color: #555;
}

/* Scrollbar styling */
#ids-list::-webkit-scrollbar { width: 8px; }
#ids-list::-webkit-scrollbar-track {
  background: #f4f4ff;
  border-radius: 4px;
}
#ids-list::-webkit-scrollbar-thumb {
  background-color: #3b26f9;
  border-radius: 4px;
}
#ids-list::-webkit-scrollbar-thumb:hover {
  background-color: #301fd0;
}

@media (max-width: 800px) {
  #visible-ids { display: none; }
}
@media (max-width: 600px) {
  #logo-container {
    min-width: 120px;
    padding: 12px 20px 10px 20px;
  }
  #center-logo {
    height: 54px;
    width: 54px;
  }
  #center-logo-text {
    font-size: 1em;
  }
}

/* Popup styling */
:deep(.mapboxgl-popup-content) {
  font-family: "Roboto", sans-serif;
  border-radius: 8px;
  padding: 12px 14px;
  border: 1px solid #eee;
}
.popup-title {
  font-size: 1.1em;
  font-weight: 500;
  margin-bottom: 4px;
  color: #000;
}
.popup-info {
  font-size: 0.9em;
  margin-bottom: 8px;
  color: #333;
}
.popup-btn {
  background: #3b26f9;
  color: #fff;
  border: none;
  padding: 6px 10px;
  border-radius: 4px;
  font-size: 0.9em;
  cursor: pointer;
}
.popup-btn:hover {
  background: #301fd0;
}

.loading-overlay {
  position: absolute;
  inset: 0;
  backdrop-filter: blur(2px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 200;
}

.spinner {
  width: 56px;
  height: 56px;
  border: 6px solid #e1e1e1;
  border-top-color: #3b26f9;
  border-radius: 50%;
  animation: spin 0.9s linear infinite;
}
@keyframes spin {
  to { transform: rotate(360deg); }
}

.fade-enter-active, .fade-leave-active { transition: opacity 0.25s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

.wyv-popup {
  padding: 14px 16px 16px 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.wyv-popup-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
}

.wyv-popup-title {
  font-size: 1.05em;
  font-weight: 600;
  line-height: 1.25;
  color: var(--wyv-text);
  word-break: break-word;
  overflow-wrap: anywhere;
}

.wyv-popup-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}

.wyv-badge {
  background: linear-gradient(135deg, var(--wyv-accent) 0%, #5e4dff 90%);
  color: #fff;
  font-size: 0.65rem;
  font-weight: 600;
  padding: 4px 8px 3px 8px;
  border-radius: 20px;
  letter-spacing: .5px;
  text-transform: uppercase;
  box-shadow: 0 2px 4px rgba(59,38,249,0.35);
}

.wyv-id {
  font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace;
  font-size: 0.65rem;
  background: #f9f9fb;
  border: 1px solid #e2e2f5;
  padding: 4px 6px 3px 6px;
  border-radius: var(--wyv-radius-sm);
  color: #444;
  letter-spacing: .5px;
}

.wyv-popup-divider {
  height: 1px;
  width: 100%;
  background: linear-gradient(to right, rgba(59,38,249,0.25), rgba(59,38,249,0.05));
  border-radius: 1px;
}

.wyv-popup-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.wyv-btn {
  appearance: none;
  border: none;
  background: var(--wyv-accent);
  color: #fff;
  font-size: 0.75rem;
  font-weight: 500;
  letter-spacing: .4px;
  padding: 8px 14px;
  border-radius: var(--wyv-radius-sm);
  cursor: pointer;
  line-height: 1.15;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  box-shadow: 0 2px 4px rgba(59,38,249,0.3);
  transition: background .18s, transform .18s, box-shadow .18s;
}
.wyv-btn:hover {
  background: var(--wyv-accent-hover);
  transform: translateY(-1px);
  box-shadow: 0 4px 10px -2px rgba(59,38,249,0.4);
}
.wyv-btn:active {
  transform: translateY(0);
  box-shadow: 0 2px 6px rgba(59,38,249,0.35);
}
.wyv-btn:focus-visible {
  outline: 2px solid var(--wyv-accent);
  outline-offset: 2px;
}
</style>