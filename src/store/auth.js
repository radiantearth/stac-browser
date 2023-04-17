import Auth from '../auth';
import Utils from '../utils';

export default {
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
    async updateMethod(cx, config) {
      await cx.state.method.close();
      let newAuth = await Auth.create(config, (isLoggedIn, credentials) => {
        if (isLoggedIn) {
          cx.commit('setCredentials', credentials);
        }
        else {
          cx.commit('resetCredentials');
        }
      });
      cx.commit('setMethod', newAuth);
    },
    async execAuth(cx, value) {
      if (!Utils.hasText(value)) {
        value = null;
      }

      // Format the value and add it to query parameters or headers
      let authConfig = cx.state.authConfig;
      let key = authConfig.key;
      if (value && typeof authConfig.formatter === 'function') {
        value = authConfig.formatter(value);
      }
      if (!Utils.hasText(value)) {
        value = undefined;
      }
      if (authConfig.type === 'query') {
        cx.commit('setQueryParameter', {type: 'private', key, value});
      }
      else if (authConfig.type === 'header') {
        cx.commit('setRequestHeader', {key, value});
      }

      await cx.dispatch('retryAfterAuth');
    }
  }
};
