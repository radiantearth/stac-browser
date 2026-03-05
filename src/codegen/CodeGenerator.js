import i18n from '../i18n.js';

/**
 * Base class for search code generators.
 * Each subclass represents one programming language.
 */
export default class CodeGenerator {
  /**
   * @param {string} catalogHref - The STAC API endpoint URL
   * @param {Link} searchLink - The STAC API search link object
   * @param {Object} filters - The search filter parameters
   */
  constructor(catalogHref, searchLink) {
    this.catalogHref = catalogHref;
    this.searchLink = searchLink;
  }

  /**
   * The display name of the language (for tabs).
   * @returns {string}
   */
  get label() {
    return i18n.global.t(`programming.${this.language}`);
  }

  /**
   * The syntax highlighter language identifier.
   * @returns {string}
   */
  get language() {
    throw new Error('Subclasses must implement language');
  }

  /**
   * The output filename used when generating runnable snippets.
   * @returns {string}
   */
  get outputFile() {
    throw new Error('Subclasses must implement outputFile');
  }

  get indent() {
    return 0;
  }

  get template() {
    throw new Error('Subclasses must implement template');
  }

  get installDependencies() {
    return null;
  }

  /**
   * Serialize filters to a formatted JSON string.
   * @returns {string}
   */
  getFiltersAsJson(filters) {
    return JSON.stringify(filters, null, this.indent);
  }

  formatFilters(filters) {
    return this.getFiltersAsJson(filters);
  }

  /**
   * Generate the code string.
   * @returns {string}
   */
  generate(filters) {
    const cleanedFilters = this.cleanFilters(filters);
    return this.renderTemplate(this.template, this.getVariables(cleanedFilters));
  }

  getVariables(filters) {
    return {
      CATALOG_URL: this.catalogHref,
      SEARCH_URL: this.searchLink.getAbsoluteUrl(),
      FILTERS: this.formatFilters(filters),
    };
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
}
