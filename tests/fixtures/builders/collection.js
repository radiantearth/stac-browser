import { CatalogLike } from "./catalogLike";

export class Collection extends CatalogLike {
  constructor(data) {
    super(data);
    this.data = data || {};
  }

  addKeyword(keyword) {
    this.data.keywords = this.data.keywords || [];
    this.data.keywords.push(keyword);
    return this;
  }

  removeKeyword(keyword) {
    if (this.data.keywords) {
      this.data.keywords = this.data.keywords.filter(k => k !== keyword);
    }
    return this;
  }

  updateKeyword(oldKeyword, newKeyword) {
    if (this.data.keywords) {
      this.data.keywords = this.data.keywords.map(k => k === oldKeyword ? newKeyword : k);
    }
    return this;
  }

  build() {
    return this.data;
  }
}
