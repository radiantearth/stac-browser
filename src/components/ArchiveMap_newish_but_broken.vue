<template>
  <div class="archive-map-root">
    <div ref="mapContainer" id="wyvern-map"></div>

    <div id="projection-toggle" @click="toggleProjection">
      {{ projectionButtonLabel }}
    </div>

    <div id="upload-card">
      <h3>Upload Polygon</h3>
      <input type="file" ref="fileInput" @change="onFileChange" accept=".geojson,.json,.kml,.zip,.shp" />
      <p class="upload-note">Supported: GeoJSON, KML, Shapefile (.zip)</p>
    </div>

    <div id="logo-container">
      <img
        id="center-logo"
        src="https://knowledge.wyvern.space/images/wyvern_logo_horizontal_tagline.png"
        alt="Wyvern Logo"
        @click="openExternal('https://wyvern.space/')"
      />
      <div id="center-logo-text">Wyvern Image Archive</div>
      <div id="center-logo-text-small">
        Please reach out to our sales team if you are interested in purchasing data or accessing our customer platform &amp; API
        <br/><br/>
        <a href="mailto:orders@wyvern.space">orders@wyvern.space</a>
      </div>
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
// If you want gpx support later: import { kml, gpx } from '@tmcw/togeojson';

export default {
  name: 'ArchiveMap',
  props: {
    accessToken: {
      type: String,
      default: 'pk.eyJ1Ijoid3l2ZXJuZGV2ZWxvcGVycyIsImEiOiJjbHlzdGJwNmkwbGtqMmpxNW1weGk2b3k0In0.EE7ezYVlB6gF_HjFikgcxg'
    },
    geojsonUrl: {
      type: String,
      default: 'https://wyvern-prod-public-open-data-program.s3.ca-central-1.amazonaws.com/wyvern_open_data.geojson'
    }
  },
  data() {
    return {
      allData: null,
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
    window.addEventListener('resize', this.handleResize);
  },
  beforeUnmount() {
    window.removeEventListener('resize', this.handleResize);
    if (this.map) this.map.remove();
  },
  methods: {
    handleResize() { this.$forceUpdate(); },
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
            // Basic debug (remove later)
            console.log('Loaded features:', data.features?.length);
            this.allData = data;
            this.addBaseLayers(data);
            this.addEventHandlers();
            this.updateVisibleIDs();
            this.loading = false;
            window._wyvernMap = this.map;
            window._wyvernData = data;
          })
          .catch(err => {
            console.error('GeoJSON load error:', err);
            this.loading = false;
          });
      });
      this.map.on('error', e => console.error('Mapbox error event:', e.error));
    },
    addBaseLayers(data) {
      // Ensure each feature has both properties.id and root-level id for feature-state
      data.features.forEach((f, i) => {
        const pid = f.properties?.id || f.id || `feat_${i}`;
        if (!f.properties.id) f.properties.id = pid;
        f.id = pid; // Mapbox uses this for feature-state
      });

      this.map.addSource('polygons', {
        type: 'geojson',
        data
      });

      const hasPoly = data.features.some(f => ['Polygon','MultiPolygon'].includes(f.geometry?.type));
      const hasLine = data.features.some(f => ['LineString','MultiLineString'].includes(f.geometry?.type));
      const hasPoint = data.features.some(f => ['Point','MultiPoint'].includes(f.geometry?.type));

      if (hasPoly) {
        this.map.addLayer({
          id: 'polygon-layer',
          type: 'fill',
          source: 'polygons',
          paint: {
            'fill-color': [
              'case',
                ['boolean', ['feature-state', 'selected'], false], '#ff9900',
                ['boolean', ['feature-state', 'hover'], false], '#ffcc33',
                '#3b26f9'
            ],
            'fill-opacity': [
              'case',
                ['boolean', ['feature-state', 'selected'], false], 0.65,
                ['boolean', ['feature-state', 'hover'], false], 0.55,
                0.5
            ]
          }
        });

        this.map.addLayer({
          id: 'polygon-outline',
          type: 'line',
          source: 'polygons',
          paint: {
            'line-color': [
              'case',
                ['boolean', ['feature-state', 'selected'], false], '#ff9900',
                ['boolean', ['feature-state', 'hover'], false], '#ff9900',
                '#000'
            ],
            'line-width': [
              'case',
                ['boolean', ['feature-state', 'selected'], false], 2.2,
                ['boolean', ['feature-state', 'hover'], false], 2,
                1.4
            ]
          }
        });
      }

      if (hasLine) {
        this.map.addLayer({
          id: 'polygon-lines',
          type: 'line',
          source: 'polygons',
          paint: {
            'line-color': [
              'case',
                ['boolean', ['feature-state', 'selected'], false], '#ff9900',
                ['boolean', ['feature-state', 'hover'], false], '#ffcc33',
                '#3b26f9'
            ],
            'line-width': 2
          }
        });
      }

      if (hasPoint) {
        this.map.addLayer({
          id: 'polygon-points',
          type: 'circle',
          source: 'polygons',
          paint: {
            'circle-radius': [
              'case',
                ['boolean', ['feature-state', 'selected'], false], 7,
                ['boolean', ['feature-state', 'hover'], false], 6,
                5
            ],
            'circle-color': [
              'case',
                ['boolean', ['feature-state', 'selected'], false], '#ff9900',
                ['boolean', ['feature-state', 'hover'], false], '#ffcc33',
                '#3b26f9'
            ],
            'circle-opacity': 0.85
          }
        });
      }
    },
    addEventHandlers() {
      const interactionLayers = ['polygon-layer','polygon-lines','polygon-points']
        .filter(id => this.map.getLayer(id));

      interactionLayers.forEach(layerId => {
        // Hover
        this.map.on('mousemove', layerId, e => {
          if (!e.features.length) return;
          const fid = e.features[0].properties.id;
          this.setHover(fid);
        });

        this.map.on('mouseleave', layerId, () => {
          this.setHover(null);
        });

        // Click -> selection + popup
        this.map.on('click', layerId, e => {
          if (!e.features.length) return;
          const f = e.features[0];
          this.setSelected(f.id);
          this.openPopup(f);
        });
      });

      this.map.on('moveend', () => this.updateVisibleIDs());
    },
    setHover(id) {
      if (id === this.hoveredFeatureId) return;
       this.hoveredFeatureId = id;
       
      if (this.hoveredFeatureId != null) {
        this.map.setFeatureState(
          { source: 'polygons', id: this.hoveredFeatureId },
          { hover: false }
        );
      }
     
      if (id != null) {
        this.map.setFeatureState(
          { source: 'polygons', id },
          { hover: true }
        );
      }
    },
    setSelected(id) {
      if (id === this.selectedFeatureId) return;
      if (this.selectedFeatureId != null) {
        this.map.setFeatureState(
          { source: 'polygons', id: this.selectedFeatureId },
          { selected: false }
        );
      }
      this.selectedFeatureId = id;
      if (id != null) {
        this.map.setFeatureState(
          { source: 'polygons', id },
          { selected: true }
        );
      }
    },
    openPopup(feature) {
      const props = feature.properties || {};
      const fid = props.id;
      const name = props.name || fid;
      const satellite = props.satellite || '';
      const url = `https://radiantearth.github.io/stac-browser/#/external/wyvern-prod-public-stac-order-archive.s3.ca-central-1.amazonaws.com/archive-order-collection/${fid}/${fid}.json`;

      if (this.currentPopup) this.currentPopup.remove();
      const centroid = turf.centroid(feature).geometry.coordinates;
      const html = `
        <div class="popup-title">${name}</div>
        <div class="popup-info">Satellite: ${satellite}<br>ID: ${fid}</div>
        <button class="popup-btn" onclick="window.open('${url}','_blank')">Go to Image</button>
      `;
      this.currentPopup = new mapboxgl.Popup()
        .setLngLat(centroid)
        .setHTML(html)
        .addTo(this.map);
    },
    updateVisibleIDs() {
      if (!this.map.getLayer('polygon-layer')) return;
      const feats = this.map.queryRenderedFeatures({ layers: ['polygon-layer'] });
      const uniq = [];
      const seen = new Set();
      feats.forEach(f => {
        const id = f.properties.id;
        if (!seen.has(id)) { seen.add(id); uniq.push(f); }
      });
      this.visibleFeatures = uniq;
    },
    highlightFeature(id) {
      this.setHover(id);
    },
    clearHighlight() {
      this.setHover(null);
    },
    focusFeature(id) {
      if (!this.allData) return;
      const f = this.allData.features.find(x => x.properties.id === id);
      if (!f) return;
      this.setSelected(f.id);
      this.openPopup(f);

      const b = new mapboxgl.LngLatBounds();
      const add = c => Array.isArray(c[0]) ? c.forEach(add) : b.extend(c);
      add(f.geometry.coordinates);
      this.map.fitBounds(b, { padding: 60 });
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

      // Fit bounds
      const bounds = new mapboxgl.LngLatBounds();
      const add = c => Array.isArray(c[0]) ? c.forEach(add) : bounds.extend(c);
      geojson.features.forEach(f => add(f.geometry.coordinates));
      this.map.fitBounds(bounds, { padding: 60 });

      // Buffer & highlight intersects
      if (this.allData) {
        const bufferPoly = turf.buffer(geojson, 10, { units: 'kilometers' });
        this.allData.features.forEach(f => {
          const inter = turf.booleanIntersects(f, bufferPoly);
          this.map.setFeatureState(
            { source: 'polygons', id: f.id },
            { selected: inter }
          );
          if (inter) this.selectedFeatureId = f.id;
        });
      }
    }
  }
};
</script>

<style scoped>
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
  top: 70px;
  right: 20px;
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

/* Popup styling overrides (global Mapbox popup classes not scoped) */
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
</style>
