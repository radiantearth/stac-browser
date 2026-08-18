import { pageTitle, pageDescription, pageLocale, pageStructuredData } from './page-metadata';
import { addSchemaToDocument } from './schema-org';

// Writes the page metadata to the document head. Used by the standalone app
// only; the web component emits events instead (the host owns its head).

function setMeta(id, value) {
  const node = document.getElementById(id);
  if (node && typeof value === 'string') {
    node.setAttribute('content', value);
  }
}

export default function manageDocumentHead(store, router, i18n) {
  store.watch(() => pageTitle(store, i18n), (title) => {
    document.title = title;
    setMeta('og-title', title);
  }, { immediate: true });

  store.watch(() => pageDescription(store), (description) => {
    if (description) {
      setMeta('meta-description', description);
      setMeta('og-description', description);
    }
  }, { immediate: true });

  store.watch(() => pageLocale(store), (locale) => {
    if (locale) {
      // Keep the document language in sync for assistive technology and SEO.
      document.documentElement.setAttribute('lang', locale);
      setMeta('og-locale', locale);
    }
  }, { immediate: true });

  store.watch(() => store.state.data, () => {
    try {
      // Pass through null too, so it clears the previous route's schema.
      addSchemaToDocument(document, pageStructuredData(store, i18n));
    } catch (error) {
      console.error(error);
    }
  }, { immediate: true });

  const updateUrl = () => setMeta('og-url', window.location.href);
  updateUrl();
  router.afterEach(updateUrl);
}
