import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import Catalog from '../builders/catalog.js';
import Collection from '../builders/collection.js';
import Item from '../builders/item.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default class Instance {
  constructor(options) {
    this.root = null;
    this.options = options;
    this.endpoints = [];
    this.templateCache = {};
  }

  _loadTemplate(type, name = 'default') {
    if (typeof type === 'function') {
      // Convert the class names of the builders to match the template folder names
      type = type.name;
      type = type.charAt(0).toLowerCase() + type.slice(1);
    }
    const templatePath = path.resolve(__dirname, `../templates/${type}/${name}.json`);
    let template = this.templateCache[templatePath];
    if (!template) {
      template = JSON.parse(fs.readFileSync(templatePath, 'utf-8'));
      this.templateCache[templatePath] = template;
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
    if (!this.root) {
      this.root = obj;
    }
    this.endpoints.push(obj);
    return obj;
  }

  createServer() {
    throw new Error('Not implemented');
  }
}
