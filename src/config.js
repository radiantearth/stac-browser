let config;
if (typeof CONFIG_PATH === 'undefined' && typeof CONFIG_CLI === 'undefined') {
  config = require('../config');
}
else {
  config = Object.assign(require(CONFIG_PATH), CONFIG_CLI);
}

const buildConfig = require('../build.config');
config = Object.assign(buildConfig, config);

export default config;