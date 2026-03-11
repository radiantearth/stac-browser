import { CatalogLike } from './catalogLike.js';

export class Catalog extends CatalogLike {
  constructor(data) {
    super(data);
    this.data = data || {};
  }

  addConformsTo(specUrl) {
    this.data.conformsTo = this.data.conformsTo || [];
    this.data.conformsTo.push(specUrl);
    return this;
  }

  removeConformsTo(specUrl) {
    if (this.data.conformsTo) {
      this.data.conformsTo = this.data.conformsTo.filter(url => url !== specUrl);
    }
    return this;
  }

  excludeConformsTo() {
    delete this.data.conformsTo;
    return this;
  }

  build() {
    return this.data;
  }
}
