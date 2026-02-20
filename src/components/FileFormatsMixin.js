import { isObject } from 'stac-js/src/utils.js';
import StacFieldsMixin from './StacFieldsMixin';
import { formatMediaType } from '@radiantearth/stac-fields/formatters';

export default {
  mixins: [
    StacFieldsMixin({ formatMediaType })
  ],
  computed: {
    fileFormats() {
      if (!this.data) {
        return [];
      }
      let assets = [];
      if ((this.data.isItem() || this.data.isCollection()) && isObject(this.data.assets)) {
        assets = assets.concat(Object.values(this.data.assets));
      }
      if (this.data.isCollection() && isObject(this.data.item_assets)) {
        assets = assets.concat(Object.values(this.data.item_assets));
      }
      
      return assets
        .filter(asset => Array.isArray(asset.roles) && asset.roles.includes('data') && typeof asset.type === 'string') // Look for data files
        .map(asset => this.formatMediaType(asset.type, null, {shorten: true})) // Array shall only contain media types
        .filter((v, i, a) => a.indexOf(v) === i) // Unique values
        .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' })); // Sort alphabetically
    }
  }
};
