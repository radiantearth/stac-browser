import { http, HttpResponse } from 'msw';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import Catalog from '../builders/catalog.js';
import Collection from '../builders/collection.js';
import Item from '../builders/item.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default class Instance {
  constructor(options = {}) {
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
  
  async createServer(worker, options) {
    options = { reset: true, verbose: false, ...options };
    const handlers = [];
    
    for (const endpoint of this.endpoints) {
      try {
        const url = endpoint.getAbsoluteUrl();
        const method = endpoint.getMethod();
        options.verbose && console.log(`Adding endpoint ${method} ${url}`);
        
        //GET
        if(method === 'GET'){
          handlers.push(http.get(url, ({request}) => {
            try { 
              const url = new URL(request.url);
              options.verbose && console.log(`GET ${url}`);
              const params = Object.fromEntries(url.searchParams); //quick patch. breaks with multiple arguments of the same key
              const obj = endpoint.build(params);
              return HttpResponse.json(obj);
            } catch (e) {
              console.log(e);
              return HttpResponse.json({ error: 'Failed to build response' }, { status: 500 });
            }
          }));
        }
        //POST
        else if(method === 'POST'){
          handlers.push(http.post(url, async ({request}) => {
            try {
              const req = await request.clone().json();
              options.verbose && console.log(`POST ${url}`);
              const obj = endpoint.build(req);
              return HttpResponse.json(obj);
            } catch (e) {
              console.log(e);
              return HttpResponse.json({ error: 'Failed to build response' }, { status: 500 });
            }
          }));
        } 
        //TODO: more methods as needed
        else {
          throw new Error(`Unsupported method ${method} for endpoint ${url}`);
        }
        
      } catch (e) {
        console.log(`failed to add handler for ${endpoint.getAbsoluteUrl()}. Reason:`, e);
      }
    }
    
    if (options.reset) {
      await worker.resetHandlers();
    }
    
    try {
      await worker.use(...handlers);
    } catch (e) {
      options.verbose && console.log(`Endpoints added. Passing handlers to worker`);
      console.log(`Worker failed to use handlers:`, e);
    }
  }
}
