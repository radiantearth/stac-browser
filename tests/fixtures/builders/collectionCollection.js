import APICollection from "./apicollection";
import Collection from "./collection";

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
      const collection = this.instance.createStac(`/collections/${id}`, Collection);
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
}
