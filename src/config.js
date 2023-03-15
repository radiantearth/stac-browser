let config;
if (typeof CONFIG_PATH === 'undefined' && typeof CONFIG_CLI === 'undefined') {
  config = require('../config');
}
else {
  config = Object.assign(require(CONFIG_PATH), CONFIG_CLI);
}

export default config;