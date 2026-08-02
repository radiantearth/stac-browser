import Auth from '../auth';
import i18n from '../i18n';
import { getDefaultId, isSupported, mergeScheme, normalizeAuthConfig, resolveRefs, schemeKey } from '../auth/schemes.js';
import BrowserStorage, { Cookies } from '../browser-store';
import { isObject, size } from 'stac-js/src/utils.js';

const KEY_USED_SCHEMES = 'auth-used-schemes';

const handleAuthError = async (cx, id, error) => {
  cx.commit('showGlobalError', {
    error,
    message: i18n.global.t('errors.authFailed')
  }, { root: true });
  await cx.dispatch('updateCredentials', { id });
};

// The scheme ids that were logged in during this session, persisted so that
// sessions (e.g. OpenID Connect) can be resumed after a page reload.
const getUsedSchemes = () => {
  const used = new BrowserStorage(true).get(KEY_USED_SCHEMES);
  return Array.isArray(used) ? used : [];
};

const rememberUsedScheme = (id, used) => {
  const storage = new BrowserStorage(true);
  const ids = getUsedSchemes().filter(x => x !== id);
  if (used) {
    ids.push(id);
  }
  storage.set(KEY_USED_SCHEMES, ids);
};

// Removes all state (credentials, intents, methods, cookies, session usage)
// for the schemes that were announced by the current catalog.
// Called from the root `resetCatalog` mutation when switching catalogs so that
// credentials never leak into another catalog. Schemes that are (also) defined
// in the authConfig option keep their config definition, but lose the
// credentials as the effective scheme may have changed.
export function resetCatalogAuth(authState) {
  const catalogIds = Object.keys(authState.catalogSchemes);
  if (catalogIds.length === 0) {
    return;
  }
  const methods = authState.methods();
  for (const id of catalogIds) {
    const intent = authState.intents[id];
    if (intent && intent.cookie) {
      new Cookies(true).removeItem(intent.cookie.key);
    }
    delete authState.credentials[id];
    delete authState.intents[id];
    const method = methods[id];
    if (method) {
      method.close().catch(error => console.error(error));
      delete methods[id];
    }
    rememberUsedScheme(id, false);
  }
  authState.methods = () => methods;
  authState.catalogSchemes = {};
}

