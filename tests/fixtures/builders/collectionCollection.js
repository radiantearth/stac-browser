import APICollection from "./apicollection.js";
import Collection from "./collection.js";

export default class CollectionCollection extends APICollection {
  constructor(instance, data, url) {
    super(instance, data, url);
  }
  
  addNewCollection(collection) {
    this.data.collections = this.data.collections || [];
    this.data.collections.push(collection);
    if (typeof this.data.numberMatched === 'number') {
      this.data.numberMatched++;
    }
    if (typeof this.data.numberReturned === 'number') {
      this.data.numberReturned++;
    }
    return this;
  }
  
  addManyCollections(count, parent = null) {
    for (let i = 0; i < count; i++) {
      const id = `example-${i}`;
      const title = `Example Collection ${i}`;
      const collection = this.instance.createStac({url: `collections/${id}`, type:Collection});
      collection.setMetadata({ id, title });
      this.addNewCollection(collection);
      if (parent !== null) {
        collection.addParentLink(parent);
      }
    }
    return this;
  }
  
  removeCollectionById(id) {
    if (this.data.collections) {
      this.data.collections = this.data.collections.filter(col => col.id !== id);
    }
    return this;
  }
  
  updateCollectionById(id, newCollection) {
    if (this.data.collections) {
      this.data.collections = this.data.collections.map(col => col.id === id ? newCollection : col);
    }
    return this;
  }
  
  build() {
    const data = super.build();
    for(let collection in data.collections){
      if(data.collections[collection] instanceof Collection){
        data.collections[collection] = data.collections[collection].build();
      }
    }
    return data;
  }
}
