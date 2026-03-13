import Instance from './instance.js';
import CollectionCollection from '../builders/collectionCollection.js';
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
    // todo...
    this.items[id] = new ItemCollection();
    return collection;
  }

  addItem(collection, id, options) {
    this.addItemsExtension();
    const cid = collection.id;
    if (!this.items[cid]) {
      throw new Error(`Collection with id ${cid} has not been added yet`);
    }
    const items = this.items[cid];
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

    return this;
  }

  addCollectionsExtension({

  } = {}) {
    if (this.collections) {
      return this;
    }
    this.collections = new CollectionCollection();
    // todo...
    return this;
  }

  addItemsExtension({

  } = {}) {
    if (this.items) {
      return this;
    }
    this.items = {}; // keys = collection ID, values = ItemCollection objects
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
