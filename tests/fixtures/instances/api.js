import Instance from './instance.js';
import CollectionCollection from '../builders/collectionCollection.js';
import Conformance from '../builders/conformance.js';
import Queryables from '../builders/queryables.js';
import ItemCollection from '../builders/itemCollection.js';
import Item from '../builders/item.js';
import path from 'path';

export default class API extends Instance {
  constructor(rootOptions = {}, options = {}) {
    super(options);
    rootOptions.url = rootOptions.url || 'https://stac.example/api/';
    rootOptions.template = rootOptions.template || 'api-root';
    this.root = this.createStac(rootOptions);
  }
  
  static minimalApi(rootOptions, options) {
    return (new API(rootOptions, options))
      .addOpenApi();
  }
  
  static defaultApi(rootOptions = {}, options = {}) {
    return API.minimalApi(rootOptions, options)
      .addCollectionsExtension()
      .addItemsExtension()
      .addSearchExtension();
  }
  
  addCollection(id, options = {}) {
    this.addCollectionsExtension();
    options.url = options.url || `collections/${id}`;
    const collection = this.createCollection(options).setMetadata({id});
    
    this.collections.addNewCollection(collection);
    
    return collection;
  }
  
  addItem(collection, id, options = {}) {
    this.addItemsExtension();
    const cid = collection.data.id;
    options.url = options.url || `collections/${cid}/items/${id}`;
    if (!this.itemCollections[cid]) { 
      const url = path.dirname(options.url);
      const itemCollection = this.createStac({
        url, 
        type: ItemCollection
      });
      this.itemCollections[cid] = itemCollection;
      collection.addLink({href: itemCollection.getAbsoluteUrl(), rel: 'items', type: 'application/geo+json'});
    }
    const items = this.itemCollections[cid];
    const item = this.createStac({
      url: options.url,
      type: Item
    });
    
    items.addItem(item.build());
    
    return item;
  }
  
  addManyItems(collection, count){
    this.addItemsExtension();
    const cid = collection.data.id;
    const items = [];
    
    for (let i = 0; i < count; i++) {
      const id = `example-item-${i}`;
      const itemOptions = { url: `collections/${cid}/items/${id}`};
      const item = this.addItem(collection, id, itemOptions);
      item.addParentLink(collection);
      items.push(item);
    }
    return items;
  }
  
  getItems() {
    const items = [];
    for (let cid in this.itemCollections){
      items.push(...this.itemCollections[cid].getItems());
    }
    return items;
  }
  
  addStaticCatalog(options = {}) {
    return this.root.addCatalog(options);
  }
  
  addStaticCollection(options = {}) {
    return this.root.addCollection(options);
  }
  
  addStaticItem(options) {
    return this.root.addItem(options);
  }
  
  addOpenApi() {
    this.root.addConformsTo('http://www.opengis.net/spec/ogcapi-features-1/1.0/conf/oas30');
    return this;
  }
  
  addConformanceEndpoint() {
    // check if conformance endpoint already exists    
    if (this.endpoints.some(ep => ep instanceof Conformance)) {
      return this;
    }
    
    // GET /
    this.root.addLink({ href: 'conformance', rel: 'conformance', type: 'application/json' }); // Todo: how to define the href? absolute? relative? ...
    
    // GET /conformance
    const conformance = new Conformance(this);
    this.endpoints.push(conformance);
    
    return this;
  }
  
  addSearchEndpoint({methods = ['GET', 'POST']} = {}) {
    // TODO: check if search endpoint already exists
    this.root.addSearchLink(methods);
    
    for (const method of methods) {
      this.createStac({
        url: 'search',
        type: ItemCollection
      }).setMethod(method);
    }
    
    return this;
  }
  
  addQueryablesEndpoint() {
    //check if queryables endpoint already exists
    if (this.endpoints.some(ep => ep instanceof Queryables)) {
      return this;
    }
    
    // GET /queryables
    const queryables = new Queryables(this);
    this.endpoints.push(queryables);
    
    this.root.addLink(
      { 
        rel: 'queryables', 
        href: queryables.getAbsoluteUrl(), 
        type: 'application/schema+json' 
      }
    );
    
    return this;
  }
  
  addCollectionsExtension() {
    if (this.endpoints.some(ep => ep instanceof CollectionCollection)) {
      return this;
    }
    if (this.collections) {
      return this;
    }
    
    // GET /collections
    this.collections = this.createStac({url: `collections`, type: CollectionCollection});
    
    // GET /
    this.addConformanceEndpoint();
    this.root.addConformsTo('https://api.stacspec.org/v1.0.0/collections');
    this.root.addLink({ href: this.collections.getAbsoluteUrl(), rel: 'data', type: 'application/json' }); // Todo: how to define the href? absolute? relative? ...
    
    // todo: pagination
    
    return this;
  }
  
  addItemsExtension() {
    if (this.itemCollections) {
      return this;
    }
    // GET /
    this.addConformanceEndpoint();
    this.root.addConformsTo('http://www.opengis.net/spec/ogcapi-features-1/1.0/conf/core');
    this.root.addConformsTo('http://www.opengis.net/spec/ogcapi-features-1/1.0/conf/geojson');
    this.root.addConformsTo('https://api.stacspec.org/v1.0.0/ogcapi-features');
    
    this.itemCollections = {}; // keys = collection ID, values = ItemCollection objects
    
    return this;
  }
  
  addSearchExtension(options = {}) {
    this.addSearchEndpoint(options);
    this.root.addConformsTo("https://api.stacspec.org/v1.0.0/item-search");
    this.root.addConformsTo("https://api.stacspec.org/v1.0.0/item-search#filter");
    this.root.addConformsTo("https://api.stacspec.org/v1.0.0/item-search#fields");
    this.root.addConformsTo("https://api.stacspec.org/v1.0.0/item-search#query");
    this.root.addConformsTo("https://api.stacspec.org/v1.0.0/item-search#sort");
    return this;
  }
  
  addFilterExtension() {
    this.addQueryablesEndpoint();
    this.root.addConformsTo("http://www.opengis.net/spec/ogcapi-features-3/1.0/conf/filter");
    return this;
  }
}
