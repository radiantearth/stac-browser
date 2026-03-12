export default class CollectionCollection {
  constructor() {
    this.collection = {};
  }

  addNewCollection(collection) {
    this.collection.collections = this.collection.collections || [];
    this.collection.collections.push(collection);
    return this;
  }

  removeCollectionById(id) {
    if (this.collection.collections) {
      this.collection.collections = this.collection.collections.filter(col => col.id !== id);
    }
    return this;
  }

  updateCollectionById(id, newCollection) {
    if (this.collection.collections) {
      this.collection.collections = this.collection.collections.map(col => col.id === id ? newCollection : col);
    }
    return this;
  }

  build() {
    return this.collection;
  }
}
