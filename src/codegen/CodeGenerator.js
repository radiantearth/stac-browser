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
  getFiltersAsJson(obj) {
    return JSON.stringify(obj, null, this.indent);
  }

  /**
   * Return a clean filters object suitable for JSON serialization.
   * Strips the internal 'filters' key (Cql object / wrapper) which
   * is not JSON-serializable.
   */
  getCleanFilters(filters) {
    const clean = {};
    for (const [key, value] of Object.entries(filters)) {
      if (key === 'filters' || value === null || value === undefined) {
        continue;
      }
      clean[key] = value;
    }
    return clean;
  }

  formatFilters(filters) {
    return this.getFiltersAsJson(this.getCleanFilters(filters));
  }

  /**
   * Normalize filters so that flat CQL keys (filter, filter-lang) are
   * wrapped into a .filters object with a serialize() method, matching
   * the format used by the UI (Cql object).
   * @param {Object} rawFilters
   * @returns {{ filters: Object, cqlSerialized: Object|null }}
   */
  normalizeFilters(rawFilters) {
    const filters = Object.assign({}, rawFilters);
    const cql = filters.filters;

    // UI path: filters.filters is a Cql object with serialize()
    if (cql && typeof cql.serialize === 'function') {
      return { filters, cqlSerialized: cql.serialize(this.method) };
    }

    // Flat path (integration tests): filter-lang and filter are top-level keys
    if (filters['filter-lang'] || filters.filter !== undefined) {
      const filterLang = filters['filter-lang'];
      const filterValue = filters.filter;
      delete filters['filter-lang'];
      delete filters.filter;
      const serialized = {};
      if (filterLang) {
        serialized['filter-lang'] = filterLang;
      }
      if (filterValue !== undefined) {
        serialized.filter = filterValue;
      }
      filters.filters = { serialize: () => serialized };
      return { filters, cqlSerialized: serialized };
    }

    return { filters, cqlSerialized: null };
  }

  /**
   * Generate the code string using the same request preparation as STAC Browser.
   * @param {Object} rawFilters - Filter params from the UI or integration tests
   * @returns {string}
   */
  generate(rawFilters) {
    const { filters, cqlSerialized } = this.normalizeFilters(rawFilters);
    const isPost = this.method === 'POST';

    // Use Utils.addFiltersToLink for all cases — it handles CQL serialization,
    // query-param encoding (GET), and body construction (POST).
    const preparedLink = Utils.addFiltersToLink(this.searchLink, filters);

    let requestUrl, requestBody;
    if (isPost) {
      requestUrl = this.searchUrl;
      requestBody = JSON.stringify(preparedLink?.body ?? {}, null, this.indent);
    }
    else {
      requestUrl = preparedLink?.href ?? this.searchUrl;
      requestBody = '';
    }

    const variables = {
      ...this.getVariables(filters, cqlSerialized),
      REQUEST_URL: requestUrl,
      REQUEST_BODY: requestBody,
      IS_GET: !isPost,
      IS_POST: isPost,
    };
    return this.renderTemplate(this.getTemplate(filters, cqlSerialized), variables);
  }

  /**
   * Select the template to use for generation.
   * Override in subclasses to pick a different template based on context.
   * @param {Object} filters
   * @param {Object|null} cqlSerialized
   * @returns {string}
   */
  getTemplate(/*filters, cqlSerialized*/) {
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
   * The comment characters used for conditional directives in templates.
   * Override in subclasses to match the language's comment syntax.
   * @returns {string}
   */
  get commentChars() {
    return '##';
  }

  /**
   * Render a template string with __VARIABLE__ substitution and
   * comment-based conditionals (e.g. `## if VAR ##`).
   * Processes innermost conditionals first to support nesting.
   * @param {string} template - Template with __KEY__ placeholders
   * @param {Object<string, *>} vars - Map of placeholder names to values
   * @returns {string}
   */
  renderTemplate(template, vars) {
    let result = this.processConditionals(template, vars);
    for (const [key, value] of Object.entries(vars)) {
      result = result.replaceAll(`__${key}__`, String(value ?? ''));
    }
    return result.replace(/\n{3,}/g, '\n\n').trim();
  }

  /**
   * Process comment-based conditional blocks.
   * E.g. `## if VAR ##` ... `## else ##` ... `## endif ##`
   * Handles nesting by processing innermost blocks first.
   * @param {string} template
   * @param {Object<string, *>} vars
   * @returns {string}
   */
  processConditionals(template, vars) {
    let result = template;
    // todo: use RegExp.escape in the future when supported in all browsers
    const cc = this.commentChars.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(
      `${cc}\\s+if\\s+(\\w+)\\s+${cc}\\n?` +
      `((?:(?!${cc}\\s+if\\s)[\\s\\S])*?)` +
      `${cc}\\s+endif\\s+${cc}\\n?`
    );
    const elseRe = new RegExp(`${cc}\\s+else\\s+${cc}\\n?`);
    let safety = 0;
    while (regex.test(result) && safety++ < 100) {
      result = result.replace(regex, (match, varName, content) => {
        const isTruthy = !!vars[varName];
        const elseMatch = content.match(elseRe);
        if (!elseMatch) {
          return isTruthy ? content : '';
        }
        const elseStart = elseMatch.index;
        const elseEnd = elseStart + elseMatch[0].length;
        return isTruthy
          ? content.substring(0, elseStart)
          : content.substring(elseEnd);
      });
    }
    return result;
  }
}
