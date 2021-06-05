const { version } = require('./package.json');
const { getVar } = require('./src/build.js');

module.exports = {
    publicPath: getVar('PATH_PREFIX', false),
    chainWebpack: config => {
	  	config.plugin('define').tap(args => {
			args[0].STAC_BROWSER_VERSION = JSON.stringify(version);
			args[0].CATALOG_URL = getVar('CATALOG_URL');
			args[0].CATALOG_TITLE = getVar('CATALOG_TITLE');
			args[0].TILE_SOURCE_TEMPLATE = getVar('TILE_SOURCE_TEMPLATE');
			args[0].STAC_PROXY_URL = getVar('STAC_PROXY_URL');
			args[0].TILE_PROXY_URL = getVar('TILE_PROXY_URL');
			args[0].PATH_PREFIX = getVar('PATH_PREFIX');
			args[0].HISTORY_MODE = getVar('HISTORY_MODE');
			args[0].STAC_LINT = getVar('STAC_LINT');
			return args;
		});
        config.plugin('html').tap(args => {
			args[0].title = getVar('CATALOG_TITLE', false);
			return args;
		});
	}
}
