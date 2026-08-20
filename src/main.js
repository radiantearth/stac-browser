import createStacBrowser from "./app";
import config from './merged-config';
import manageDocumentHead from './document-head';
import { size } from 'stac-js/src/utils.js';

const browserVersion = typeof STAC_BROWSER_VERSION !== 'undefined' ? STAC_BROWSER_VERSION : null;

createStacBrowser(config, browserVersion)
  .then(({ app, store, router, i18n }) => {
    // Page-global behavior the web component build deliberately omits.
    manageDocumentHead(store, router, i18n.global);

    window.addEventListener('unload', () => {
      Object.values(store.state.downloads)
        .filter(stream => stream && typeof stream.abort === 'function')
        .forEach(stream => stream.abort());
    });
    window.addEventListener('beforeunload', (evt) => {
      if (size(store.state.downloads) > 0) {
        evt.preventDefault();
      }
    });

    app.mount("body");
  });
