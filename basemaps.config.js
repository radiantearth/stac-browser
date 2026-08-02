import { Collection, STAC } from 'stac-js';

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
//'earth-dark': [
//  {
//    url: 'https://cartodb-basemaps-{a-d}.global.ssl.fastly.net/dark_all/{z}/{x}/{y}.png',
//    is: 'XYZ',
//    title: 'Carto Dark',
//    attributions: 'Map tiles by Carto, under CC BY 3.0. Data by OpenStreetMap, under ODbL.',
//    projection: "EPSG:3857"
//  }
//],
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
 * @param {String} store Vuex store instance
 * @returns {Array.<BasemapOptions>}
 */
export default function configureBasemap(stac, i18n, store) {
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

  if (store.state.colorMode === 'dark') {
    targets = targets.map(t => {
      const darkVariant = `${t}-dark`;
      return Array.isArray(BASEMAPS[darkVariant]) ? darkVariant : t;
    });
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
