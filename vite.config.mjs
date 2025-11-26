import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { fileURLToPath, URL } from 'node:url';
import path from 'path';
import { createRequire } from 'module';
import { nodePolyfills } from 'vite-plugin-node-polyfills';

import Icons from 'unplugin-icons/vite';
import IconsResolver from 'unplugin-icons/resolver';
import Components from 'unplugin-vue-components/vite';
import { FileSystemIconLoader } from 'unplugin-icons/loaders';
import { BootstrapVueNextResolver } from 'bootstrap-vue-next/resolvers';

import { createHtmlPlugin } from 'vite-plugin-html';
import { visualizer } from 'rollup-plugin-visualizer';

const require = createRequire(import.meta.url);
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');

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

export default defineConfig(({ mode }) => ({
    base: mergedConfig.pathPrefix || '/',
    build: {
        sourcemap: mode !== 'minimal',
        rollupOptions: {
            external: ['fs/promises']
        }
    },
    css: {
        preprocessorOptions: {
            scss: {
                api: 'modern-compiler',
                silenceDeprecations: [ 'color-functions', 'global-builtin', 'import']
            }
        }
    },
    define: {
        STAC_BROWSER_VERSION: JSON.stringify(pkgFile.version),
        CONFIG: JSON.stringify(mergedConfig)
    },
    plugins: [
        vue({
            template: {
                compilerOptions: {
                    // Preserve whitespace behavior from Vue 2
                    whitespace: 'preserve'
                },
            },
        }),
        createHtmlPlugin({
            minify: mode === 'production',
            template: 'public/index.html',
            inject: {
                data: {
                    catalogTitle: mergedConfig.catalogTitle || 'STAC Browser',
                    catalogUrl: mergedConfig.catalogUrl || '',
                    ...mergedConfig,
                },
            },
        }),
        Components({
            dirs: [],
            globs: [],
            resolvers: [
                BootstrapVueNextResolver({
                    components: {
                        'BContainer': true,
                        'BRow': true,
                        'BCol': true,
                        'BAlert': true,
                        'BButton': true,
                        'BButtonGroup': true,
                        'BBadge': true,
                        'BDropdown': true,
                        'BDropdownItem': true,
                        'BDropdownItemButton': true,
                        'BForm': true,
                        'BFormGroup': true,
                        'BFormInput': true,
                        'BFormSelect': true,
                        'BFormCheckbox': true,
                        'BFormRadio': true,
                        'BFormRadioGroup': true,
                        'BInputGroup': true,
                        'BListGroup': true,
                        'BListGroupItem': true,
                        'BPopover': true,
                        'BSpinner': true,
                    },
                }), // Auto-register Bootstrap components
                IconsResolver({
                    prefix: false,
                    enabledCollections: ['bi'],
                    alias: {
                        'b-icon': 'bi',
                    },
                    customCollections: ['share'],
                }),
            ],
        }),
        Icons({
            compiler: 'vue3',
            customCollections: {
                'share': FileSystemIconLoader('./src/media/'),
            },
        }),
        nodePolyfills({
            include: ['buffer', 'path', 'process'],
            globals: {
                Buffer: true,
                process: true,
            },
        }),
        visualizer({
            filename: './dist/report.html',
            gzipSize: true,
            brotliSize: true,
            open: mode === 'report',
        }),
    ],
    resolve: {
        alias: {
            '@': fileURLToPath(new URL('./src', import.meta.url)),
        }
    },
    server: {
        port: 8080,
    }
}));
