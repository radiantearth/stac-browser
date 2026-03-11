import { Hypermedia } from "./hypermedia";

export class Collection extends Hypermedia {
  constructor(options = {}) {
    super(options);
    this.baseurl = options.baseurl;
    this.data = options.data || {};
  }

  addLicense(license) {
    this.data.license = this.data.license || [];
    this.data.license.push(license);
    return this;
  }

  addKeyword(keyword) {
    this.data.keywords = this.data.keywords || [];
    this.data.keywords.push(keyword);
    return this;
  }

  build() {
    return this.data;
  }
}
