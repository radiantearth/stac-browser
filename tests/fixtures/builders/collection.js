import CatalogLike from "./catalogLike";

export default class Collection extends CatalogLike {

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
}
