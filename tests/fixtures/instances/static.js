import { http, HttpResponse } from 'msw';
import Instance from './instance.js';

export default class StaticCatalog extends Instance {
  constructor(options) {
    super(options);
    this.baseurl = options.baseurl;
  }

  async createServer(worker) {
    const handlers = [];

    for (const endpoint of this.endpoints) {
      const obj = endpoint.build();
      const url = endpoint.absoluteUrl || endpoint.baseurl;

      handlers.push(http.get(url, () => HttpResponse.json(obj)));

      for (const link of obj.links || []) {
        if (link.rel === 'data' || link.rel === 'collections') {
          handlers.push(http.get(link.href, () =>
            HttpResponse.json({ type:'Catalog', links:[], catalogs:[] })
          ));
        }
        if (link.rel === 'items') {
          handlers.push(http.get(link.href, () =>
            HttpResponse.json({ type:'FeatureCollection', features:[], links:[] })
          ));
        }
        if (link.rel === 'search') {
          handlers.push(http.post(link.href, () =>
            HttpResponse.json({ type:'FeatureCollection', features:[], links:[] })
          ));
        }
      }
    }

    await worker.use(...handlers);
  }
}
