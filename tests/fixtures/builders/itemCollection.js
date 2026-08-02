import APICollection from "./apicollection.js";
import Item from "./item.js";

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
      const itemUrl = parent !== null ? 
        `/collections/${parent.data.id}/items/${id}` :
        `/items/${id}`;
      const item = this.instance.createStac(
        {
          url: itemUrl, 
          type: Item
        });
      item.setMetadata({ id, title });
      this.addItem(item);
      if (parent !== null) {
        item.addParentLink(parent);
      }
    }
    return this;
  }
  
  getItems(){
    return this.data.features || [];
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
  
  build(searchParams = { limit: 10, page: 1 }) {
    const data = super.build();
    
    data.features = this.instance.getItems();
    this.paginateData('features', searchParams);
    
    return data;
  }
}
