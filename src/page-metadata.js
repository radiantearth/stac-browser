import Utils from './utils';
import { STAC } from 'stac-js';
import { getDisplayTitle } from './models/stac';
import { createCatalogSchema, createItemSchema } from './schema-org';

// Page-level metadata derived from the store, shared by the standalone
// document-head manager and the web component's events.

function longTitle(store, i18n) {
  if (store.state.catalogTitle) {
    return store.state.catalogTitle;
  }
  const root = store.getters.root;
  if (root) {
    return getDisplayTitle(root);
  }
  if (store.state.url && store.state.loading) {
    return ''; // no title flash while loading
  }
  return i18n.t('STAC Browser');
}

export function pageTitle(store, i18n) {
  const titles = new Set();
  if (store.getters.title) {
    titles.add(store.getters.title);
  }
  const long = longTitle(store, i18n);
  if (long) {
    titles.add(long);
  }
  return Array.from(titles).join(' - ') || i18n.t('STAC Browser');
}

export function pageDescription(store) {
  const description = store.getters.description;
  return description ? Utils.summarizeMd(description, 200) : null;
}

export function pageLocale(store) {
  return store.state.uiLanguage || null;
}

export function pageStructuredData(store, i18n) {
  const data = store.state.data;
  if (!(data instanceof STAC)) {
    return null;
  }
  if (data.isItem) {
    return createItemSchema(data, [store.getters.collectionLink, store.getters.parentLink], store, i18n);
  }
  return createCatalogSchema(data, [store.getters.parentLink, store.getters.rootLink], store, i18n);
}
