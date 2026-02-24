/**
 * Base class for search code generators.
 * Each subclass represents one programming language.
 */
export default class CodeGenerator {
  /**
   * @param {string} catalogHref - The STAC API endpoint URL
   * @param {Object} filters - The search filter parameters
   */
  constructor(catalogHref, filters) {
    this.catalogHref = catalogHref;
    this.filters = this.cleanFilters(filters);
  }

  /**
   * The display name of the language (for tabs).
   * @returns {string}
   */
  static get label() {
    throw new Error('Subclasses must implement label');
  }

  /**
   * The syntax highlighter language identifier.
   * @returns {string}
   */
  static get language() {
    throw new Error('Subclasses must implement language');
  }

  /**
   * Generate the code string.
   * @returns {string}
   */
  generate() {
    throw new Error('Subclasses must implement generate()');
  }

  /**
   * Remove null/empty values from filters to produce clean code.
   * @param {Object} filters
   * @returns {Object}
   */
  cleanFilters(filters) {
    if (!filters || typeof filters !== 'object') {
      return {};
    }
    const cleaned = {};
    for (const [key, value] of Object.entries(filters)) {
      if (value === null || value === undefined) {
        continue;
      }
      if (Array.isArray(value) && value.length === 0) {
        continue;
      }
      if (typeof value === 'object' && !Array.isArray(value) && Object.keys(value).length === 0) {
        continue;
      }
      cleaned[key] = value;
    }
    return cleaned;
  }

  /**
   * Serialize filters to a formatted JSON string.
   * @param {number} indent
   * @returns {string}
   */
  filtersJson(indent = 2) {
    return JSON.stringify(this.filters, null, indent);
  }

  /**
   * Check whether there are any active filters.
   * @returns {boolean}
   */
  hasFilters() {
    return Object.keys(this.filters).length > 0;
  }
}
