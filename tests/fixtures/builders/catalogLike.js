import { Stac } from "./stac";

export class CatalogLike extends Stac {
  constructor(data) {
    super(data);

    this.data = data || {};
  }

  addSearchLink() {
    return this.addLink({ rel: 'search', href: this.baseurl + '/search', type: 'application/geo+json' });
  }

  removeSearchLink() {
    return this.removeLink('search');
  }

  updateSearchLink(newParameters) {
    return this.updateLink('search', newParameters);
  }

  addStacLink(stac) {
    const absluteUrl = this.getAbsoluteUrl();
    if (!absluteUrl) {
      throw new Error('Cannot add stac link without absolute URL');
    }
    
    if (stac.type === 'Item') {
      return this.addLink({ rel: 'item', href: absluteUrl, type: 'application/geo+json', title: stac.title }); 
    } else if (stac.type === 'Catalog' || stac.type === 'Collection') {
      return this.addLink({ rel: 'child', href: absluteUrl, type: 'application/json', title: stac.title });
    } else {
      throw new Error('Unsupported STAC type for stac link: ' + stac.type);
    }

  }

  build() {
    return this.data;
  }
}
