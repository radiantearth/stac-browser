import { defineStore } from 'pinia';
import Auth from '../auth';
import i18n from '../i18n';
import AuthUtils from '../components/auth/utils';
import BrowserStorage, { Cookies } from '../browser-store';
import { useConfigStore } from './config';
import { usePageStore } from './page';

let _router = null;

export function setAuthRouter(router) {
  _router = router;
}

export const useAuthStore = defineStore('auth', {
  state: () => ({
    /** @type {Function} Wrapped auth method (to avoid vuex/pinia reactivity issues) */
    _method: () => new Auth(_router),
    /** @type {Array<Function>} Retry action callbacks */
    actions: [],
    /** @type {*} Current credentials */
    credentials: null,
    /** @type {boolean} Whether auth flow is in progress */
    inProgress: false
  }),
  getters: {
    method(state) {
      return state._method();
    },
    canAuthenticate() {
      const config = useConfigStore();
      return AuthUtils.isSupported(this.method, config.$state);
    },
    isLoggedIn(state) {
      return state.credentials !== null;
    },
    showLogin(state) {
      return !this.isLoggedIn && state.inProgress;
    }
  },
  actions: {
    addAction(callback) {
      this.actions.push(callback);
    },

    resetActions() {
      this.actions = [];
    },

    async waitForAuth() {
      const config = useConfigStore();
      if (Auth.equals(this.method, config.authConfig)) {
        return;
      }
      await this.updateMethod(config.authConfig);
    },

    async updateMethod(authConfig) {
      if (!Auth.equals(this.method, authConfig)) {
        await this.method.close();
      }

      const changeListener = async (isLoggedIn, credentials) => {
        if (!isLoggedIn) {
          credentials = null;
        }
        await this.updateCredentials(credentials);
        if (isLoggedIn) {
          await this.executeActions();
        }
        else {
          this.resetActions();
        }
      };

      const storage = new BrowserStorage(true);
      storage.set('authConfig', authConfig);

      const newAuth = await Auth.create(_router, authConfig, changeListener);
      this._method = () => newAuth;
    },

    async requestLogin() {
      if (this.isLoggedIn) {
        return;
      }
      this.inProgress = true;
      try {
        await this.method.login();
      } catch (error) {
        await this._handleAuthError(error);
      }
    },

    async finalizeLogin(credentials = null) {
      this.inProgress = false;
      try {
        await this.method.confirmLogin(credentials);
      } catch (error) {
        await this._handleAuthError(error);
      }
    },

    async abortLogin() {
      this.inProgress = false;
    },

    async requestLogout() {
      if (!this.isLoggedIn) {
        return;
      }
      this.inProgress = true;
      await this.method.logout();
    },

    async finalizeLogout() {
      this.inProgress = false;
      try {
        await this.method.confirmLogout();
      } catch (error) {
        await this._handleAuthError(error);
      }
    },

    async updateCredentials(value = null) {
      this.credentials = value;
      const pageStore = usePageStore();
      const intent = this.method.updateStore(value);
      if (intent.query) {
        pageStore.setQueryParameter(intent.query);
      }
      else if (intent.header) {
        pageStore.setRequestHeader(intent.header);
      }
      else if (intent.cookie) {
        const cookie = new Cookies(true);
        cookie.setItem(intent.cookie.key, intent.cookie.value);
      }
    },

    async executeActions() {
      for (const callback of this.actions) {
        try {
          const p = callback();
          if (p instanceof Promise) {
            p.catch(error => this._handleAuthError(error));
          }
        } catch (error) {
          this._handleAuthError(error);
        }
      }
      this.resetActions();
    },

    async _handleAuthError(error) {
      const pageStore = usePageStore();
      pageStore.showGlobalError({
        error,
        message: i18n.global.t('errors.authFailed')
      });
      await this.updateCredentials();
    }
  }
});
