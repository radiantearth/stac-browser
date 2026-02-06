import { Collection } from './src/models/stac';
import { STAC } from 'stac-js'

// For documentation see https://github.com/radiantearth/stac-browser/blob/main/docs/basemaps.md

const BASEMAPS = {
  earth: [
    {
      url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
      is: 'XYZ',
      title: 'OpenStreetMap',
      attributions: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> contributors.',
      projection: "EPSG:3857"
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
