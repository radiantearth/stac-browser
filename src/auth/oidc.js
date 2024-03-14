import i18n from '../i18n';
import Auth from "./index";
import axios from 'axios';

import { OktaAuth } from '@okta/okta-auth-js';

export default class OIDC extends Auth {

  constructor(options, changeListener, router) {
    super(options, authState => changeListener(authState.isAuthenticated, authState?.accessToken?.accessToken));

    this.router = router;

    let issuer = options.openIdConnectUrl.replace(/\/\.well-known\/openid-configuration\/?$/, '');
    let oktaOptions = Object.assign({ issuer, clientId: 'stac-browser' }, options.oidcOptions);
    oktaOptions.restoreOriginalUri = (_, originalUri) => this.restoreOriginalUri(originalUri);
    oktaOptions.httpRequestClient = this.httpRequest.bind(this);
    this.okta = new OktaAuth(oktaOptions);
  }

  async httpRequest(method, url, args) {
    let headers = Object.assign({}, args.headers);
    // This makes OktaAuth fail with a couple of OIDC instances as it's a custom header, remove it
    delete headers["X-Okta-User-Agent-Extended"];
    let options = {
      method,
      url,
      headers,
      data: args.data,
      withCredentials: args.withCredentials
    };
    let response = await axios(options);
    return response?.request;
  }

  async restoreOriginalUri(originalUri) {
    if (this.router) {
      this.router.replace(originalUri);
    }
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
    this.okta.setOriginalUri(this.router?.currentRoute?.fullPath || window.location.href);
    await this.okta.signInWithRedirect();
    return null;
  }

  async logout() {
    await this.okta.signOut();
    return false; // Don't clear credentials to avoid infinite loop, we'll reload the page anyway
  }

  async loginCallback() {
    if (this.okta.isLoginRedirect()) {
      await this.okta.handleRedirect();
    }
    else {
      console.warn("Called login redirect handler but wasn't redirected from login");
    }
  }
  
}
