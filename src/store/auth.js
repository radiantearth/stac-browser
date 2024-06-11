import Auth from '../auth';
import i18n from '../i18n';
import AuthUtils from '../components/auth/utils';
import BrowserStorage from '../browser-store';

const handleAuthError = async (cx, error) => {
  cx.commit('showGlobalError', {
    error,
    message: i18n.t('errors.authFailed')
  }, { root: true });
  await cx.dispatch('updateCredentials');
};

export default function getStore(router) {
  return {
    namespaced: true,
    state: {
      // Wrap in a function and use the getter instead of the state
      // Unfortunately, some auth libraries have internal state, which vuex doesn't like
      // and thus reports: "do not mutate vuex store state outside mutation handlers."
      method: () => new Auth(),
      actions: [],
      credentials: null,
      inProgress: false
    },
    getters: {
      method(state) {
        return state.method();
      },
      canAuthenticate(state, getters, rootState) {
        return AuthUtils.isSupported(getters.method, rootState);
      },
      isLoggedIn(state) {
        return state.credentials !== null;
      },
      showLogin(state, getters) {
        return !getters.isLoggedIn && state.inProgress;
      }
    },
    mutations: {
      setCredentials(state, credentials) {
        state.credentials = credentials; // e.g. Username + Password or a Bearer Token
      },
      setMethod(state, method) {
        state.method = () => method;
      },
      addAction(state, callback) {
        state.actions.push(callback);
      },
      resetActions(state) {
        state.actions = [];
      },
      setInProgress(state, inProgress = true) {
        state.inProgress = inProgress;
      }
    },
    actions: {
      async waitForAuth(cx) {
        if (Auth.equals(cx.getters.method, cx.rootState.authConfig)) {
          return;
        }
        await cx.dispatch('updateMethod', cx.rootState.authConfig);
      },
      async updateMethod(cx, config) {
        config = AuthUtils.convertLegacyAuthConfig(config);
        await cx.getters.method.close();

        const changeListener = async (isLoggedIn, credentials) => {
          if (!isLoggedIn) {
            credentials = null;
          }
          await cx.dispatch('updateCredentials', credentials);
          if (isLoggedIn) {
            await cx.dispatch('executeActions');
          }
          else {
            cx.commit('resetActions');
          }
        };
        
        const storage = new BrowserStorage(true);
        storage.set('authConfig', config);

        const newAuth = await Auth.create(config, changeListener, router);
        cx.commit('setMethod', newAuth);
      },
      async requestLogin(cx) {
        if (cx.getters.isLoggedIn) {
          return;
        }
        cx.commit('setInProgress');
        try {
          await cx.getters.method.login();
        } catch(error) {
          handleAuthError(cx, error);
        }
      },
      async finalizeLogin(cx, credentials = null) {
        cx.commit('setInProgress', false);
        try {
          await cx.getters.method.confirmLogin(credentials);
        } catch(error) {
          handleAuthError(cx, error);
        }
      },
      async abortLogin(cx) {
        cx.commit('setInProgress', false);
      },
      async requestLogout(cx) {
        if (!cx.getters.isLoggedIn) {
          return;
        }
        cx.commit('setInProgress');
        await cx.getters.method.logout();
      },
      async finalizeLogout(cx) {
        cx.commit('setInProgress', false);
        try {
          await cx.getters.method.confirmLogout();
        } catch(error) {
          handleAuthError(cx, error);
        }
      },
      // Format the value and add it to query parameters or headers
      async updateCredentials(cx, value = null) {
        cx.commit('setCredentials', value);
        const intent = cx.getters.method.updateStore(value);
        if (intent.query) {
          cx.commit('setQueryParameter', intent.query, { root: true });
        }
        if (intent.header) {
          cx.commit('setRequestHeader', intent.header, { root: true });
        }
      },
      async executeActions(cx) {
        for (let callback of cx.state.actions) {
          try {
            const p = callback();
            if (p instanceof Promise) {
              p.catch(error => handleAuthError(cx, error));
            }
          } catch (error) {
            handleAuthError(cx, error);
          }
        }
        cx.commit('resetActions');
      }
    }
  };
}
