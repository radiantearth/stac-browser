export class APICollection {
  constructor() {
    this.collection = {};
  }

  addPaginationLink(rel, href) {
    this.collection.links = this.collection.links || [];
    this.collection.links.push({ rel, href, type: 'application/json', method: 'GET' });
    return this;
  }

  updatePaginationLink(rel, newHref) {
    if (this.collection.links) {
      this.collection.links = this.collection.links.map(link => link.rel === rel ? { ...link, href: newHref } : link);
    }
    return this;
  }

  addPaginationLinks({ nextHref, prevHref, firstHref, lastHref }) {
    this.collection.links = this.collection.links || [];
    if (nextHref) {
      this.collection.links.push({ rel: 'next', href: nextHref, type: 'application/json', method: 'GET' });
    }
    if (prevHref) {
      this.collection.links.push({ rel: 'prev', href: prevHref, type: 'application/json', method: 'GET' });
    }
    if (firstHref) {
      this.collection.links.push({ rel: 'first', href: firstHref, type: 'application/json', method: 'GET' });
    }
    if (lastHref) {
      this.collection.links.push({ rel: 'last', href: lastHref, type: 'application/json', method: 'GET' });
    }
    return this;
  }

  removePaginationLinks() {
    if (this.collection.links) {
      this.collection.links = this.collection.links.filter(link => !['next', 'prev', 'first', 'last'].includes(link.rel));
    }
    return this;
  }

  build() {
    return this.collection;
  }
}
