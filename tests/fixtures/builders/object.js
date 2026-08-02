export default class STACObject {
  constructor(data) {
    this.data = data;
  }
  
  _getMetadataObject() {
    return this.data;
  }
  
  getAbsoluteUrl() {
    return null;
  }
  
  getMethod() {
    if(!this.method){
      return null;
    }
    
    return this.method.toUpperCase() || 'GET';
  }
  
  setMethod(method) {
    this.method = method.toUpperCase();
    return this;
  }
  
  setMetadata(fields) {
    const metadata = this._getMetadataObject();
    Object.assign(metadata, fields);
    return this;
  }
  
  getMetadata() {
    return this._getMetadataObject();
  }
  
  removeMetadata(keys) {
    const metadata = this._getMetadataObject();
    keys.forEach((key) => delete metadata[key]);
    return this;
  }
  
  updateMetadata(fields) {
    return this.setMetadata(fields);
  }
  
  build() {
    return this.data;
  }
}
