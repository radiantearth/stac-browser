import STACObject from "./object.js";
import URI from 'urijs';

export default class Conformance extends STACObject {
  constructor(instance) {
    super();
    this.url = 'conformance';
    this.instance = instance;
    this.method = 'GET';
  }
  
  getAbsoluteUrl() {
    const absoluteUrl = URI(this.url, this.instance.root.getAbsoluteUrl());
    return absoluteUrl.toString();
  }
  
  build() {
    return {
      conformsTo: this.instance.root.conformsTo
    };
  }
}
