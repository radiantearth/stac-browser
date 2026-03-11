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

  addProviders(providers) {
    if (!Array.isArray(this.data.providers)) {
      this.data.providers = [];
    }
    this.data.providers.push(...providers);
    return this;
  }

  removeProviders() {
    delete this.data.providers;
    return this;
  }

  addToProviders(provider) {
    if (!Array.isArray(this.data.providers)) {
      this.data.providers = [];
    }
    this.data.providers.push(provider);
    return this;
  }

  removeFromProviders(providerName) {
    if (!Array.isArray(this.data.providers)) {
      return this;
    }
    this.data.providers = this.data.providers.filter(p => p.name !== providerName);
    return this;
  }

  build() {
    return this.data;
  }
}
