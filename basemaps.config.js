import { Collection } from './src/models/stac';

const USGS_ATTRIBUTION = 'USGS Astrogeology';
const WMS = 'TileWMS';
const XYZ = 'XYZ';

// All options (except for 'is') follow the OpenLayers options for the respective source class.
// Projections (except for EPSG:3857 and EPSG:4326) must be listed in the `crs` array in the config.js.
//
// There's a layerCreated callback that can be used to modify the layer and source after it has been created:
// async layerCreated(Layer layer, Source source) => Layer
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
      is: WMS,
      title: 'USGS Mars',
      attributions: USGS_ATTRIBUTION,
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
      is: WMS,
      title: 'USGS Moon',
      attributions: USGS_ATTRIBUTION,
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
  if (!targets) {
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
