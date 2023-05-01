export default class Cql {

  static toJSON(filter) {
    return {
      "filter-lang": "cql2-json",
      filter: filter.toJSON()
    };
  }

  static toText(filter) {
    return {
      "filter-lang": "cql2-text",
      filter: filter.toText()
    };
  }

}