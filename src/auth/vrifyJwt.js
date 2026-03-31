import Auth from "./index";
import BrowserStorage from "../browser-store";
import i18n from '../i18n';
import { hasText } from 'stac-js/src/utils.js';

const KEY_TOKEN = 'vrify-jwt';
const KEY_REFRESH = 'vrify-refresh-token';
const KEY_RETURN_URI = 'vrify-return-uri';

/**
 * Authentication method for Vrify JWT tokens.
 *
 * Redirects the user to the configured `loginUrl` (e.g. Django SSO), which is
 * expected to return the user to the `/auth` callback with `?token=<jwt>` (and
 * optionally `?refresh=<rt>`) as query parameters.
 *
 * Config shape (authConfig in config.js):
 * {
 *   type: AUTH_TYPE_VRIFY_JWT,
 *   loginUrl: 'https://services.vrify.com' + VRIFY_AUTH_PATH,   // required
 *   refreshUrl: 'https://services.vrify.com' + VRIFY_AUTH_REFRESH_PATH, // optional – enables auto-refresh
 *   tokenParam: 'token',   // optional, default 'token'
 *   refreshParam: 'refresh' // optional, default 'refresh' (djangorestframework-simplejwt)
 * }
 */
export default class VrifyJWT extends Auth {

  constructor(router, options, changeListener) {
    super(router, options, changeListener);
    this.loginUrl = options.loginUrl;
    this.refreshUrl = options.refreshUrl || null;
    this.tokenParam = options.tokenParam || 'token';
    this.refreshParam = options.refreshParam || 'refresh';
    this._refreshTimer = null;
    // localStorage so the session survives a page refresh
    this._storage = new BrowserStorage();
  }

  getButtonTitle() {
    return i18n.global.t('authentication.button.title');
  }

  /**
   * Called once after construction.  Restores a previously stored token so the
   * user stays logged in across hard reloads.
   */
  async init() {
    const token = this._storage.get(KEY_TOKEN);
    if (!hasText(token)) return;

    if (this._isExpired(token)) {
      const refreshed = await this._doRefresh();
      if (!refreshed) {
        this._clearTokens();
      }
      return;
    }

    this._scheduleRefresh(token);
    if (this.changeListener) {
      await this.changeListener(true, token);
    }
  }

  /**
   * Store the current route, then redirect the browser to the Django SSO
   * endpoint.  Django should redirect back to `<origin>/auth?token=<jwt>`.
   */
  async login() {
    const returnUri = this.router.currentRoute.value.fullPath;
    this._storage.set(KEY_RETURN_URI, returnUri);

    const callbackUri = window.location.origin + this.router.resolve('/auth').href;
    window.location.href = `${this.loginUrl}?next=${encodeURIComponent(callbackUri)}`;
  }

  /**
   * Called by LoginCallback.vue after the browser returns from the Django
   * redirect.  Extracts the JWT (and optional refresh token) from the URL
   * query string, persists them and notifies the store.
   */
  async confirmLogin() {
    const query = this.router.currentRoute.value.query;
    const token = query[this.tokenParam];
    const refreshToken = query[this.refreshParam];

    if (!hasText(token)) {
      throw new Error(
        `VrifyJWT: no "${this.tokenParam}" parameter found in the callback URL. ` +
        'Ensure the Django login endpoint redirects with the JWT as a query parameter.'
      );
    }

    this._storage.set(KEY_TOKEN, token);
    if (hasText(refreshToken)) {
      this._storage.set(KEY_REFRESH, refreshToken);
    }

    this._scheduleRefresh(token);
    if (this.changeListener) {
      await this.changeListener(true, token);
    }

    // Navigate the user back to the page they were on before login
    const returnUri = this._storage.get(KEY_RETURN_URI) || '/';
    this._storage.remove(KEY_RETURN_URI);
    this.router.replace(returnUri);
  }

  /**
   * Clears tokens, cancels the refresh timer and navigates to the logout view.
   */
  async logout() {
    this._clearRefreshTimer();
    this._clearTokens();
    if (this.router.currentRoute.value.name !== 'logout') {
      this.router.push('/auth/logout');
    }
  }

  // confirmLogout() — base class implementation calls changeListener(false), which is all we need

  /**
   * Formats the stored token as an `Authorization: Bearer <token>` request header.
   */
  updateStore(value) {
    return this._updateStore(value, 'Authorization', 'header', 'Bearer');
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  /** Decode the JWT payload without verifying the signature (server does that). */
  _parsePayload(token) {
    try {
      const part = token.split('.')[1];
      // Base64url → base64
      const b64 = part.replace(/-/g, '+').replace(/_/g, '/');
      return JSON.parse(atob(b64));
    } catch {
      return null;
    }
  }

  /** Returns true if the token will expire within `bufferSec` seconds. */
  _isExpired(token, bufferSec = 30) {
    const payload = this._parsePayload(token);
    if (!payload?.exp) return true;
    return Date.now() / 1000 >= payload.exp - bufferSec;
  }

  /**
   * Schedules a silent token refresh 30 seconds before the JWT expires.
   * Falls back gracefully when no `refreshUrl` is configured.
   */
  _scheduleRefresh(token) {
    if (!this.refreshUrl) return;
    this._clearRefreshTimer();

    const payload = this._parsePayload(token);
    if (!payload?.exp) return;

    const msUntilRefresh = (payload.exp - 30) * 1000 - Date.now();
    if (msUntilRefresh <= 0) {
      this._doRefresh();
      return;
    }
    this._refreshTimer = setTimeout(() => this._doRefresh(), msUntilRefresh);
  }

  _clearRefreshTimer() {
    if (this._refreshTimer !== null) {
      clearTimeout(this._refreshTimer);
      this._refreshTimer = null;
    }
  }

  _clearTokens() {
    this._storage.remove(KEY_TOKEN);
    this._storage.remove(KEY_REFRESH);
  }

  /**
   * POSTs `{ refresh }` to `refreshUrl`.  Expects a JSON response with
   * `access` (or `access_token`) and an optional new `refresh` token.
   * Returns true on success, false on failure (which also triggers logout).
   */
  async _doRefresh() {
    if (!this.refreshUrl) return false;

    const refreshToken = this._storage.get(KEY_REFRESH);
    if (!hasText(refreshToken)) {
      this._onSessionExpired();
      return false;
    }

    try {
      const res = await fetch(this.refreshUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // djangorestframework-simplejwt expects { "refresh": "<token>" }
        body: JSON.stringify({ refresh: refreshToken })
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json();
      // djangorestframework-simplejwt returns { access, refresh }
      // fall back to { access_token, refresh_token } for other token APIs
      const newToken = data.access || data.access_token || data.token;
      if (!hasText(newToken)) throw new Error('Missing access token in refresh response');

      this._storage.set(KEY_TOKEN, newToken);
      const newRefresh = data.refresh || data.refresh_token;
      if (hasText(newRefresh)) {
        this._storage.set(KEY_REFRESH, newRefresh);
      }

      this._scheduleRefresh(newToken);
      if (this.changeListener) {
        await this.changeListener(true, newToken);
      }
      return true;
    } catch (err) {
      console.error('[VrifyJWT] Token refresh failed:', err);
      this._onSessionExpired();
      return false;
    }
  }

  /** Clears all auth state and notifies the store that the session ended. */
  _onSessionExpired() {
    this._clearRefreshTimer();
    this._clearTokens();
    if (this.changeListener) {
      this.changeListener(false);
    }
  }

}
