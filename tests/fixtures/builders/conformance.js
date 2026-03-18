import STACObject from "./object.js";

export default class Conformance extends STACObject {
  constructor(instance) {
    super();
    this.url = 'conformance';
    this.instance = instance;
    this.method = 'GET'
  }

  getAbsoluteUrl() {
    const url = URL.parse(this.url, this.instance.root.getAbsoluteUrl());
    return url.toString();
  }

  build() {
    return {
      conformsTo: this.instance.root.conformsTo
    };
  }
}
