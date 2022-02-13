const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');
const argv = yargs(hideBin(process.argv)).argv;
// Clean-up arguments
delete argv._;
delete argv.$0;

const pkgFile = require('./package.json');

const path = require('path');
const configFile = path.resolve(argv.CONFIG ? argv.CONFIG : './config.js');
const configFromFile = require(configFile);
const mergedConfig = Object.assign(configFromFile, argv);

module.exports = {
	publicPath: mergedConfig.pathPrefix,
	chainWebpack: webpackConfig => {
		webpackConfig.plugin('define').tap(args => {
			args[0].STAC_BROWSER_VERSION = JSON.stringify(pkgFile.version);
			args[0].CONFIG_PATH = JSON.stringify(configFile);
			args[0].CONFIG_CLI = JSON.stringify(argv);
			return args;
		});
		webpackConfig.plugin('html').tap(args => {
			args[0].title = mergedConfig.title;
			return args;
		});
	}
}