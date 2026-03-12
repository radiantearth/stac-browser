import STACHypermedia from './hypermedia.js';

export default class Stac extends STACHypermedia {
  constructor(options = {}) {
    super(options);
    this.baseurl = options.baseurl;
    this.data = options.data || {};
  }

  addExtensions(extensions) {
    this.data.stac_extensions = this.data.stac_extensions || [];
    this.data.stac_extensions.push(...extensions);
    return this;
  }

  removeFromExtensions(extension) {
    if (this.data.stac_extensions) {
      this.data.stac_extensions = this.data.stac_extensions.filter(ext => ext !== extension);
    }
    return this;
  }

  removeExtensions() {
    delete this.data.stac_extensions;
    return this;
  }

  addToExtensions(extension) {
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
