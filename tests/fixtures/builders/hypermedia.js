export class Hypermedia {
  constructor(options = {}) {
    this.baseurl = options.baseurl;
    this.data = options.data || {};
  }

  addLink(parameters) {
    this.data.links = this.data.links || [];
    this.data.links.push(parameters);
    return this;
  }

  addRootLink() {
    return this.addLink({ rel: 'root', href: this.baseurl, type: 'application/json' });
  }

  addSelfLink() {
    return this.addLink({ rel: 'self', href: this.baseurl, type: 'application/json' });
  }

  build() {
    return this.data;
  }
}
