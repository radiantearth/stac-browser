const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');
const path = require('path');
const NodePolyfillPlugin = require('node-polyfill-webpack-plugin');
const Icons = require('unplugin-icons/webpack');
const Components = require('unplugin-vue-components/webpack');
const IconsResolver = require('unplugin-icons/resolver');
const { BootstrapVueNextResolver } = require('bootstrap-vue-next/resolvers');

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
    // Vue 3 template compiler options - using defaults for pure Vue 3
    webpackConfig.module
      .rule('vue')
      .use('vue-loader')
      .tap(options => {
        if (!options.compilerOptions) {
          options.compilerOptions = {};
        }
        // Preserve whitespace behavior from Vue 2
        options.compilerOptions.whitespace = 'preserve';
        // Keep comments during development for better debugging
        options.compilerOptions.comments = process.env.NODE_ENV !== 'production';
        return options;
      });

    webpackConfig.plugin('define').tap(args => {
      args[0].STAC_BROWSER_VERSION = JSON.stringify(pkgFile.version);
      args[0].CONFIG_PATH = JSON.stringify(configFile);
      args[0].CONFIG_CLI = JSON.stringify(argv);
      args[0].__VUE_OPTIONS_API__ = true;
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
      }),
      Components({
        resolvers: [
          BootstrapVueNextResolver(), // Auto-register Bootstrap components
          IconsResolver({ 
            prefix: false,
            enabledCollections: ['bi'],
            alias: {
              'b-icon': 'bi'
            }
          })
        ]
      }),
      Icons({
        compiler: 'vue3',
      }),
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
