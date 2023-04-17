import i18n from '../i18n';
import Auth from "./index";

import { OktaAuth, toRelativeUrl  } from '@okta/okta-auth-js';

export default class OIDC extends Auth {

  constructor(options, changeListener, router) {
    super(options, authState => changeListener(authState.isAuthenticated, authState?.accessToken?.accessToken));

    options.restoreOriginalUri = async (oktaAuth, originalUri) => {
      // If a router is available, provide a default implementation
      if (router) {
        const path = toRelativeUrl(originalUri || '/', window.location.origin);
        router.replace({ path });
      }
    }

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

  async loginCallback() {
    await this.okta.handleLoginRedirect();
  }

  async logoutCallback() {
    await this.okta.handleLoginRedirect(); // Correct?
  }
  
}