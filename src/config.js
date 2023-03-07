let config;
if (typeof CONFIG_PATH === 'undefined' && typeof CONFIG_CLI === 'undefined') {
  config = require('../config');
}
else {
  config = Object.assign(require(CONFIG_PATH), CONFIG_CLI);
}

config.catalogUrl = new URL(config.catalogUrl, location.href).href;

export default config;