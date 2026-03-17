import STACHypermedia from "./hypermedia";

export default class APICollection extends STACHypermedia {
  constructor(instance, data, url) {
    super(instance, data, url);
  }

  addPaginationLink(rel, href) {
    this.data.links = this.data.links || [];
    this.data.links.push({ rel, href, type: 'application/json', method: 'GET' });
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
      this.data.links.push({ rel: 'next', href: nextHref, type: 'application/json', method: 'GET' });
    }
    if (prevHref) {
      this.data.links.push({ rel: 'prev', href: prevHref, type: 'application/json', method: 'GET' });
    }
    if (firstHref) {
      this.data.links.push({ rel: 'first', href: firstHref, type: 'application/json', method: 'GET' });
    }
    if (lastHref) {
      this.data.links.push({ rel: 'last', href: lastHref, type: 'application/json', method: 'GET' });
    }
    return this;
  }

  removePaginationLinks() {
    if (this.data.links) {
      this.data.links = this.data.links.filter(link => !['next', 'prev', 'first', 'last'].includes(link.rel));
    }
    return this;
  }
}
