import axios from "axios";

export const TRANSACTION_ITEM_CONFORMANCE = [
  'https://api.stacspec.org/v1.*/ogcapi-features/extensions/transaction'
];
export const TRANSACTION_COLLECTION_CONFORMANCE = [
  'https://api.stacspec.org/v1.*/collections/extensions/transaction'
];

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
        const browserPath = rootState.data?.getBrowserPath();
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
      canManageByUrl: (state, getters, rootState, rootGetters) => (url, method) => {
        if (!url || !rootState.transactions) {
          return false;
        }
        if (rootState.transactionsRequireLogin && !rootGetters['auth/isLoggedIn']) {
          return false;
        }
        if (rootState.transactionsRequirePreflight) {
          const permissions = state.permissions[url];
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
      setPermissions(state, { url, permissions }) {
        state.permissions[url] = permissions;
      }
    },
    actions: {
      async checkPermissions(cx, options) {
        if (
          !options.url ||
          !cx.rootState.transactions ||
          !cx.rootState.transactionsRequirePreflight ||
          Array.isArray(cx.state.permissions[options.url])) {
          return;
        }
        
        let methods = [];
        try {
          options = Object.assign({}, options);
          options.method = 'options';
          options.headers.Accept = '*/*';
          const response = await axios(options);
          // The `Allow` header is a comma-separated list of HTTP methods, e.g. "GET, PUT, DELETE".
          // axios exposes it either as a string or (rarely) as an array, so normalize both.
          let allow = response.headers?.allow;
          if (typeof allow === 'string') {
            allow = allow.split(',');
          }
          if (Array.isArray(allow)) {
            methods = allow.map(method => method.trim().toLowerCase()).filter(Boolean);
          }
        } catch (error) {
          console.error(`Failed to check permissions for ${options.url}`, error);
        }
        cx.commit('setPermissions', {
          url: options.url,
          permissions: methods
        });
      },
    }
  };
}
