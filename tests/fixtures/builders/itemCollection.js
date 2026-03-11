import { APICollection } from "./apicollection";

export class ItemCollection extends APICollection{
  constructor() {
    super();
    this.collection = {};
  }

  addItem(item) {
    this.collection.features = this.collection.features || [];
    this.collection.features.push(item);
    return this;
  }

  removeItemById(id) {
    if (this.collection.features) {
      this.collection.features = this.collection.features.filter(feature => feature.id !== id);
    }
    return this;
  }

  updateItemById(id, newItem) {
    if (this.collection.features) {
      this.collection.features = this.collection.features.map(feature => feature.id === id ? newItem : feature);
    }
    return this;
  }

  build() {
    return this.collection;
  }
}
