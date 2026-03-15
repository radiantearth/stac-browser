import i18n from '../i18n.js';
import Utils from '../utils.js';

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

  get method() {
    const method = this.searchLink?.method;
    return typeof method === 'string' ? method.toUpperCase() : 'GET';
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
    const preparedLink = Utils.addFiltersToLink(this.searchLink, filters);
    const template = this.getTemplate(cleanedFilters);
    const variables = {
      ...this.getVariables(cleanedFilters),
      REQUEST_URL: preparedLink?.href ?? this.searchUrl,
      REQUEST_BODY: preparedLink?.body ? JSON.stringify(preparedLink.body, null, this.indent) : '',
    };
    return this.renderTemplate(template, variables);
  }

  getTemplate(_cleanedFilters) {
    return this.template;
  }

  getVariables(filters) {
    return {
      CATALOG_URL: this.catalogHref,
      SEARCH_URL: this.searchLink.getAbsoluteUrl(),
      SEARCH_METHOD: this.method,
      RESULT_ARRAY_KEY: this.resultArrayKey,
      FILTERS: this.formatFilters(filters),
    };
  }

  get searchUrl() {
    return this.searchLink.getAbsoluteUrl();
  }

  get isCollectionSearch() {
    try {
      const pathname = new URL(this.searchUrl).pathname.replace(/\/+$/, '');
      return pathname.endsWith('/collections');
    }
    catch {
      return false;
    }
  }

  get resultArrayKey() {
    return this.isCollectionSearch ? 'collections' : 'features';
  }

  /**
   * Render a template string by replacing __KEY__ placeholders with values.
   * Collapses excessive blank lines for clean output.
   * @param {string} template - Template with __KEY__ placeholders
   * @param {Object<string, string>} vars - Map of placeholder names to values
   * @returns {string}
   */
  renderTemplate(template, vars) {
    let result = template;
    for (const [key, value] of Object.entries(vars)) {
      result = result.replaceAll(`__${key}__`, String(value));
    }
    return result.trim();
  }

  /**
   * Remove null/empty values and normalize special keys for clean code output.
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

    const cleaned = {};
    for (const [key, value] of Object.entries(filters)) {
      if (isEmpty(value)) {
        continue;
      }
      if (key === 'filters') {
        Object.assign(cleaned, value.serialize(this.method));
        continue;
      }
      if (key === 'datetime') {
        const datetime = Utils.formatDatetimeQuery(value);
        if (datetime) {
          cleaned[key] = datetime;
        }
        continue;
      }
      cleaned[key] = value;
    }
    return cleaned;
  }
}
