import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { fileURLToPath, URL } from "node:url";
import path from "path";
import { createRequire } from "module";
import { nodePolyfills } from "vite-plugin-node-polyfills";

import Icons from "unplugin-icons/vite";
import IconsResolver from "unplugin-icons/resolver";
import Components from "unplugin-vue-components/vite";
import { FileSystemIconLoader } from "unplugin-icons/loaders";
import { BootstrapVueNextResolver } from "bootstrap-vue-next/resolvers";

import { createHtmlPlugin } from "vite-plugin-html";
import { visualizer } from "rollup-plugin-visualizer";

import yargs from "yargs";

const require = createRequire(import.meta.url);
const configSchema = require("./config.schema.json");
const package_ = require("./package.json");

const optionsForType = (type) =>
  Object.entries(configSchema.properties)
    .filter(
      ([, schema]) => Array.isArray(schema.type) && schema.type.includes(type)
    )
    .map(([key]) => key);

const env = yargs()
  .parserConfiguration({ "camel-case-expansion": false })
  .env("SB")
  .boolean(optionsForType("boolean"))
  .number(optionsForType("number").concat(optionsForType("integer")))
  .array(optionsForType("array"))
  .option(
    Object.fromEntries(
      optionsForType("object").map((k) => [k, { coerce: JSON.parse }])
    )
  ).argv;

delete env._;
delete env.$0;

const configFilePath = path.resolve(env.CONFIG ? env.CONFIG : "./config.js");
const configFromFile = require(configFilePath);
const config = Object.assign(configFromFile, env);

export default defineConfig(({ mode }) => ({
  base: config.pathPrefix,
  build: {
    sourcemap: mode !== "minimal",
    rollupOptions: {
      external: ["fs/promises"],
    },
  },
  css: {
    preprocessorOptions: {
      scss: {
        api: "modern-compiler",
        silenceDeprecations: ["color-functions", "global-builtin", "import"],
      },
    },
  },
  define: {
    STAC_BROWSER_VERSION: JSON.stringify(package_.version),
    CONFIG: JSON.stringify(config),
  },
  plugins: [
    vue({
      template: {
        compilerOptions: {
          // Preserve whitespace behavior from Vue 2
          whitespace: "preserve",
        },
      },
    }),
    createHtmlPlugin({
      minify: mode !== "development",
      template: "public/index.html",
      inject: {
        data: config,
      },
    }),
    Components({
      dirs: [],
      globs: [],
      resolvers: [
        BootstrapVueNextResolver({
          components: {
            BContainer: true,
            BRow: true,
            BCol: true,
            BAlert: true,
            BButton: true,
            BButtonGroup: true,
            BBadge: true,
            BForm: true,
            BFormGroup: true,
            BFormInput: true,
            BFormSelect: true,
            BFormCheckbox: true,
            BFormRadio: true,
            BFormRadioGroup: true,
            BInputGroup: true,
            BListGroup: true,
            BListGroupItem: true,
            BSpinner: true,
          },
        }), // Auto-register Bootstrap components
        IconsResolver({
          prefix: false,
          enabledCollections: ["bi"],
          alias: {
            "b-icon": "bi",
          },
          customCollections: ["share"],
        }),
      ],
    }),
    Icons({
      compiler: "vue3",
      customCollections: {
        share: FileSystemIconLoader("./src/media/"),
      },
    }),
    nodePolyfills({
      include: ["buffer", "path", "process"],
      globals: {
        Buffer: true,
        process: true,
      },
    }),
    mode === "report" &&
      visualizer({
        filename: "./dist/report.html",
        gzipSize: true,
        brotliSize: true,
        open: true,
      }),
  ],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  server: {
    port: 8080,
  },
}));
