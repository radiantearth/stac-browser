let config;
if (typeof CONFIG_PATH === 'undefined') {
  config = require('../config');
}
else {
  config = require(CONFIG_PATH);
}
if (typeof CONFIG_CLI !== 'undefined') {
  Object.assign(config, CONFIG_CLI);
}
if (typeof window !== 'undefined' && window.STAC_BROWSER_CONFIG) {
  Object.assign(config, window.STAC_BROWSER_CONFIG);
}

export default config;
