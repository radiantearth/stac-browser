import STAC from './src/models/stac';
import Utils from './src/utils';

const USGS_ATTRIBUTION = 'USGS Astrogeology';
const WMS = 'TileWMS';
const XYZ = 'XYZ';

// All options (except for 'is') follow the OpenLayers options for the respective source class.
const BASEMAPS = {
  earth: [
    {
      url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
      is: XYZ,
      title: 'OpenStreetMap',
      attributions: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> contributors.',
      projection: "EPSG:3857"
    }
  ],
  europa: [
    {
      url: 'https://planetarymaps.usgs.gov/cgi-bin/mapserv?map=/maps/jupiter/europa_simp_cyl.map',
      is: WMS,
      title: 'USGS Europa',
      attributions: USGS_ATTRIBUTION,
      projection: "EPSG:4326",
      params: {
        FORMAT: 'image/png',
        LAYERS: 'GALILEO_VOYAGER'
      }
    },
  ],
  mars: [
    {
      url: 'https://planetarymaps.usgs.gov/cgi-bin/mapserv?map=/maps/mars/mars_simp_cyl.map',
      is: WMS,
      title: 'USGS Mars',
      attributions: USGS_ATTRIBUTION,
      projection: "EPSG:4326",
      params: {
        FORMAT: 'image/png',
        LAYERS: 'MDIM21'
      }
    }
  ],
  moon: [
    {
      url: 'https://planetarymaps.usgs.gov/cgi-bin/mapserv?map=/maps/earth/moon_simp_cyl.map',
      is: WMS,
      title: 'USGS Moon',
      attributions: USGS_ATTRIBUTION,
      projection: "EPSG:4326",
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
  let targets = ['earth'];
  if (stac instanceof STAC) {
    if (stac.isCollection() && Utils.isObject(stac.summaries) && Array.isArray(stac.summaries['ssys:targets'])) {
      targets = stac.summaries['ssys:targets'];
    }
    else if (stac.isCollection() && Array.isArray(stac['ssys:targets'])) {
      targets = stac['ssys:targets'];
    }
    else if (stac.isItem() && Array.isArray(stac.properties['ssys:targets'])) {
      targets = stac.properties['ssys:targets'];
    }
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
