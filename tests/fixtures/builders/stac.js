import { Hypermedia } from './hypermedia.js';

export class Stac extends Hypermedia {
  constructor(options = {}) {
    super(options);
    this.baseurl = options.baseurl;
    this.data = options.data || {};
  }

  addId(id) {
    this.data.id = id;
    return this;
  }

  removeId() {
    delete this.data.id;
    return this;
  }

  updateId(newId) {
    this.data.id = newId;
    return this;
  }

  addType(type) {
    this.data.type = type;
    return this;
  }

  removeType() {
    delete this.data.type;
    return this;
  }

  updateType(newType) {
    this.data.type = newType;
    return this;
  }

  addStacVersion(version) {
    this.data.stac_version = version;
    return this;
  }

  removeStacVersion() {
    delete this.data.stac_version;
    return this;
  }

  updateStacVersion(newVersion) {
    this.data.stac_version = newVersion;
    return this;
  }

  addExtensions(extensions) {
    this.data.stac_extensions = this.data.stac_extensions || [];
    this.data.stac_extensions.push(...extensions);
    return this;
  }

  removeExtension(extension) {
    if (this.data.stac_extensions) {
      this.data.stac_extensions = this.data.stac_extensions.filter(ext => ext !== extension);
    }
    return this;
  }

  addExtension(extension) {
    this.data.stac_extensions = this.data.stac_extensions || [];
    if (!this.data.stac_extensions.includes(extension)) {
      this.data.stac_extensions.push(extension);
    }
    return this;
  }

  build() {
    return this.data;
  }
}
