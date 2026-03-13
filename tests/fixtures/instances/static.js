import { http, HttpResponse } from 'msw';
import Instance from './instance.js';

export default class StaticCatalog extends Instance {
  constructor(rootOptions, options = {}) {
    super(options);
    this.root = this.createStac(rootOptions);
  }

  addCatalog(options) {
    return this.root.addCatalog(options);
  }

  addCollection(options) {
    return this.root.addCollection(options);
  }

  addItem(options) {
    return this.root.addItem(options);
  }

  setMetadata(metadata) {
    this.root.setMetadata(metadata);
    return this;
  }

  async createServer(worker) {
    const handlers = [];

    for (const endpoint of this.endpoints) {
      const obj = endpoint.build();
      const url = endpoint.url;

      handlers.push(http.get(url, () => HttpResponse.json(obj)));
    }

    await worker.resetHandlers();
    await worker.use(...handlers);
  }
}
