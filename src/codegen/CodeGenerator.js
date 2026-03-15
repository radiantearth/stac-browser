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
    this.cleanedFilters = this.cleanFilters(filters);

    // Build link filters with pre-serialized CQL so addFiltersToLink
    // doesn't override the format chosen by serializeCqlFilter
    const linkFilters = { ...filters };
    if (linkFilters.filters) {
      delete linkFilters.filters;
      if (this.cleanedFilters.filter !== undefined) {
        // For GET query params, a JSON filter object must be stringified
        linkFilters.filter = (this.method === 'GET' && typeof this.cleanedFilters.filter === 'object')
          ? JSON.stringify(this.cleanedFilters.filter)
          : this.cleanedFilters.filter;
      }
      if (this.cleanedFilters['filter-lang']) {
        linkFilters['filter-lang'] = this.cleanedFilters['filter-lang'];
      }
    }
    this.preparedLink = Utils.addFiltersToLink(this.searchLink, linkFilters);

    const result = this.renderTemplate(this.template, this.getVariables(this.cleanedFilters));
    this.preparedLink = null;
    this.cleanedFilters = null;
    return result;
  }

  get requestUrl() {
    return this.preparedLink?.href ?? this.searchUrl;
  }

  get requestBody() {
    if (this.preparedLink?.body) {
      return JSON.stringify(this.preparedLink.body, null, this.indent);
    }
    return '';
  }

  getVariables(filters) {
    return {
      CATALOG_URL: this.catalogHref,
      SEARCH_URL: this.searchLink.getAbsoluteUrl(),
      SEARCH_METHOD: this.method,
      RESULT_ARRAY_KEY: this.resultArrayKey,
      FILTERS: this.formatFilters(filters),
      REQUEST_URL: this.requestUrl,
      REQUEST_BODY: this.requestBody,
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

      if (key === 'filters') {
        const serializedFilter = this.serializeCqlFilter(value);
        if (isEmpty(serializedFilter)) {
          return cleaned;
        }
        Object.assign(cleaned, serializedFilter);
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

  serializeCqlFilter(value) {
    if (!value) {
      return null;
    }
    if (this.method === 'GET') {
      // GET: prefer CQL2 Text (natural for query params), fall back to JSON
      if (value.mode?.textMode) {
        return value.toText();
      }
      if (value.mode?.jsonMode) {
        return value.toJSON();
      }
    }
    else {
      // POST/QUERY/others: prefer JSON
      if (value.mode?.jsonMode) {
        return value.toJSON();
      }
      if (value.mode?.textMode) {
        return value.toText();
      }
    }
    return value;
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
