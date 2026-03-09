// https://docs.ogc.org/DRAFTS/21-065.html

export default class Cql {

  constructor(filters, mode = {}) {
    this.filters = filters;
    this.mode = mode;
  }

  toJSON() {
    return {
      "filter-lang": "cql2-json",
      filter: this.filters.toJSON()
    };
  }

  toText() {
    return {
      "filter-lang": "cql2-text",
      filter: this.filters.toText()
    };
  }

  toPost() {
    if (this.mode?.jsonMode) {
      return this.toJSON();
    }
    if (this.mode?.textMode) {
      return this.toText();
    }
    return this.toJSON();
  }

}
