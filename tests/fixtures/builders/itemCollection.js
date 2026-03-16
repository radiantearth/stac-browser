import APICollection from "./apicollection";

export default class ItemCollection extends APICollection {
  constructor(instance, data, url) {
    super(instance, data, url);
  }

  addItem(item) {
    this.data.features = this.data.features || [];
    this.data.features.push(item);
    if (typeof this.data.numberMatched === 'number') {
      this.data.numberMatched++;
    }
    if (typeof this.data.numberReturned === 'number') {
      this.data.numberReturned++;
    }
    return this;
  }

  addManyItems(count, parent = null) {
    for (let i = 0; i < count; i++) {
      const id = `example-item-${i}`;
      const title = `Example Item ${i}`;
      const item = this.instance.createStac({url: `/collections/${parent.id}/items/${id}`, type: Item});
      item.setMetadata({ id, title });
      this.addItem(item);
      if (parent !== null) {
        item.addParentLink(parent);
      }
    }
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
