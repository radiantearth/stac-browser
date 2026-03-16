import Instance from './instance.js';
import CollectionCollection from '../builders/collectionCollection.js';
import Conformance from '../builders/conformance.js';
import ItemCollection from '../builders/itemCollection.js';
import URI from 'urijs';

function joinUrl(base, path) {
  const uri = URI(base);
  uri.pathname(URI.joinPaths(uri.pathname(), path));
  return uri.toString();
}

export default class API extends Instance {
  constructor(rootOptions = {}, options = {}) {
    super(options);
    rootOptions.url = rootOptions.url || 'https://example.com/api';
    rootOptions.template = rootOptions.template || 'api-root';
    this.root = this.createStac(rootOptions);
  }

  static minimalApi(rootOptions, options) {
    return (new API(rootOptions, options))
      .addOpenApi();
  }

  static defaultApi(rootOptions, options) {
    return API.minimalApi(rootOptions, options)
      .addCollectionsExtension()
      .addItemsExtension()
      .addSearchExtension();
  }

  static fullApi(rootOptions, options) {
    return API.defaultApi(rootOptions, options)
      .addCollectionSearchExtension();
  }
  
  addCollection(id, options) {
    this.addCollectionsExtension();
    options.url = options.url || joinUrl(this.root.url, `/collections/${id}`);
    const collection = this.createCollection(options).setMetadata({id});
  
    this.collections.addNewCollection(collection);

    return collection;
  }

  addItem(collection, id, options) {
    this.addItemsExtension();
    const cid = collection.id;
    if (!this.itemCollections[cid]) {
      this.itemCollections[cid] = new ItemCollection(this, { id: cid }, joinUrl(this.root.url, `/collections/${cid}/items`));
    }
    const items = this.itemCollections[cid];
    options.url = options.url || joinUrl(this.root.url, `/collections/${cid}/items/${id}`);
    const item = items.addItem(options);
    // todo...
    

    return item;
  }

  addStaticCatalog(options) {
    return this.root.addCatalog(options);
  }

  addStaticCollection(options) {
    return this.root.addCollection(options);
  }

  addStaticItem(options) {
    return this.root.addItem(options);
  }
  
  addOpenApi({
    excludeServiceDesc = false
  } = {}) {
    this.root.addConformsTo('http://www.opengis.net/spec/ogcapi-features-1/1.0/conf/oas30');
    return this;
  }

  addConformanceEndpoint() {
    // check if conformance endpoint already exists    
    if (this.endpoints.some(ep => ep instanceof Conformance)) {
      return this;
    }

    // GET /
    this.root.addLink({ href: '/conformance', rel: 'conformance', type: 'application/json' }); // Todo: how to define the href? absolute? relative? ...

    // GET /conformance
    this.endpoints.push(new Conformance(this));

    return this;
  }

  addCollectionsExtension({

  } = {}) {
    if (this.collections) {
      return this;
    }
    // GET /
    this.addConformanceEndpoint();
    this.root.addConformsTo('https://api.stacspec.org/v1.0.0/collections');
    this.root.addLink({ href: '/collections', rel: 'data', type: 'application/json' }); // Todo: how to define the href? absolute? relative? ...

    // GET /collections
    this.collections = this.createStac({url: '/collections', type: CollectionCollection});

    this.endpoints.push(this.collections);
    // todo: pagination

    return this;
  }

  addItemsExtension({

  } = {}) {
    if (this.itemCollections) {
      return this;
    }
    // GET /
    this.addConformanceEndpoint();
    this.root.addConformsTo('http://www.opengis.net/spec/ogcapi-features-1/1.0/conf/core');
    this.root.addConformsTo('http://www.opengis.net/spec/ogcapi-features-1/1.0/conf/geojson');
    this.root.addConformsTo('https://api.stacspec.org/v1.0.0/ogcapi-features');

    this.itemCollections = {}; // keys = collection ID, values = ItemCollection objects
    // todo...
    
    return this;
  }

  addSearchExtension({

  } = {}) {

    return this;
  }

  addCollectionSearchExtension({

  } = {}) {

    return this;
  }
}
