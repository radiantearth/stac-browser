import { Collection } from './src/models/stac';
import { STAC } from 'stac-js';

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
};

/**
 * 
 * @param {Object} stac The STAC object
 * @param {Object} i18n Vue I18N object
 * @param {String} store Vuex store instance
 * @returns {Array.<BasemapOptions>}
 */
export default function configureBasemap(stac, i18n, store) {
  let targets = ['earth'];

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
