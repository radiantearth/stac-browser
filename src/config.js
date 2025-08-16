let config;
if (typeof CONFIG_PATH === 'undefined') {
  config = require('../config');
}
else {
  config = require(CONFIG_PATH);
}

export default Object.assign(config, CONFIG_CLI, window.STAC_BROWSER_CONFIG);