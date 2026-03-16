import APICollection from "./apicollection";

export default class ItemCollection extends APICollection {
  constructor(instance, data, url) {
    super(instance, data, url);
  }

  addItem(item) {
    this.data.features = this.data.features || [];
    this.data.features.push(item);
    return this;
  }

  removeItemById(id) {
    if (this.data.features) {
      this.data.features = this.data.features.filter(feature => feature.id !== id);
    }
    return this;
  }

  updateItemById(id, newItem) {
    if (this.data.features) {
      this.data.features = this.data.features.map(feature => feature.id === id ? newItem : feature);
    }
    return this;
  }
}
