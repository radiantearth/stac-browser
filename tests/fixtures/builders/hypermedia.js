import STACObject from './object.js';

export default class STACHypermedia extends STACObject {
  constructor(instance, data, link) {
    super(data);
    
    //check whether link is url or link object
    if (typeof link === 'object' && link.href) {
      this.url = link.href;
      this.method = link.method || 'GET';
      this.headers = link.headers || undefined;
      this.body = link.body || undefined;
    } else {
      this.url = link;
      this.method = 'GET';
      this.headers = undefined;
      this.body = undefined;
    }
    
    this.instance = instance;
    this.addSelfLink();
    if (this.instance.root) { // skip if this is the root object itself
      this.addRootLink();
    }
  }
  
  getAbsoluteUrl() {
    if (URL.canParse(this.url)) {
      return this.url;
    } else {
      const url = URL.parse(this.url, this.instance.root.getAbsoluteUrl());
      return url.toString();
    }
  }
  
  getBrowserPath() {
    try{
      const url = new URL(this.getAbsoluteUrl());
      const protocol = url.protocol !== 'https:' ? url.protocol : '';
      
      const protocolPart = protocol ? `/${url.protocol.replace(':', '')}` : '';
      const browserPath = `/external${protocolPart}/${url.host}${url.pathname}${url.search}`;
      
      return browserPath;
    } catch (e) { 
      console.log(e);
      console.log(this.url);
    }
  }
  
  getSearchPath() {
    try{
      const url = new URL(this.getAbsoluteUrl());
      const protocol = url.protocol !== 'https:' ? url.protocol : '';
      
      const protocolPart = protocol ? `/${url.protocol.replace(':', '')}` : '';
      const searchPath = `/search/external${protocolPart}/${url.host}${url.pathname}${url.search}`;
      
      return searchPath;
    } catch (e) { 
      console.log(e);
      console.log(this.url);
    }
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
    return this.addLink({ rel: 'root', href: this.instance.root.getAbsoluteUrl(), type: 'application/json' });
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
  
}
