import Utils from '../utils';

export default {
  computed: {
    fileFormats() {
      if (!this.data) {
        return [];
      }
      let assets = [];
      if ((this.data.isItem() || this.data.isCollection()) && Utils.isObject(this.data.assets)) {
        assets = assets.concat(Object.values(this.data.assets));
      }
      if (this.data.isCollection() && Utils.isObject(this.data.item_assets)) {
        assets = assets.concat(Object.values(this.data.item_assets));
      }
      return assets
        .filter(asset => Array.isArray(asset.roles) && asset.roles.includes('data') && typeof asset.type === 'string') // Look for data files
        .map(asset => asset.type) // Array shall only contain media types
        .filter((v, i, a) => a.indexOf(v) === i); // Unique values
    }
  }
};