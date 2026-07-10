import axios from "axios";
import { Loading } from './utils';

export const TRANSACTION_ITEM_CONFORMANCE = [
  'https://api.stacspec.org/v1.*/ogcapi-features/extensions/transaction'
];
export const TRANSACTION_COLLECTION_CONFORMANCE = [
  'https://api.stacspec.org/v1.*/collections/extensions/transaction'
];

// Permissions are keyed by the resource URL without query string or fragment.
// The requests that trigger a preflight check (e.g. a collections listing) often
// carry query params like `?limit=…`, but permissions apply to the resource itself,
// so we normalize both when storing and when looking permissions up.
function permissionKey(url) {
  try {
    const normalized = new URL(url);
    normalized.search = '';
    normalized.hash = '';
    return normalized.toString();
  } catch (error) {
    return url;
  }
}

export default function getStore(config) {
  return {
    namespaced: true,
    state: {
      permissions: {}
    },
    getters: {
      supportsCollectionTransactions(state, getters, rootState, rootGetters) {
        return rootGetters.supportsConformance(
          TRANSACTION_COLLECTION_CONFORMANCE
        );
      },
      supportsItemTransactions(state, getters, rootState, rootGetters) {
        return rootGetters.supportsConformance(
          TRANSACTION_ITEM_CONFORMANCE
        );
      },
      browserPaths(state, getters, rootState, rootGetters) {
        const links = {
          edit: null,
          addCollection: null,
          addItem: null
        };
        if (!rootState.data?.isSTAC) {
          return links;
        }
        const browserPath = rootGetters.toBrowserPath(rootState.data);
        links.edit = '/management/edit' + browserPath;
        if (rootState.data?.isCatalogLike) {
          const collectionsLink = rootState.data.getApiCollectionsLink();
          if (collectionsLink) {
            links.addCollection = '/management/create-collection' + browserPath;
          }
          const itemsLink = rootState.data?.getApiItemsLink();
          if (itemsLink) {
            links.addItem = '/management/create-item' + browserPath;
          }
        }
        return links;
      },
      isCheckingPermissions: state => url => {
        return Boolean(url) && state.permissions[permissionKey(url)] instanceof Loading;
      },
      canManageByUrl: (state, getters, rootState, rootGetters) => (url, method) => {
        if (!url || !rootState.transactions) {
          return false;
        }
        if (rootState.transactionsRequireLogin && !rootGetters['auth/isLoggedIn']) {
          return false;
        }
        if (rootState.transactionsRequirePreflight) {
          const permissions = state.permissions[permissionKey(url)];
          return Array.isArray(permissions) && permissions.includes(method.toLowerCase());
        }
        return true;
      },
      canManage(state, getters, rootState, rootGetters) {
        return getters.canEdit || getters.canDelete || getters.canAddCollections || getters.canAddItems;
      },
      canEdit(state, getters, rootState, rootGetters) {
        if ((rootGetters.isItem && getters.supportsItemTransactions) || (rootGetters.isCollection && getters.supportsCollectionTransactions)) {
          // We only do full replace (i.e. PUT), no partial replace (i.e. PATCH).
          return getters.canManageByUrl(rootState.url, 'put');
        }
        return false;
      },
      canDelete(state, getters, rootState, rootGetters) {
        if ((rootGetters.isItem && getters.supportsItemTransactions) || (rootGetters.isCollection && getters.supportsCollectionTransactions)) {
          return getters.canManageByUrl(rootState.url, 'delete');
        }
        return false;
      },
      canAddCollections(state, getters, rootState, rootGetters) {
        if (!rootState.data?.isCatalogLike || !getters.supportsCollectionTransactions) {
          return false;
        }
        const collections = rootState.data.getApiCollectionsLink();
        if (!collections) {
          return false;
        }
        const url = collections.getAbsoluteUrl();
        return getters.canManageByUrl(url, 'post');
      },
      canAddItems(state, getters, rootState, rootGetters) {
        if (!rootState.data?.isCatalogLike || !getters.supportsItemTransactions) {
          return false;
        }
        const items = rootState.data.getApiItemsLink();
        if (!items) {
          return false;
        }
        const url = items.getAbsoluteUrl();
        return getters.canManageByUrl(url, 'post');
      }
    },
    mutations: {
      // permissions is either an array of allowed HTTP methods,
      // a Loading object while the check is running, or not set to remove the entry.
      setPermissions(state, { url, permissions = null }) {
        if (permissions) {
          state.permissions[url] = permissions;
        }
        else {
          delete state.permissions[url];
        }
      },
      // Permissions may change with the credentials or the catalog,
      // remove all of them so that they are checked again when needed.
      resetPermissions(state) {
        state.permissions = {};
      }
    },
    actions: {
      async checkPermissions(cx, options) {
        const url = options.url ? permissionKey(options.url) : null;
        if (
          !url ||
          !cx.rootState.transactions ||
          !cx.rootState.transactionsRequirePreflight ||
          // Don't preflight against servers that don't advertise any transaction
          // support - it would just produce pointless OPTIONS requests.
          (!cx.getters.supportsItemTransactions && !cx.getters.supportsCollectionTransactions) ||
          // Skip if the permissions have been retrieved or are being retrieved already
          typeof cx.state.permissions[url] !== 'undefined') {
          return;
        }

        cx.commit('setPermissions', { url, permissions: new Loading() });
        try {
          options = structuredClone(options);
          options.url = url;
          options.method = 'options';
          options.headers.Accept = '*/*';
          const response = await axios(options);
          // The `Allow` header is a comma-separated list of HTTP methods, e.g. "GET, PUT, DELETE".
          // axios exposes it either as a string or (rarely) as an array, so normalize both.
          let allow = response.headers?.allow;
          if (typeof allow === 'string') {
            allow = allow.split(',');
          }
          let methods = [];
          if (Array.isArray(allow)) {
            methods = allow.map(method => method.trim().toLowerCase()).filter(Boolean);
          }
          cx.commit('setPermissions', { url, permissions: methods });
        } catch (error) {
          console.error(`Failed to check permissions for ${url}`, error);
          // Don't keep anything in the store for failed requests (e.g. network errors)
          // so that the permissions check can be retried later.
          cx.commit('setPermissions', { url });
        }
      },
    }
  };
}
