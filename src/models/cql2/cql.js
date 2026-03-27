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

  /**
   * Serialize CQL based on API capabilities and HTTP method.
   * GET prefers Text (natural for query params), POST prefers JSON.
   * @param {string} method - HTTP method (GET, POST, etc.)
   * @returns {Object} - { "filter-lang": string, filter: string|Object }
   */
  serialize(method) {
    const preferText = typeof method === 'string' && method.toUpperCase() === 'GET';
    if (preferText) {
      if (this.mode?.textMode) {
        return this.toText();
      }
      if (this.mode?.jsonMode) {
        return this.toJSON();
      }
      return this.toText();
    }
    if (this.mode?.jsonMode) {
      return this.toJSON();
    }
    if (this.mode?.textMode) {
      return this.toText();
    }
    return this.toJSON();
  }

}
