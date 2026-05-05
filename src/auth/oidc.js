import Auth from "./index";

import { UserManager } from 'oidc-client-ts';

export default class OIDC extends Auth {

  constructor(router, options, changeListener) {
    super(router, options, changeListener);

    const oidcConfig = {
      authority: options.openIdConnectUrl.replace('/.well-known/openid-configuration', ''),
      client_id: 'stac-browser',
      post_logout_redirect_uri: this.getRedirectUri('/auth/logout'),
      redirect_uri: this.getRedirectUri('/auth'),
      automaticSilentRenew: true
    };
    this.user = null;
    this.manager = new UserManager(Object.assign(oidcConfig, options.oidcConfig));
    this.manager.events.addUserLoaded(async () => this.setUser(await this.manager.getUser()));
    this.manager.events.addAccessTokenExpired(() => this.setUser(null));
    this.manager.events.addUserUnloaded(() => this.setUser(null));
  }

  async resume() {
    await super.resume();
    let user = await this.manager.getUser();
    if (user && user.expired && user.refresh_token) {
      user = await this.manager.signinSilent();
    }

    if (user && !user.expired) {
      await this.setUser(user);
      return true;
    }
    return false;
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
    await super.login();
    await this.manager.signinRedirect();
    return null;
  }

  async confirmLogin() {
    const user = await this.manager.signinRedirectCallback();
    await this.setUser(user);
    this.restoreOriginalUri();
  }

  async logout(credentials) {
    await super.logout(credentials);
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
