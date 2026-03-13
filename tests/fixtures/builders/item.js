import Stac from "./stac";

export default class Item extends Stac {

  _getMetadataObject() {
    return this.data.properties;
  }

  setMetadata(fields) {
    const metadata = this._getMetadataObject();
    Object.assign(metadata, fields);
    return this;
  }

  removeMetadata(keys) {
    const metadata = this._getMetadataObject();
    keys.forEach((key) => delete metadata[key]);
    return this;
  }

  updateMetadata(fields) {
    return this.setMetadata(fields);
  }
}
