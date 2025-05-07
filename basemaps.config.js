import STAC from './src/models/stac';
import Utils from './src/utils';
import MVT from 'ol/format/MVT';

const USGS_ATTRIBUTION = 'USGS Astrogeology';
const WMS = 'TileWMS';
const XYZ = 'XYZ';
const VectorTile = 'VectorTile';

// All options (except for 'is') follow the OpenLayers options for the respective source class.
// Projections (except for EPSG:3857 and EPSG:4326) must be listed in the `crs` array in the config.js.
const BASEMAPS = {
  earth: [
    {
      url: 'https://vectortiles.geo.admin.ch/tiles/ch.swisstopo.base.vt/v1.0.0/{z}/{x}/{y}.pbf',
      is: VectorTile,
      title: 'Swisstopo VectorTiles',
      attributions: '&copy; swisstopo',
      projection: 'EPSG:2056',
      format: new MVT(),
    },
    {
      url: 'https://wms.geo.admin.ch/',
      is: WMS,
      title: 'Swisstopo WMS ',
      attributions: '&copy; swisstopo',
      projection: 'EPSG:2056',
      params: {
        LAYERS: 'ch.swisstopo.landeskarte-farbe-10',
        FORMAT: 'image/png',
      }
    },
    {
      url: 'https://wmts.geo.admin.ch/1.0.0/ch.swisstopo.swissimage/default/current/3857/{z}/{x}/{y}.jpeg',
      is: XYZ,
      title: 'Swisstopo XYZ',
      attributions: '&copy; swisstopo',
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
