import Auth from '../auth';
import i18n from '../i18n';
import AuthUtils from '../components/auth/utils';
import { Cookies } from '../browser-store';

const handleAuthError = async (cx, error) => {
  cx.commit('showGlobalError', {
    error,
    message: i18n.global.t('errors.authFailed')
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
      method: () => new Auth(router),
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
        if (!Auth.equals(cx.getters.method, config)) {
          await cx.getters.method.close();
        }

        const changeListener = async (isLoggedIn, credentials) => {
          if (!isLoggedIn) {
            credentials = null;
          }
          await cx.dispatch('updateCredentials', credentials);
          if (isLoggedIn) {
            await cx.dispatch('executeActions');
          }
          else {
            await cx.dispatch('cancelActions');
          }
        };

        const newAuth = await Auth.create(router, config, changeListener);
        cx.commit('setMethod', newAuth);
        await newAuth.resume();
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
        // The user actively declined to log in, so don't keep the pending
        // actions around for a (potentially much later) login.
        await cx.dispatch('cancelActions');
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
      async updateCredentials(cx, value = null) { // eslint-disable-line require-await
        cx.commit('setCredentials', value);
        const intent = cx.getters.method.updateStore(value);
        if (intent.query) {
          cx.commit('setQueryParameter', intent.query, { root: true });
        }
        else if (intent.header) {
          cx.commit('setRequestHeader', intent.header, { root: true });
        }
        else if (intent.cookie) {
          const cookie = new Cookies(true);
          cookie.setItem(intent.cookie.key, intent.cookie.value);
        }
      },
      // Actions are either plain functions or objects with a `run` function
      // and an optional `cancel` function (see cancelActions).
      async executeActions(cx) { // eslint-disable-line require-await
        for (let action of cx.state.actions) {
          const run = typeof action === 'function' ? action : action.run;
          try {
            const p = run();
            if (p instanceof Promise) {
              p.catch(error => handleAuthError(cx, error));
            }
          } catch (error) {
            handleAuthError(cx, error);
          }
        }
        cx.commit('resetActions');
      },
      // Discards the pending actions, e.g. when the user aborts the login or logs out.
      // Notifies the actions through their `cancel` function so that pending
      // promises can settle instead of hanging around forever.
      async cancelActions(cx) { // eslint-disable-line require-await
        for (let action of cx.state.actions) {
          if (typeof action.cancel === 'function') {
            try {
              action.cancel();
            } catch (error) {
              console.error(error);
            }
          }
        }
        cx.commit('resetActions');
      }
    }
  };
}
