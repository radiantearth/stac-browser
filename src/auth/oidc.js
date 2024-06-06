import BrowserStorage from "../browser-store";
import Utils from "../utils";
import Auth from "./index";

import { UserManager } from 'oidc-client-ts';

export default class OIDC extends Auth {

  constructor(options, changeListener, router) {
    super(options, changeListener, router);

    const oidcConfig = {
      authority: options.openIdConnectUrl.replace('/.well-known/openid-configuration', ''),
      client_id: 'stac-browser',
      post_logout_redirect_uri: this.getRedirectUri('/auth/logout'),
      redirect_uri: this.getRedirectUri('/auth'),
      automaticSilentRenew: true
    };
    this.manager = new UserManager(Object.assign(oidcConfig, options.oidcConfig));
    this.manager.events.addAccessTokenExpired(() => changeListener(false));
    this.manager.events.addUserUnloaded(() => changeListener(false));
    this.user = null;
    this.browserStorage = new BrowserStorage();
  }

  setOriginalUri() {
    this.browserStorage.set('oidc-original-uri', this.router?.currentRoute?.fullPath || window.location.href);
  }

  restoreOriginalUri() {
    const originalUri = this.browserStorage.get('oidc-original-uri');
    if (this.router && originalUri) {
      this.router.replace(originalUri);
    }
    this.browserStorage.remove('oidc-original-uri');
  }

  getRedirectUri(appPath) {
    let base = this.router.options.base;
    let path = this.router.resolve(appPath).href;
    if (base.endsWith('/') && path.startsWith('/')) {
      base = base.substring(0, base.length - 1);
    }
    return window.location.origin + base + path;
  }

  async close() {
    await this.manager.removeUser();
    await this.manager.clearStaleState();
  }

  async login() {
    this.setOriginalUri();
    await this.manager.signinRedirect();
    return null;
  }

  async confirmLogin() {
    this.user = await this.manager.signinRedirectCallback();
    await this.changeListener(true, this.user.access_token);
    this.restoreOriginalUri();
  }

  async logout() {
    await this.manager.signoutRedirect();
  }

  async confirmLogout() {
    await this.manager.signoutRedirectCallback();
    await this.changeListener(false);
    this.user = null;
  }

  updateStore(value) {
    if (value) {
      if (typeof this.options.formatter === 'function') {
        value = this.options.formatter(value);
      }
      else {
        value = `Bearer ${value}`;
      }
    }
    if (!Utils.hasText(value)) {
      value = undefined;
    }

    return {
      header: { key: 'Authorization', value }
    };
  }

}
