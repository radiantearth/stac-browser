import STACObject from './object.js';

export default class STACHypermedia extends STACObject {
  constructor(instance, data, url) {
    super(data);
    this.url = url;
    this.instance = instance;
    this.addSelfLink();
    this.addRootLink();
  }

  getAbsoluteUrl() {
    return this.url;
  }

  getBrowserPath() {
    const url = new URL(this.url);
    const protocol = url.protocol !== 'https:' ? url.protocol : '';

    const protocolPart = protocol ? `/${url.protocol.replace(':', '')}` : '';
    const browserPath = `/external${protocolPart}/${url.host}${url.pathname}${url.search}`;

    return browserPath;
  }

  addLink(link) {
    this.data.links = this.data.links || [];
    this.data.links.push(link);
    return this;
  }

  removeLink(rel) {
    if (this.data.links) {
      this.data.links = this.data.links.filter(link => link.rel !== rel);
    }
    return this;
  }

  updateLink(rel, newParameters) {
    if (this.data.links) {
      this.data.links = this.data.links.map(link => link.rel === rel ? { ...link, ...newParameters } : link);
    }
    return this;
  }

  addRootLink() {
    if (this.instance?.root) { // skip if this is the root object itself
      return this.addLink({ rel: 'root', href: this.instance.root.getAbsoluteUrl(), type: 'application/json' });
    }
  }

  removeRootLink() {
    return this.removeLink('root');
  }

  updateRootLink(newParameters) {
    return this.updateLink('root', newParameters);
  }

  addSelfLink() {
    return this.addLink({ rel: 'self', href: this.getAbsoluteUrl(), type: 'application/json' });
  }

  removeSelfLink() {
    return this.removeLink('self');
  }

  updateSelfLink(newParameters) {
    return this.updateLink('self', newParameters);
  } 

  build() {
    return this.data;
  }
}
