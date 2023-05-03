export default class Cql {

  constructor(filters) {
    this.filters = filters;
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

}