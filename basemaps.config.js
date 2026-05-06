import { Collection } from './src/models/stac';
import { STAC } from 'stac-js';

// For documentation see https://github.com/radiantearth/stac-browser/blob/main/docs/basemaps.md

const BASEMAPS = {
  earth: [
    {
      url: 'https://tiles.openfreemap.org/styles/positron',
      is: 'VectorTileStyle',
      title: 'Positron',
      attributions: '<a href="https://openfreemap.org" target="_blank">OpenFreeMap</a> <a href="https://www.openmaptiles.org/" target="_blank">&copy; OpenMapTiles</a> Data from <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a>',
      projection: 'EPSG:3857'
    },
    {
      url: 'https://tiles.openfreemap.org/styles/liberty',
      is: 'VectorTileStyle',
      title: 'Liberty',
      attributions: '<a href="https://openfreemap.org" target="_blank">OpenFreeMap</a> <a href="https://www.openmaptiles.org/" target="_blank">&copy; OpenMapTiles</a> Data from <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a>',
      projection: 'EPSG:3857'
    },
    {
      url: 'https://tiles.openfreemap.org/styles/dark',
      is: 'VectorTileStyle',
      title: 'Dark',
      attributions: '<a href="https://openfreemap.org" target="_blank">OpenFreeMap</a> <a href="https://www.openmaptiles.org/" target="_blank">&copy; OpenMapTiles</a> Data from <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a>',
      projection: 'EPSG:3857'
    },
    {
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      is: 'XYZ',
      title: 'Satellite',
      attributions: '&copy; <a href="https://www.esri.com" target="_blank">Esri</a>, Maxar, Earthstar Geographics, and the GIS User Community',
      projection: 'EPSG:3857'
    }
  ],
  europa: [
    {
      url: 'https://planetarymaps.usgs.gov/cgi-bin/mapserv?map=/maps/jupiter/europa_simp_cyl.map',
      is: 'TileWMS',
      title: 'USGS Europa',
      attributions: 'USGS Astrogeology',
      projection: 'EPSG:4326',
      params: {
        FORMAT: 'image/png',
        LAYERS: 'GALILEO_VOYAGER'
      }
    },
  ],
  mars: [
    {
      url: 'https://planetarymaps.usgs.gov/cgi-bin/mapserv?map=/maps/mars/mars_simp_cyl.map',
      is: 'TileWMS',
      title: 'USGS Mars',
      attributions: 'USGS Astrogeology',
      projection: 'EPSG:4326',
      params: {
        FORMAT: 'image/png',
        LAYERS: 'MDIM21'
      }
    }
  ],
  moon: [
    {
      url: 'https://planetarymaps.usgs.gov/cgi-bin/mapserv?map=/maps/earth/moon_simp_cyl.map',
      is: 'TileWMS',
      title: 'USGS Moon',
      attributions: 'USGS Astrogeology',
      projection: 'EPSG:4326',
      params: {
        FORMAT: 'image/png',
        LAYERS: 'LROC_WAC'
      }
    }
  ],
};

/**
 * 
 * @param {Object} stac The STAC object
 * @param {Object} i18n Vue I18N object
 * @returns {Array.<BasemapOptions>}
 */
export default function configureBasemap(stac, i18n) {
  let targets;
  if (stac instanceof Collection) {
    targets = stac.getSummary('ssys:targets');
  }
  if (stac instanceof STAC && !targets) {
    targets = stac.getMetadata('ssys:targets');
  }
  if (!targets) {
    targets = ['earth'];
  }

  let layers = [];
  for (const target of targets) {
    const maps = BASEMAPS[target.toLowerCase()];
    if (!Array.isArray(maps)) {
      continue;
    }
    layers = layers.concat(maps);
  }
  return layers;
};
