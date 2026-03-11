export class STACObject {
  constructor(data, absoluteUrl) {
    this.data = data || {};
    this.absoluteUrl = absoluteUrl || null;
  }

  _getMetadataObject() {
    return this;
  }

  getAbsoluteUrl() {
    return this.absoluteUrl;
  }
  
  setMetadata(pairs) {
    const metadata = this._getMetadataObject();
    pairs.forEach(([key, value]) => {
      metadata[key] = value;
    });
    return this;
  }

  removeMetadata(keys) {
    const metadata = this._getMetadataObject();
    keys.forEach((key) => {
      delete metadata[key];
    });
    return this;
  }

  updateMetadata(updates) {
    const metadata = this._getMetadataObject();
    Object.entries(updates).forEach(([key, value]) => {
      metadata[key] = value;
    });
    return this;
  }

  build() {
    return this.data;
  }
}
