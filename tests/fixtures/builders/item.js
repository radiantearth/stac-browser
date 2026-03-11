import { Stac } from "./stac";

export class Item extends Stac {
  constructor(data) {
    super(data);
    this.data = data || {};
  }

  _getMetadataObject() {
    return this.data.properties;
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
