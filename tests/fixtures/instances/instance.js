import path from 'path';
import fs from 'fs';
import Catalog from '../builders/catalog.js';
import Collection from '../builders/collection.js';
import Item from '../builders/item.js';

export default class Instance {
  constructor(options) {
    this.options = options;
    this.endpoints = {};
    this.templateCache = {};
  }

  _loadTemplate(type, name = 'default') {
    if (typeof type === 'function') {
      // Convert the class names of the builders to match the template folder names
      type = type.constructor.name;
      type = type.charAt(0).toLowerCase() + type.slice(1);
    }
    const templatePath = path.resolve(__dirname, `../templates/${type}/${name}.json`);
    let template = this.templateCache[templatePath];
    if (!template) {
      template = fs.readFileSync(templatePath, 'utf-8');
      this.templateCache[templatePath] = JSON.parse(template);
    }
    return structuredClone(template);
  }

  addCollection(options) {
    options.type = Collection;
    return this.addStac(options);
  }

  addCatalog(options) {
    options.type = Catalog;
    return this.addStac(options);
  }

  addItem(options) {
    options.type = Item;
    return this.addStac(options);
  }

  addStac({
    url,
    type,
    template = 'default'
  }) {
    const data = this._loadTemplate(type, template); 
    const obj = new type(data, url);
    return obj;
  }

  createServer() {
    throw new Error('Not implemented');
  }
}
