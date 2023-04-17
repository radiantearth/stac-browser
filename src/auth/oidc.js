import i18n from '../i18n';
import Auth from "./index";

import { OktaAuth } from '@okta/okta-auth-js';

export default class OIDC extends Auth {

  constructor(options, changeListener) {
    super(options, authState => changeListener(authState.isAuthenticated, authState.accessToken));

    // Set httpRequestClient
    this.okta = new OktaAuth(options);
  }

  async init() {
    this.okta.authStateManager.subscribe(this.changeListener);
    await this.okta.start();
  }

  async close() {
    await this.okta.stop();
    this.okta.authStateManager.unsubscribe(this.changeListener);
  }

  getType() {
    return 'oidc';
  }

  /**
   * A label for the button that is shown when unauthorized (logged out).
   * 
   * @returns {string}
   */
  getUnauthorizedLabel() {
    return i18n.t('authentication.button.login');
  }

  /**
   * A label for the button that is shown when authorized (logged in).
   * 
   * @returns {string}
   */
  getAuthorizedLabel() {
    return i18n.t('authentication.button.logout');
  }

  async login() {
    this.okta.setOriginalUri();
    await this.okta.signInWithRedirect();
  }

  async logout() {
    await this.okta.signOut();
  }
  
}