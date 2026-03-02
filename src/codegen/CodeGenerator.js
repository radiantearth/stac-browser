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
   * The output filename used when generating runnable snippets.
   * @returns {string}
   */
  static get outputFile() {
    throw new Error('Subclasses must implement outputFile');
  }

  /**
   * Generate the code string.
   * @returns {string}
   */
  generate() {
    throw new Error('Subclasses must implement generate()');
  }

  /**
   * Render a template string by replacing {{KEY}} placeholders with values.
   * Collapses excessive blank lines for clean output.
   * @param {string} template - Template with {{KEY}} placeholders
   * @param {Object<string, string>} vars - Map of placeholder names to values
   * @returns {string}
   */
  renderTemplate(template, vars) {
    // Replace each {{KEY}} with its value
    let result = template;
    for (const [key, value] of Object.entries(vars)) {
      result = result.replaceAll(`{{${key}}}`, String(value));
    }
    // Collapse 3+ consecutive newlines into 2 (one blank line)
    result = result.replace(/\n{3,}/g, '\n\n');
    return result.trim();
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
    const isEmpty = value => (
      value === null ||
      value === undefined ||
      (Array.isArray(value) && value.length === 0) ||
      (typeof value === 'object' && !Array.isArray(value) && Object.keys(value).length === 0)
    );

    return Object.entries(filters).reduce((cleaned, [key, value]) => {
      if (isEmpty(value)) {
        return cleaned;
      }

      if (key === 'datetime') {
        const datetime = this.normalizeDatetime(value);
        if (datetime) {
          cleaned[key] = datetime;
        }
        return cleaned;
      }

      cleaned[key] = value;
      return cleaned;
    }, {});
  }

  normalizeDatetime(value) {
    if (!value) {
      return null;
    }
    const toIsoString = part => {
      if (part === null || part === undefined || part === '') {
        return null;
      }
      return part instanceof Date ? part.toISOString() : String(part);
    };

    if (!Array.isArray(value)) {
      return toIsoString(value);
    }

    const [start, end] = value;
    const startValue = toIsoString(start);
    const endValue = toIsoString(end);
    return startValue && endValue ? `${startValue}/${endValue}` : null;
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
