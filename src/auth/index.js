import i18n from '../i18n';

export default class Auth {

  /**
   * Constructs the authentication method.
   * 
   * @param {Object.<string, *>} options  Any potential options the authentication m
   * @param {Function} changeListener A change listener with two parameters: loggedIn (boolean) and accessToken (string|null)
   */
  constructor(options, changeListener) {
    this.options = options;
    this.changeListener = changeListener;
  }

  /**
   * Returns the authentication method identifier.
   * 
   * @returns {string|null}
   */
  getType() {
    return null;
  }

  /**
   * A title for the authentication button.
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
  getUnauthorizedLabel() {
    return i18n.t('authentication.button.authenticate');
  }

  /**
   * A label for the button that is shown when authorized (logged in).
   * 
   * @returns {string}
   */
  getAuthorizedLabel() {
    return i18n.t('authentication.button.authenticated');
  }

  async init() {
    return;
  }

  async login() {
    return null;
  }

  async loginCallback() {
    return;
  }

  async logout(/*credentials*/) {
    return true;
  }

  async close() {
    return;
  }

  static async create(config, changeListener, router) {
    if (!config) {
      return new Auth();
    }
    let method;
    switch (config.type) {
      case 'openIdConnect': {
        const OIDC = (await import('./oidc')).default;
        method = new OIDC(config, changeListener, router);
        break;
      }
      default: {
        // "input" -> let user input auth data, e.g. Bearer Token
        const UserInput = (await import('./userinput')).default;
        method = new UserInput(config, changeListener);
      }
    }
    await method.init();
    return method;
  }
}
