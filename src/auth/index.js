import Utils from '../utils';

export default class Auth {

  /**
   * Constructs the authentication method.
   * 
   * @param {Router} router The Vue router instance
   * @param {Object.<string, *>} options  Any potential options the authentication method needs
   * @param {Function} changeListener A change listener with two parameters: loggedIn (boolean) and credentials (string|null)
   */
  constructor(router, i18n = null, options = {}, changeListener = null) {
    this.router = router;
    this.i18n = i18n;
    this.options = options;
    this.changeListener = changeListener;
  }

  /**
   * A tooltip title for the authentication button.
   * 
   * @returns {string}
   */
  getButtonTitle() {
    return null;
  }

  /**
   * A label for the button that is shown when unauthorized (logged out).
   * 
   * @returns {string}
   */
  getLoginLabel() {
    return this.i18n.t('authentication.button.login');
  }

  /**
   * A label for the button that is shown when authorized (logged in).
   * 
   * @returns {string}
   */
  getLogoutLabel() {
    return this.i18n.t('authentication.button.logout');
  }

  getComponent() {
    return null;
  }

  getComponentProps() {
    return {};
  }

  async init() {
    return;
  }

  async login() {
  }

  async confirmLogin(credentials) {
    if (this.changeListener) {
      await this.changeListener(true, credentials);
    }
  }

  async logout(/*credentials*/) {
  }

  async confirmLogout() {
    if (this.changeListener) {
      await this.changeListener(false);
    }
  }

  async close() {
    return;
  }

  updateStore(/*value*/) {
    return {};
  }

  _updateStore(value, defaultName = null, defaultIn = null, defaultFormatter = null) {
    const formatter = this.options.formatter || defaultFormatter;
    const key = this.options.name || defaultName;
    const in_ = this.options.in || defaultIn;

    // Format the credentials
    if (value) {
      if (formatter === 'Bearer') {
        value = `Bearer ${value}`;
      }
      else if (typeof formatter === 'function') {
        value = formatter(value);
      }
    }
    if (!Utils.hasText(value)) {
      value = undefined;
    }

    // Set cookie, query or request parameters
    if (in_ === 'query') {
      return { query: { type: 'private', key, value } };
    }
    else if (in_ === 'cookie') {
      return { cookie: { key, value } };
    }
    else if (in_ === 'header') {
      return { header: { key, value } };
    }
    else {
      return {};
    }
  }

  static async create(router, i18n, config, changeListener) {
    let method = new Auth(router, i18n, config, changeListener);
    if (Utils.isObject(config)) {
      if (config.type === 'http' && config.scheme === 'basic') {
        const BasicAuth = (await import('./basic')).default;
        method = new BasicAuth(router, i18n, config, changeListener);
      }
      else if (config.type === 'apiKey') {
        const ApIKey = (await import('./apiKey')).default;
        method = new ApIKey(router, i18n, config, changeListener);
      }
      else if (config.type === 'openIdConnect') {
        const OIDC = (await import('./oidc')).default;
        method = new OIDC(router, i18n, config, changeListener);
      }
    }
    await method.init();
    return method;
  }

  static equals(method, config) {
    return JSON.stringify(method.options) === JSON.stringify(config);
  }

}
