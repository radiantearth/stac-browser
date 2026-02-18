import { createPinia } from 'pinia';
import { useConfigStore } from './config';
import { useDatabaseStore } from './database';
import { usePageStore } from './page';
import { useCatalogStore } from './catalog';
import { useAuthStore, setAuthRouter } from './auth';

/**
 * Initialize all Pinia stores with config and router.
 * @param {Object} config - Application configuration
 * @param {Object} router - Vue Router instance
 * @returns {import('pinia').Pinia} The Pinia instance
 */
export function setupStores(config, router) {
  const pinia = createPinia();

  // Make router available to auth store
  setAuthRouter(router);
  // We need to initialize stores after pinia is installed on the app,
  // so we return a setup function
  pinia._config = config;
  pinia._router = router;

  return pinia;
}

/**
 * Initialize store state after pinia is installed on app.
 * Call this after app.use(pinia).
 */
export function initStores(config, router) {
  const configStore = useConfigStore();
  configStore.init(config);

  // Make router available to catalog store for redirects
  const catalogStore = useCatalogStore();
  catalogStore._router = router;
}

export {
  useConfigStore,
  useDatabaseStore,
  usePageStore,
  useCatalogStore,
  useAuthStore
};
