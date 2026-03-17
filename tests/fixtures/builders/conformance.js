import STACObject from "./object.js";

export default class Conformance extends STACObject {
  constructor(instance) {
    super();
    this.url = '/conformance';
    this.instance = instance;
  }

  getAbsoluteUrl() {
    return `${this.instance.root.getAbsoluteUrl()}${this.url}/`;
  }

  build() {
    return {
      conformsTo: this.instance.root.conformsTo
    };
  }
}
