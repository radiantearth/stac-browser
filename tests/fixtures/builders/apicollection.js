import STACHypermedia from "./hypermedia.js";

export default class APICollection extends STACHypermedia {
  constructor(instance, data, url) {
    super(instance, data, url);
    
    const configuredMethod = typeof this.instance.options.method === 'string'
      ? this.instance.options.method.toUpperCase()
      : 'GET';
    this.method = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'].includes(configuredMethod)
      ? configuredMethod
      : 'GET';
    
    //default to false if not set
    this.prevEnabled = typeof this.instance.options.prevLinkEnabled === 'boolean' 
      ? this.instance.options.prevLinkEnabled : false;
    this.firstEnabled = typeof this.instance.options.firstLinkEnabled === 'boolean'
      ? this.instance.options.firstLinkEnabled : false;
    this.lastEnabled = typeof this.instance.options.lastLinkEnabled === 'boolean'
      ? this.instance.options.lastLinkEnabled : false;
    this.defaultLimit = typeof this.instance.options.defaultLimit === 'number'
      ? this.instance.options.defaultLimit : 10;  
  };
  
  addPaginationLink(rel, href) {
    this.data.links = this.data.links || [];
    this.data.links.push({ rel, href, type: 'application/json'});
    return this;
  }
  
  updatePaginationLink(rel, newHref) {
    if (this.data.links) {
      this.data.links = this.data.links.map(link => link.rel === rel ? { ...link, href: newHref } : link);
    }
    return this;
  }
  
  addPaginationLinks({ nextHref, prevHref, firstHref, lastHref }) {
    this.data.links = this.data.links || [];
    if (nextHref) {
      this.data.links.push({ rel: 'next', href: nextHref, type: 'application/json'});
    }
    if (prevHref) {
      this.data.links.push({ rel: 'prev', href: prevHref, type: 'application/json'});
    }
    if (firstHref) {
      this.data.links.push({ rel: 'first', href: firstHref, type: 'application/json'});
    }
    if (lastHref) {
      this.data.links.push({ rel: 'last', href: lastHref, type: 'application/json'});
    }
    return this;
  }
  
  removePaginationLinks() {
    if (this.data.links) {
      this.data.links = this.data.links.filter(link => !['next', 'prev', 'first', 'last'].includes(link.rel));
    }
    return this;
  }
  
  paginateData(key, { limit = this.defaultLimit, page = 1 } = {}) {
    //key exists in dta and is an array
    if (!(this.data[key] && Array.isArray(this.data[key]))){
      throw new Error(`Cannot paginate data: data[${key}] is not an array`);
    }
    
    // ensure integers
    limit = parseInt(limit);
    page = parseInt(page);
    
    // Preserve full dataset on first call to enable re-pagination
    if (!this._fullData) {
      this._fullData = {};
    }
    if (!this._fullData[key]) {
      this._fullData[key] = [...this.data[key]];
    }
    
    // using _fullData to preserve the initial list of items. bit hacky...
    const fullItemList = this._fullData[key];
    const totalItems = fullItemList.length;
    const currentIndex = (page - 1) * limit;
    const currentEndIndex = currentIndex + limit;
    
    this.data[key] = fullItemList.slice(currentIndex, currentEndIndex);
    this.data.numberMatched = totalItems;
    this.data.numberReturned = this.data[key].length;
    
    //add links
    const nextPage = page + 1;
    const prevPage = page - 1;
    const totalPages = Math.ceil(totalItems / limit);
    
    const nextHref = currentEndIndex < totalItems ? `${this.getAbsoluteUrl()}?page=${nextPage}&limit=${limit}` : null;
    const prevHref = this.prevEnabled && (page > 1) ? `${this.getAbsoluteUrl()}?page=${prevPage}&limit=${limit}` : null;
    const firstHref = this.firstEnabled && (page > 1) ? `${this.getAbsoluteUrl()}?page=1&limit=${limit}` : null;
    const lastHref = this.lastEnabled && (page < totalPages) ? `${this.getAbsoluteUrl()}?page=${totalPages}&limit=${limit}` : null;
    this.removePaginationLinks();
    this.addPaginationLinks({ nextHref, prevHref, firstHref, lastHref });
    
    return this;
  }
}
