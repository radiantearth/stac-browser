const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');
const argv = yargs(hideBin(process.argv))
  .parserConfiguration({'camel-case-expansion': false})
  .boolean([
    'allowExternalAccess',
    'displayGeoTiffByDefault',
    'redirectLegacyUrls',
    'showThumbnailsAsAssets',
    'stacLint',
    'useTileLayerAsFallback',
    'noSourceMaps'
  ])
  .number([
    'itemsPerPage',
    'maxPreviewsOnMap'
  ])
  .array([
    'supportedLocales'
  ])
  .argv;
// Clean-up arguments
delete argv._;
delete argv.$0;

const pkgFile = require('./package.json');

const path = require('path');
const configFile = path.resolve(argv.CONFIG ? argv.CONFIG : './config.js');
const configFromFile = require(configFile);
const mergedConfig = Object.assign(configFromFile, argv);
const NodePolyfillPlugin = require('node-polyfill-webpack-plugin');

const config = {
  lintOnSave: process.env.NODE_ENV !== 'production',
  productionSourceMap: !mergedConfig.noSourceMaps,
  publicPath: mergedConfig.pathPrefix,
  chainWebpack: webpackConfig => {
    webpackConfig.plugin('define').tap(args => {
      args[0].STAC_BROWSER_VERSION = JSON.stringify(pkgFile.version);
      args[0].CONFIG_PATH = JSON.stringify(configFile);
      args[0].CONFIG_CLI = JSON.stringify(argv);
      return args;
    });
    webpackConfig.plugin('html').tap(args => {
      args[0].title = mergedConfig.catalogTitle;
      return args;
    });
  },
  configureWebpack: {
    resolve: {
      fallback: {
        'fs/promises': false
      }
    },
    plugins: [
      new NodePolyfillPlugin({
        includeAliases: ['Buffer', 'path']
      })
    ]
  },
  pluginOptions: {
    i18n: {
      locale: mergedConfig.locale,
      fallbackLocale: mergedConfig.fallbackLocale,
      enableInSFC: false
    }
  }
};

module.exports = config;