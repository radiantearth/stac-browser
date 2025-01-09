import BrowserStorage from "../browser-store";
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
    this.user = null;
    this.manager = new UserManager(Object.assign(oidcConfig, options.oidcConfig));
    const callback = this.setUser.bind(this);
    this.manager.events.addAccessTokenExpired(callback);
    this.manager.events.addUserLoaded(callback);
    this.manager.events.addUserUnloaded(callback);
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
    const path = this.router.resolve(appPath).href;
    return window.location.origin + path;
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
    const user = await this.manager.signinRedirectCallback();
    await this.setUser(user);
    this.restoreOriginalUri();
  }

  async logout() {
    await this.manager.signoutRedirect();
  }

  async confirmLogout() {
    await this.manager.signoutRedirectCallback();
    await this.setUser(null);
  }

  async setUser(user = null) {
    this.user = user;
    if (user) {
      await this.changeListener(true, user.access_token);
    }
    else {
      await this.changeListener(false);
    }
  }

  updateStore(value) {
    return this._updateStore(value, 'Authorization', 'header', 'Bearer');
  }

}
