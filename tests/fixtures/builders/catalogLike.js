import Stac from "./stac.js";

export default class CatalogLike extends Stac {

  addSearchLink() {
    return this.addLink({ rel: 'search', href: this.getAbsoluteUrl() + '/search', type: 'application/geo+json' });
  }

  removeSearchLink() {
    return this.removeLink('search');
  }

  updateSearchLink(newParameters) {
    return this.updateLink('search', newParameters);
  }

  addChildLink(child) {
    return this.addLink({ rel: 'child', href: child.getAbsoluteUrl(), type: 'application/json', title: child.title });
  }

  addItemLink(item) {
    return this.addLink({ rel: 'item', href: item.getAbsoluteUrl(), type: 'application/geo+json', title: item.title });
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
}
