import Auth from '../auth';
import Utils from '../utils';
import i18n from '../i18n';

export default function getStore(router) {
  return {
    namespaced: true,
    state: {
      method: new Auth(),
      actions: [],
      credentials: null
    },
    getters: {
      canAuthenticate(state, getters, rootState) {
        return rootState.authConfig && state.method.getType() !== null;
      },
      credentials(state) {
        return state.method.getCredentials();
      },
      isLoggedIn(state) {
        return state.credentials !== null;
      }
    },
    mutations: {
      setCredentials(state, credentials) {
        state.credentials = credentials; // e.g. Username + Password or a Bearer Token
      },
      resetCredentials(state) {
        state.credentials = null;
      },
      setMethod(state, method) {
        state.method = method;
      },
      addAction(state, callback) {
        state.actions.push(callback);
      },
      resetActions(state) {
        state.actions = [];
      }
    },
    actions: {
      async login(cx) {
        await cx.state.method.login();
      },
      async logout(cx) {
        await cx.state.method.logout();
      },
      async loginCallback(cx) {
        await cx.state.method.loginCallback();
      },
      async logoutCallback(cx) {
        await cx.state.method.logoutCallback();
      },
      async waitForAuth(cx) {
        let configType = cx.state.authConfig ? cx.rootState.authConfig.tokenGenerator || 'input' : null;
        if (!configType || cx.state.method.getType() === configType) {
          return;
        }
        await cx.dispatch('updateMethod', cx.rootState.authConfig);
      },
      async updateMethod(cx, config) {
        await cx.state.method.close();
        let changeListener = async (isLoggedIn, credentials) => {
          if (isLoggedIn) {
            cx.commit('setCredentials', credentials);
          }
          else {
            cx.commit('resetCredentials');
          }
          await cx.dispatch('updateWithCredentials');
        };
        let newAuth = await Auth.create(config, changeListener, router);
        cx.commit('setMethod', newAuth);
      },
      async authenticate(cx) {
        if (cx.getters.isLoggedIn) {
          await cx.state.method.logout();
          cx.commit('resetCredentials');
        }
        else {
          let credentials = await cx.state.method.login();
          cx.commit('setCredentials', credentials);
        }
        await cx.dispatch('updateWithCredentials');
      },
      async updateWithCredentials(cx) {
        // Format the value and add it to query parameters or headers
        let value = cx.state.credentials;
        let authConfig = cx.rootState.authConfig;
        if (value) {
          if (authConfig.formatter === 'Bearer') {
            value = `Bearer ${value}`;
          }
          else if (typeof authConfig.formatter === 'function') {
            value = authConfig.formatter(value);
          }
        }
        if (!Utils.hasText(value)) {
          value = undefined;
        }

        // Set query or request parameters
        let key = authConfig.key;
        if (authConfig.type === 'query') {
          cx.commit('setQueryParameter', {type: 'private', key, value}, { root: true });
        }
        else if (authConfig.type === 'header') {
          cx.commit('setRequestHeader', {key, value}, { root: true });
        }

        // Retry requests
        let errorFn = error => cx.commit('showGlobalError', {
          error,
          message: i18n.t('errors.authFailed')
        }, { root: true });

        for (let callback of cx.state.actions) {
          try {
            let p = callback();
            if (p instanceof Promise) {
              p.catch(errorFn);
            }
          } catch (error) {
            errorFn(error);
          }
        }
      }
    }
  };
};
