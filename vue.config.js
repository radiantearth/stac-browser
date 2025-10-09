const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');
const path = require('path');
const NodePolyfillPlugin = require('node-polyfill-webpack-plugin');

const { properties } = require('./config.schema.json');
const pkgFile = require('./package.json');

const optionsForType = (type) => Object.entries(properties)
  .filter(([_, schema]) => Array.isArray(schema.type) && schema.type.includes(type))
  .map(([key]) => key);
const argv = yargs(hideBin(process.argv))
  .parserConfiguration({'camel-case-expansion': false})
  .env('SB')
  .boolean(optionsForType("boolean"))
  .number(optionsForType("number").concat(optionsForType("integer")))
  .array(optionsForType("array"))
  .option(
    Object.fromEntries(
      optionsForType("object").map((k) => [k, { coerce: JSON.parse }])
    )
  )
  .argv;
// Clean-up arguments
delete argv._;
delete argv.$0;

const configFile = path.resolve(argv.CONFIG ? argv.CONFIG : './config.js');
const configFromFile = require(configFile);
const mergedConfig = Object.assign(configFromFile, argv);

const vueConfig = {
  lintOnSave: process.env.NODE_ENV !== 'production',
  productionSourceMap: !mergedConfig.noSourceMaps,
  publicPath: mergedConfig.pathPrefix,
  chainWebpack: webpackConfig => {
    // Configure Vue 3 compatibility mode
    webpackConfig.resolve.alias.set('vue', '@vue/compat');

    // Configure Vue 3 template compiler options
    webpackConfig.module
      .rule('vue')
      .use('vue-loader')
      .tap(options => {
        if (!options.compilerOptions) {
          options.compilerOptions = {};
        }
        // Preserve whitespace behavior from Vue 2
        options.compilerOptions.whitespace = 'preserve';
        // Preserve comments during development for better debugging
        // In production, comments are removed for smaller bundle size
        options.compilerOptions.comments = process.env.NODE_ENV !== 'production';
        return options;
      });

    webpackConfig.plugin('define').tap(args => {
      args[0].STAC_BROWSER_VERSION = JSON.stringify(pkgFile.version);
      args[0].CONFIG_PATH = JSON.stringify(configFile);
      args[0].CONFIG_CLI = JSON.stringify(argv);
      args[0].__VUE_OPTIONS_API__ = true;
      args[0].__VUE_PROD_DEVTOOLS__ = false;
      args[0].__VUE_PROD_HYDRATION_MISMATCH_DETAILS__ = false;
      return args;
    });

    webpackConfig.plugin('html').tap(args => {
      args[0].title = mergedConfig.catalogTitle;
      args[0].url = mergedConfig.catalogUrl;
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

module.exports = vueConfig;
