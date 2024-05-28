import i18n from '../i18n';
import Auth from "./index";
import axios from 'axios';

import { OktaAuth } from '@okta/okta-auth-js';
import Utils from '../utils';

export default class OIDC extends Auth {

  constructor(options, changeListener, router) {
    super(options, authState => changeListener(authState.isAuthenticated, authState?.accessToken?.accessToken));

    this.router = router;
    this.initialized = false;
  }

  async httpRequest(method, url, args = {}) {
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

  getRedirectUri(appPath) {
    let base = this.router.options.base;
    let path = this.router.resolve(appPath).href;
    if (base.endsWith('/') && path.startsWith('/')) {
      base = base.substring(0, base.length - 1);
    }
    return window.location.origin + base + path;
  }

  async init() {
    if (this.initialized) {
      return;
    }

    let oktaOptions = {};
    if (this.options.openIdConnectUrl) {
      Object.assign(oktaOptions, {
        issuer: this.options.openIdConnectUrl.replace(/\/\.well-known\/openid-configuration\/?$/, ''),
        clientId: 'stac-browser',
        redirectUri: this.getRedirectUri('/auth'),
        logoutRedirectUri: this.getRedirectUri('/auth/logout')
      }, this.options.oidcOptions);


      // Workaround for bug https://github.com/okta/okta-auth-js/issues/377
      try {
        let wkd = await axios(this.options.openIdConnectUrl);
        if (Utils.isObject(wkd.data)) {
          if (!oktaOptions.authorizeUrl) {
            oktaOptions.authorizeUrl = wkd.data.authorization_endpoint;
          }
          if (!oktaOptions.userinfoUrl) {
            oktaOptions.userinfoUrl = wkd.data.userinfo_endpoint;
          }
          if (!oktaOptions.tokenUrl) {
            oktaOptions.tokenUrl = wkd.data.token_endpoint;
          }
        }
      } catch (e) {
        console.error(e);
      }
    }

    oktaOptions.restoreOriginalUri = (_, originalUri) => this.restoreOriginalUri(originalUri);
    oktaOptions.httpRequestClient = this.httpRequest.bind(this);

    this.okta = new OktaAuth(oktaOptions);

    this.okta.authStateManager.subscribe(this.changeListener);
    await this.okta.start();
    
    this.initialized = true;
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
  }
  
}
