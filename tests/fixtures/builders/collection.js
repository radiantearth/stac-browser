import { CatalogLike } from "./catalogLike";

export class Collection extends CatalogLike {
  constructor(data) {
    super(data);
    this.data = data || {};
  }

  addLicense(license) {
    this.data.license = this.data.license || [];
    this.data.license.push(license);
    return this;
  }

  removeLicense(license) {
    if (this.data.license) {
      this.data.license = this.data.license.filter(l => l !== license);
    }
    return this;
  }

  updateLicense(oldLicense, newLicense) {
    if (this.data.license) {
      this.data.license = this.data.license.map(l => l === oldLicense ? newLicense : l);
    }
    return this;
  }

  addKeyword(keyword) {
    this.data.keywords = this.data.keywords || [];
    this.data.keywords.push(keyword);
    return this;
  }

  removeKeyword(keyword) {
    if (this.data.keywords) {
      this.data.keywords = this.data.keywords.filter(k => k !== keyword);
    }
    return this;
  }

  updateKeyword(oldKeyword, newKeyword) {
    if (this.data.keywords) {
      this.data.keywords = this.data.keywords.map(k => k === oldKeyword ? newKeyword : k);
    }
    return this;
  }

    addExtent(type, value) {
    this.data.extent = this.data.extent || {};
    this.data.extent[type] = this.data.extent[type] || {};

    this.data.extent[type] = value;
    return this;
  }

  updateExtent(type, newValue) {
    if (this.data.extent && this.data.extent[type]) {
      this.data.extent[type] = newValue;
    }
    return this;
  }

  removeExtent(type) {
    if (this.data.extent && type in this.data.extent) {
      delete this.data.extent[type];
      if (Object.keys(this.data.extent).length === 0) {
        delete this.data.extent;
      }
    }
    return this;
  }

  build() {
    return this.data;
  }
}
