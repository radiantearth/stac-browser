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

  addType(type) {
    this.data.type = type;
    return this;
  }

  addVersion(version) {
    this.data.stac_version = version;
    return this;
  }

  addExtensions(extensions) {
    this.data.stac_extensions = this.data.stac_extensions || [];
    this.data.stac_extensions.push(...extensions);
    return this;
  }

  build() {
    return this.data;
  }
}
