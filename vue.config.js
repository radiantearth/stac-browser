const { argv } = require("yargs");

const DEFAULT_PATH_PREFIX = '/';

function getVar(name, defaultValue) {
	let value;
	if (typeof argv[name] === 'string') {
		value = argv[name];
	}
	else if (typeof process.env[name] === 'string') {
		value = process.env[name];
	}
	else {
		value = defaultValue;
	}
	return `"${value}"`;
}

module.exports = {
	runtimeCompiler: true,
	publicPath: process.env.PATH_PREFIX || argv.PATH_PREFIX || DEFAULT_PATH_PREFIX, // Set this if you'd like to deploy at a sub-path,
	chainWebpack: config => {
	  	config.plugin('define').tap(args => {
			args[0]["process.env"].CATALOG_URL = getVar('CATALOG_URL', 'https://raw.githubusercontent.com/cholmes/pdd-stac/beta2/disasters/collection.json');
			args[0]["process.env"].TILE_SOURCE_TEMPLATE = getVar('TILE_SOURCE_TEMPLATE', 'https://tiles.rdnt.io/tiles/{z}/{x}/{y}@2x?url={ASSET_HREF}');
			args[0]["process.env"].STAC_PROXY_URL = getVar('STAC_PROXY_URL');
			args[0]["process.env"].TILE_PROXY_URL = getVar('TILE_PROXY_URL');
			args[0]["process.env"].PATH_PREFIX = getVar('PATH_PREFIX', DEFAULT_PATH_PREFIX);
			args[0]["process.env"].HISTORY_MODE = getVar('HISTORY_MODE', 'history');
			return args;
		})
	}
}