import CatalogLike from './catalogLike.js';

export default class Catalog extends CatalogLike {

  addConformsTo(specUrl) {
    this.data.conformsTo = this.data.conformsTo || [];
    this.data.conformsTo.push(specUrl);
    return this;
  }

  removeFromConformsTo(specUrl) {
    if (this.data.conformsTo) {
      this.data.conformsTo = this.data.conformsTo.filter(url => url !== specUrl);
    }
    return this;
  }

  removeConformsTo() {
    delete this.data.conformsTo;
    return this;
  }
}
