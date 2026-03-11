import { Stac } from "./stac";

export class Item extends Stac {
  constructor(options = {}) {
    super(options);
    this.baseurl = options.baseurl;
    this.data = options.data || {};
  }

  addCollection(collection) {
    this.data.collection = collection;
    return this;
  }

  build() {
    return this.data;
  }
}
