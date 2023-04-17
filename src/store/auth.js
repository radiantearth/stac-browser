import Auth from '../auth';
import Utils from '../utils';
import i18n from '../i18n';

export default function getStore(router) {
  return {
    namespaced: true,
    state: {
      // Wrap in a function and use the getter instead of the state
      // Unfortunately, some auth libraries have internal state, which vuex doesn't like
      // and report: "do not mutate vuex store state outside mutation handlers."
      method: () => new Auth(),
      actions: [],
      credentials: null
    },
    getters: {
      method(state) {
        return state.method();
      },
      canAuthenticate(state, getters, rootState) {
        return rootState.authConfig && getters.method.getType() !== null;
      },
      credentials(state, getters) {
        return getters.method.getCredentials();
      },
      isLoggedIn(state) {
        return state.credentials !== null;
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
      }
    },
    actions: {
      async waitForAuth(cx) {
        let configType = cx.state.authConfig ? (cx.rootState.authConfig.tokenGenerator || 'input') : null;
        if (!configType || cx.getters.method.getType() === configType) {
          return;
        }
        await cx.dispatch('updateMethod', cx.rootState.authConfig);
      },
      async updateMethod(cx, config) {
        await cx.getters.method.close();
        let changeListener = async (isLoggedIn, credentials) => {
          if (!isLoggedIn) {
            credentials = null;
          }
          await cx.dispatch('updateCredentials', credentials);
          await cx.dispatch('executeActions');
        };
        let newAuth = await Auth.create(config, changeListener, router);
        cx.commit('setMethod', newAuth);
      },
      async handleAuthenticationCallback(cx) {
        if (cx.getters.isLoggedIn) {
          await cx.getters.method.logoutCallback();
        }
        else {
          await cx.getters.method.loginCallback();
        }
      },
      async authenticate(cx) {
        if (cx.getters.isLoggedIn) {
          let logout = await cx.getters.method.logout();
          if (logout) {
            await cx.dispatch('updateCredentials');
            await cx.dispatch('executeActions');
          }
        }
        else {
          let credentials = await cx.getters.method.login();
          if (credentials) {
            await cx.dispatch('updateCredentials', credentials);
            await cx.dispatch('executeActions');
          }
        }
      },
      // Format the value and add it to query parameters or headers
      async updateCredentials(cx, value = null) {
        cx.commit('setCredentials', value);
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
          cx.commit('setQueryParameter', { type: 'private', key, value }, { root: true });
        }
        else if (authConfig.type === 'header') {
          cx.commit('setRequestHeader', { key, value }, { root: true });
        }
      },
      async executeActions(cx) {
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
}
