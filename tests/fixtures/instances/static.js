import { http, HttpResponse } from 'msw';
import Instance from './instance.js';

export default class StaticCatalog extends Instance {
  constructor(options = {}) {
    super(options);
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