export default function getStore(router) {
  return {
    namespaced: true,
    state: {
      // JSON representation of the authConfig that has been applied,
      // used to detect config changes.
      configKey: null,
      // Scheme id => Authentication Scheme Object from the authConfig option (normalized)
      configSchemes: {},
      // Scheme id => Authentication Scheme Object announced by the STAC catalog (auth:schemes)
      catalogSchemes: {},
      // Scheme id => Auth instance.
      // Wrap in a function and use the getter instead of the state.
      // Unfortunately, some auth libraries have internal state, which vuex doesn't like
      // and thus reports: "do not mutate vuex store state outside mutation handlers."
      methods: () => ({}),
      // Scheme id => credentials (a key in this object means: logged in)
      credentials: {},
      // Scheme id => header/query/cookie intent derived from the credentials
      intents: {},
      // Requests to retry after a successful login
      actions: [],
      // Array of candidate scheme ids while a login flow is pending, otherwise null
      inProgress: null,
      // Scheme id of the login/logout flow that is currently being carried out
      activeId: null
    },
    getters: {
      // The effective schemes: the configured schemes merged over the schemes
      // announced by the catalog (config wins).
      schemes(state) {
        const schemes = {};
        const ids = new Set(Object.keys(state.catalogSchemes).concat(Object.keys(state.configSchemes)));
        for (const id of ids) {
          const scheme = mergeScheme(state.catalogSchemes[id], state.configSchemes[id]);
          if (isObject(scheme)) {
            schemes[id] = scheme;
          }
        }
        return schemes;
      },
      // The id of the scheme that applies to all requests without auth:refs.
      // The default flag is only honored from the config, never from catalog data.
      defaultId(state) {
        return getDefaultId(state.configSchemes);
      },
      method: state => id => state.methods()[id] || null,
      activeMethod(state) {
        return state.activeId ? (state.methods()[state.activeId] || null) : null;
      },
      isLoggedIn: state => id => (id in state.credentials),
      isAnyLoggedIn(state) {
        return size(state.credentials) > 0;
      },
      loggedInIds(state) {
        return Object.keys(state.credentials);
      },
      supportedIds(state, getters, rootState) {
        return Object.entries(getters.schemes)
          .filter(([, scheme]) => isSupported(scheme, rootState))
          .map(([id]) => id);
      },
      canAuthenticate(state, getters) {
        return getters.supportedIds.length > 0;
      },
      showLogin(state) {
        return Array.isArray(state.inProgress);
      },
      // The schemes to offer in the login dialog when multiple candidates are pending
      chooserSchemes(state, getters) {
        if (!Array.isArray(state.inProgress)) {
          return [];
        }
        const schemes = getters.schemes;
        return state.inProgress
          .filter(id => isObject(schemes[id]))
          .map(id => ({ id, scheme: schemes[id] }));
      },
      // Determines the authentication data (headers / query parameters) to
      // inject into a request for the given link (a stac-js Link/Asset, a plain
      // link object, or a URL string), based on the link's auth:refs or the
      // default scheme. Returns maps that may be empty.
      resolveInjection: (state, getters, rootState, rootGetters) => (link, absoluteUrl = null) => {
        const injection = { headers: {}, query: {} };
        // Consistent with the previous global behavior, requests to external
        // domains (see allowedDomains) never receive credentials.
        if (absoluteUrl && rootGetters.isExternalUrl(absoluteUrl)) {
          return injection;
        }
        let ids = resolveRefs(link).map(({ id }) => id);
        if (ids.length === 0) {
          // auth:refs win exclusively; the default scheme only applies to
          // requests without auth:refs.
          ids = getters.defaultId ? [getters.defaultId] : [];
        }
        for (const id of ids) {
          const intent = state.intents[id];
          if (!isObject(intent)) {
            continue;
          }
          if (intent.header && typeof intent.header.value !== 'undefined') {
            injection.headers[intent.header.key] = intent.header.value;
          }
          else if (intent.query && typeof intent.query.value !== 'undefined') {
            injection.query[intent.query.key] = intent.query.value;
          }
          // Cookies are sent by the browser automatically, nothing to inject.
          return injection;
        }
        return injection;
      },
      // The scheme ids that a login could be attempted for to authorize a
      // request for the given link: referenced (or default), supported, and
      // not logged in yet.
      candidatesFor: (state, getters, rootState) => link => {
        let ids = resolveRefs(link).map(({ id }) => id);
        if (ids.length === 0) {
          ids = getters.defaultId ? [getters.defaultId] : [];
        }
        const schemes = getters.schemes;
        return ids.filter(id =>
          isObject(schemes[id])
          && isSupported(schemes[id], rootState)
          && !(id in state.credentials)
        );
      }
    },
    mutations: {
      setConfig(state, { configKey, configSchemes }) {
        state.configKey = configKey;
        state.configSchemes = configSchemes;
      },
      setCatalogScheme(state, { id, scheme }) {
        if (typeof scheme === 'undefined') {
          delete state.catalogSchemes[id];
        }
        else {
          state.catalogSchemes[id] = scheme;
        }
      },
      setMethod(state, { id, method }) {
        const methods = state.methods();
        if (typeof method === 'undefined') {
          delete methods[id];
        }
        else {
          methods[id] = method;
        }
        state.methods = () => methods;
      },
      setCredentials(state, { id, credentials }) {
        if (typeof credentials === 'undefined') {
          delete state.credentials[id];
        }
        else {
          state.credentials[id] = credentials;
        }
      },
      setIntent(state, { id, intent }) {
        if (typeof intent === 'undefined') {
          delete state.intents[id];
        }
        else {
          state.intents[id] = intent;
        }
      },
      addAction(state, callback) {
        state.actions.push(callback);
      },
      resetActions(state) {
        state.actions = [];
      },
      setInProgress(state, ids = null) {
        state.inProgress = Array.isArray(ids) ? ids : null;
      },
      setActive(state, id = null) {
        state.activeId = id;
      }
    },
    actions: {
      // Make sure the auth module reflects the current authConfig.
      // Called before requests are made (see the load action).
      async waitForAuth(cx) {
        const configKey = JSON.stringify(cx.rootState.authConfig || null);
        if (cx.state.configKey === configKey) {
          return;
        }
        await cx.dispatch('configure');
      },
      // (Re-)applies the authConfig option: normalizes it into schemes,
      // discards methods/credentials whose scheme definition changed, and
      // resumes the sessions that were logged in before a page reload.
      async configure(cx) {
        const configKey = JSON.stringify(cx.rootState.authConfig || null);
        const configSchemes = normalizeAuthConfig(cx.rootState.authConfig);
        cx.commit('setConfig', { configKey, configSchemes });

        // Discard methods and credentials that no longer match their scheme
        const methods = cx.state.methods();
        for (const id of Object.keys(methods)) {
          const scheme = cx.getters.schemes[id];
          if (!isObject(scheme) || !Auth.equals(methods[id], scheme)) {
            // eslint-disable-next-line no-await-in-loop
            await methods[id].close();
            cx.commit('setMethod', { id });
            // eslint-disable-next-line no-await-in-loop
            await cx.dispatch('updateCredentials', { id });
          }
        }

        // Resume the sessions of the schemes that were used in this session
        // (relevant for OpenID Connect after a page reload / redirect)
        for (const id of getUsedSchemes()) {
          const scheme = cx.getters.schemes[id];
          if (isObject(scheme) && isSupported(scheme, cx.rootState) && !(id in cx.state.credentials)) {
            try {
              // eslint-disable-next-line no-await-in-loop
              const method = await cx.dispatch('ensureMethod', id);
              // eslint-disable-next-line no-await-in-loop
              await method.resume();
            } catch (error) {
              console.error(error);
            }
          }
        }
      },
      // Registers the auth:schemes announced by a STAC document.
      async registerSchemes(cx, { schemes }) {
        if (!isObject(schemes)) {
          return;
        }
        for (const [id, scheme] of Object.entries(schemes)) {
          if (!isObject(scheme)) {
            continue;
          }
          const existing = cx.state.catalogSchemes[id];
          if (isObject(existing) && schemeKey(existing) === schemeKey(scheme)) {
            continue;
          }
          const before = cx.getters.schemes[id];
          if (isObject(existing)) {
            console.warn(`The definition of the authentication scheme '${id}' has changed, discarding the corresponding credentials.`);
          }
          cx.commit('setCatalogScheme', { id, scheme });
          // If the effective scheme changed, existing credentials and the
          // method instance are no longer valid.
          const after = cx.getters.schemes[id];
          if (isObject(before) && schemeKey(before) !== schemeKey(after)) {
            const method = cx.state.methods()[id];
            if (method) {
              // eslint-disable-next-line no-await-in-loop
              await method.close();
              cx.commit('setMethod', { id });
            }
            // eslint-disable-next-line no-await-in-loop
            await cx.dispatch('updateCredentials', { id });
          }
          // Resume a session that was logged in before a page reload
          // (the scheme only becomes available once the catalog is loaded)
          if (getUsedSchemes().includes(id) && !(id in cx.state.credentials) && isSupported(after, cx.rootState)) {
            try {
              // eslint-disable-next-line no-await-in-loop
              const method = await cx.dispatch('ensureMethod', id);
              // eslint-disable-next-line no-await-in-loop
              await method.resume();
            } catch (error) {
              console.error(error);
            }
          }
        }
      },
      // Returns the Auth instance for the given scheme id, creating it if needed.
      async ensureMethod(cx, id) {
        const scheme = cx.getters.schemes[id];
        if (!isObject(scheme)) {
          throw new Error(`Authentication scheme '${id}' is not available.`);
        }
        let method = cx.state.methods()[id];
        if (method && Auth.equals(method, scheme)) {
          return method;
        }
        if (method) {
          await method.close();
        }
        const changeListener = async (isLoggedIn, credentials) => {
          if (!isLoggedIn) {
            credentials = null;
          }
          await cx.dispatch('updateCredentials', { id, credentials });
          // The transaction permissions may change with the credentials,
          // remove them so that they are checked again when needed.
          cx.commit('manager/resetPermissions', null, { root: true });
          if (isLoggedIn) {
            await cx.dispatch('executeActions');
          }
          else {
            await cx.dispatch('cancelActions');
          }
        };
        method = await Auth.create(router, scheme, changeListener);
        method.id = id;
        cx.commit('setMethod', { id, method });
        return method;
      },
      // Starts a login flow for the given scheme ids (or all supported schemes).
      // With multiple candidates the user is asked to choose a scheme first.
      async requestLogin(cx, { ids } = {}) {
        if (!Array.isArray(ids)) {
          ids = Object.keys(cx.getters.schemes);
        }
        const schemes = cx.getters.schemes;
        ids = ids.filter(id =>
          isObject(schemes[id])
          && isSupported(schemes[id], cx.rootState)
          && !(id in cx.state.credentials)
        );
        if (ids.length === 0) {
          return;
        }
        if (Array.isArray(cx.state.inProgress)) {
          // A login flow is already pending, just extend the candidates
          const merged = cx.state.inProgress.concat(ids.filter(id => !cx.state.inProgress.includes(id)));
          cx.commit('setInProgress', merged);
          return;
        }
        cx.commit('setActive');
        cx.commit('setInProgress', ids);
        if (ids.length === 1) {
          await cx.dispatch('activateLogin', ids[0]);
        }
        // With multiple candidates the login dialog asks the user to choose,
        // which then dispatches activateLogin.
      },
      // Starts the login flow of a specific scheme.
      async activateLogin(cx, id) {
        cx.commit('setActive', id);
        try {
          const method = await cx.dispatch('ensureMethod', id);
          await method.login();
        } catch(error) {
          handleAuthError(cx, id, error);
        }
      },
      async finalizeLogin(cx, credentials = null) {
        const id = cx.state.activeId;
        if (!id) {
          return;
        }
        cx.commit('setInProgress');
        try {
          const method = await cx.dispatch('ensureMethod', id);
          await method.confirmLogin(credentials);
        } catch(error) {
          handleAuthError(cx, id, error);
        }
        cx.commit('setActive');
      },
      async abortLogin(cx) {
        cx.commit('setInProgress');
        cx.commit('setActive');
        // The user actively declined to log in, so don't keep the pending
        // actions around for a (potentially much later) login.
        await cx.dispatch('cancelActions');
      },
      // Logs out of the given scheme (or the only logged in scheme).
      // Only navigates away from the current page (to /auth/logout) when no
      // other scheme remains logged in.
      async requestLogout(cx, { id } = {}) {
        if (!id) {
          const ids = cx.getters.loggedInIds;
          if (ids.length !== 1) {
            return;
          }
          id = ids[0];
        }
        if (!(id in cx.state.credentials)) {
          return;
        }
        const method = cx.state.methods()[id];
        if (!method) {
          // No method instance (e.g. after a reload), just discard the credentials
          await cx.dispatch('updateCredentials', { id });
          return;
        }
        cx.commit('setActive', id);
        const quiet = cx.getters.loggedInIds.some(x => x !== id);
        await method.logout(cx.state.credentials[id], quiet);
        if (!(id in cx.state.credentials)) {
          // The logout completed without a navigation (quiet logout)
          cx.commit('setActive');
        }
      },
      async finalizeLogout(cx) {
        const id = cx.state.activeId;
        if (!id) {
          return;
        }
        try {
          const method = await cx.dispatch('ensureMethod', id);
          await method.confirmLogout();
        } catch(error) {
          handleAuthError(cx, id, error);
        }
        cx.commit('setActive');
      },
      // Restores the authentication state after a page reload, e.g. when
      // returning from an OpenID Connect redirect. Called once at startup.
      async restore(cx) {
        await cx.dispatch('waitForAuth');
        const persisted = Auth.restoreLastMethod();
        if (!isObject(persisted) || !persisted.id || !isObject(persisted.options)) {
          return;
        }
        const { id, options } = persisted;
        if (!isObject(cx.getters.schemes[id])) {
          // Re-register the scheme, e.g. when it was announced by a catalog
          // that has not been loaded yet after the redirect.
          cx.commit('setCatalogScheme', { id, scheme: options });
        }
        try {
          const method = await cx.dispatch('ensureMethod', id);
          cx.commit('setActive', id);
          if (!(id in cx.state.credentials)) {
            await method.resume();
          }
        } catch (error) {
          console.error(error);
        }
      },
      // Stores the credentials for a scheme and derives what to send along
      // with requests (header / query parameter / cookie).
      async updateCredentials(cx, { id, credentials = null }) { // eslint-disable-line require-await
        if (!id) {
          return;
        }
        const oldIntent = cx.state.intents[id];
        if (isObject(oldIntent) && oldIntent.cookie) {
          new Cookies(true).removeItem(oldIntent.cookie.key);
        }
        if (credentials) {
          const method = cx.state.methods()[id];
          const intent = method ? method.updateStore(credentials) : {};
          cx.commit('setCredentials', { id, credentials });
          cx.commit('setIntent', { id, intent });
          if (intent.cookie && typeof intent.cookie.value !== 'undefined') {
            new Cookies(true).setItem(intent.cookie.key, intent.cookie.value);
          }
          rememberUsedScheme(id, true);
        }
        else {
          cx.commit('setCredentials', { id });
          cx.commit('setIntent', { id });
          rememberUsedScheme(id, false);
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
              p.catch(error => handleAuthError(cx, cx.state.activeId, error));
            }
          } catch (error) {
            handleAuthError(cx, cx.state.activeId, error);
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
