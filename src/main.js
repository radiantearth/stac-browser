import createStacBrowser from "./app";
import config from './config';

createStacBrowser(config, STAC_BROWSER_VERSION)
  .then(app => app.mount("body"));
