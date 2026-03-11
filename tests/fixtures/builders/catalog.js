import { CatalogLike } from './catalogLike.js';

export class Catalog extends CatalogLike {
  constructor(options = {}) {
    super(options);
    this.baseurl = options.baseurl;
    this.data = options.data || {};
  }

  addConformsTo(specUrl) {
    this.data.conformsTo = this.data.conformsTo || [];
    this.data.conformsTo.push(specUrl);
    return this;
  }

  build() {
    return this.data;
  }
}
