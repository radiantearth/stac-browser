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
  
  build(searchParams = {}) {
    const data = super.build();
    for(let collection in data.collections){
      if(data.collections[collection] instanceof Collection){
        data.collections[collection] = data.collections[collection].build();
      }
    }
    this.paginateData('collections', searchParams, this._freeTextFilter(searchParams.q));
    return data;
  }

  // Free-text search (collection-search #free-text): match all terms against title and id.
  // Opt-in via the freeTextSearchEnabled instance option, as some tests
  // rely on a server that ignores the q parameter.
  _freeTextFilter(q) {
    if (!q || !this.instance.options.freeTextSearchEnabled) {
      return null;
    }
    const terms = String(q).toLowerCase().split(',').map(term => term.trim()).filter(Boolean);
    return collection => {
      const data = collection instanceof Collection ? collection.getMetadata() : collection;
      const haystack = `${data.title || ''} ${data.id || ''}`.toLowerCase();
      return terms.every(term => haystack.includes(term));
    };
  }
}
