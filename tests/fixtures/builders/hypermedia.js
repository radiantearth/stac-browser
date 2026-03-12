import STACObject from './object.js';

export default class STACHypermedia extends STACObject {
  constructor(data, url) {
    super(data);
    this.url = url;
  }

  getAbsoluteUrl() {
    return this.url;
  }

  getBrowserPath() {
  const url = new URL(this.url);
  const protocol = url.protocol !== 'https:' ? url.protocol : '';
  
  const protocolPart = protocol ? `/${protocol}` : '';
  const browserPath = `/external${protocolPart}/${url.host}${url.pathname}${url.search}`;

  return browserPath;
  }

  addLink(parameters) {
    this.data.links = this.data.links || [];
    this.data.links.push(parameters);
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
    return this.addLink({ rel: 'root', href: this.absoluteUrl, type: 'application/json' });
  }

  removeRootLink() {
    return this.removeLink('root');
  }

  updateRootLink(newParameters) {
    return this.updateLink('root', newParameters);
  }

  addSelfLink() {
    return this.addLink({ rel: 'self', href: this.absoluteUrl, type: 'application/json' });
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
