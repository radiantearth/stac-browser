import { Stac } from "./stac";

export class CatalogLike extends Stac {
  constructor(options = {}) {
    super(options);
    this.baseurl = options.baseurl;
    this.data = options.data || {};
  }

  addTitle(title) {
    this.data.title = title;
    return this;
  }

  removeTitle() {
    delete this.data.title;
    return this;
  }

  updateTitle(newTitle) {
    this.data.title = newTitle;
    return this;
  }

  addVersion(version) {
    this.data.version = version;
    return this;
  }

  removeVersion() {
    delete this.data.version;
    return this;
  }

  updateVersion(newVersion) {
    this.data.version = newVersion;
    return this;
  }

  addDescription(description) {
    this.data.description = description;
    return this;
  }

  removeDescription() {
    delete this.data.description;
    return this;
  }

  updateDescription(newDescription) {
    this.data.description = newDescription;
    return this;
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

  addChildLink(childCatalog) {
    return this.addLink({ rel: 'child', href: childCatalog.baseurl, type: 'application/json', title: childCatalog.data.title });
  }

  removeChildLink(childCatalog) {
    return this.removeLink('child', childCatalog.baseurl);
  }

  updateChildLink(oldChildCatalog, newChildCatalog) {
    return this.updateLink('child', { href: newChildCatalog.baseurl, title: newChildCatalog.data.title }, { href: oldChildCatalog.baseurl });
  }

  addItemLink(item) {
    return this.addLink({ rel: 'item', href: item.baseurl, type: 'application/geo+json', title: item.data.title });
  }

  removeItemLink(item) {
    return this.removeLink('item', item.baseurl);
  }

  updateItemLink(oldItem, newItem) {
    return this.updateLink('item', { href: newItem.baseurl, title: newItem.data.title }, { href: oldItem.baseurl });
  }

  build() {
    return this.data;
  }
}
