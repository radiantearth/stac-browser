import STACHypermedia from './hypermedia.js';

export default class Stac extends STACHypermedia {
  constructor(instance, data, url) {
    super(data, url);
    this.instance = instance;
    this.addSelfLink();
  }

  addParentLink(parent) {
    return this.addLink({ rel: 'parent', href: parent.getAbsoluteUrl(), type: 'application/json', title: parent.title });
  }
  
  addCollection(options) {
    const collection = this.instance.createCollection(options);
    collection.addParentLink(this);
    this.addChildLink(collection);
    return collection;
  }

  addCatalog(options) {
    const catalog = this.instance.createCatalog(options);
    catalog.addParentLink(this);
    this.addChildLink(catalog);
    return catalog;
  }

  addItem(options) {
    const catalog = this.instance.createItem(options);
    catalog.addParentLink(this);
    this.addItemLink(catalog);
    return catalog;
  }

  addExtensions(extensions) {
    this.data.stac_extensions = this.data.stac_extensions || [];
    this.data.stac_extensions.push(...extensions);
    return this;
  }

  removeFromExtensions(extension) {
    if (this.data.stac_extensions) {
      this.data.stac_extensions = this.data.stac_extensions.filter(ext => ext !== extension);
    }
    return this;
  }

  removeExtensions() {
    delete this.data.stac_extensions;
    return this;
  }

  addToExtensions(extension) {
    this.data.stac_extensions = this.data.stac_extensions || [];
    if (!this.data.stac_extensions.includes(extension)) {
      this.data.stac_extensions.push(extension);
    }
    return this;
  }
}
