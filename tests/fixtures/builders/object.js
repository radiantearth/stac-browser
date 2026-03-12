export default class STACObject {
  constructor(data) {
    this.data = data;
  }

  _getMetadataObject() {
    return this;
  }

  getAbsoluteUrl() {
    return null;
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
