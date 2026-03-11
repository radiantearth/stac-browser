import { Stac } from "./stac";

export class CatalogLike extends Stac {
  constructor(options = {}) {
    super(options);
    this.baseurl = options.baseurl;
    this.data = options.data || {};
  }

  addTitle(title) {
    this.data.title = title;
    return this;
  }

  addDescription(description) {
    this.data.description = description;
    return this;
  }

  addSearchLink() {
    return this.addLink({ rel: 'search', href: this.baseurl + '/search', type: 'application/geo+json' });
  }

  build() {
    return this.data;
  }
}
