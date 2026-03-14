import { http, HttpResponse } from 'msw';
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

  createCatalog({
    url,
    template = 'default'
  } = {}) {
    return this.createStac({ url, type: Catalog, template });
  }

  createCollection({
    url,
    template = 'default'
  } = {}) {
    return this.createStac({ url, type: Collection, template });
  }

  createItem({
    url,
    template = 'default'
  } = {}) {
    return this.createStac({ url, type: Item, template });
  }

  createStac({
    url,
    type = Catalog,
    template = 'default'
  } = {}) {
    if (!url) {
      throw new Error('url is required');
    }
    const data = this._loadTemplate(type, template); 
    const obj = new type(this, data, url);
    this.endpoints.push(obj);
    return obj;
  }

  async createServer(worker, options = { reset: true }) {
    const handlers = [];

    for (const endpoint of this.endpoints) {
      const obj = endpoint.build();
      const url = endpoint.url;

      handlers.push(http.get(url, () => HttpResponse.json(obj)));
    }

    if (options.reset) {
      await worker.resetHandlers();
    }

    await worker.use(...handlers);
  }
}
