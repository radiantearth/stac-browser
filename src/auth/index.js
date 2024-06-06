import i18n from '../i18n';
import Utils from '../utils';

export default class Auth {

  /**
   * Constructs the authentication method.
   * 
   * @param {Object.<string, *>} options  Any potential options the authentication method needs
   * @param {Function} changeListener A change listener with two parameters: loggedIn (boolean) and credentials (string|null)
   * @param {Router} router The Vue router instance
   */
  constructor(options = {}, changeListener = null, router = null) {
    this.options = options;
    this.changeListener = changeListener;
    this.router = router;
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
    return i18n.t('authentication.button.login');
  }

  /**
   * A label for the button that is shown when authorized (logged in).
   * 
   * @returns {string}
   */
  getLogoutLabel() {
    return i18n.t('authentication.button.logout');
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

  static async create(config, changeListener, router) {
    let method = new Auth();
    if (Utils.isObject(config)) {
      if (config.type === 'http' && config.scheme === 'basic') {
        const BasicAuth = (await import('./basic')).default;
        method = new BasicAuth(config, changeListener, router);
      }
      else if (config.type === 'apiKey') {
        const ApIKey = (await import('./apiKey')).default;
        method = new ApIKey(config, changeListener, router);
      }
      else if (config.type === 'openIdConnect') {
        const OIDC = (await import('./oidc')).default;
        method = new OIDC(config, changeListener, router);
      }
    }
    await method.init();
    return method;
  }

  static equals(method, config) {
    return JSON.stringify(method.options) === JSON.stringify(config);
  }

}
