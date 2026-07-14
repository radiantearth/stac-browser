import { defineConfig, loadEnv, searchForWorkspaceRoot } from "vite";
import vue from "@vitejs/plugin-vue";
import { fileURLToPath, pathToFileURL, URL } from "node:url";
import { accessSync, readFileSync } from "fs";
import { resolve } from "node:path";
import { nodePolyfills } from "vite-plugin-node-polyfills";

import Icons from "unplugin-icons/vite";
import IconsResolver from "unplugin-icons/resolver";
import Components from "unplugin-vue-components/vite";
import { FileSystemIconLoader } from "unplugin-icons/loaders";
import { BootstrapVueNextResolver } from "bootstrap-vue-next/resolvers";

import { ViteEjsPlugin } from "vite-plugin-ejs";
import { visualizer } from "rollup-plugin-visualizer";

import yargs from "yargs";

// Read JSON files using fs instead of require
const configSchema = JSON.parse(
  readFileSync(new URL("./config.schema.json", import.meta.url), "utf-8")
);
const package_ = JSON.parse(
  readFileSync(new URL("./package.json", import.meta.url), "utf-8")
);

const optionsForType = (type) =>
  Object.entries(configSchema.properties)
    .filter(
      ([, schema]) => Array.isArray(schema.type) && schema.type.includes(type)
    )
    .map(([key]) => key);

const defaultConfigPath = fileURLToPath(new URL("./config.js", import.meta.url));

// Parse an array-typed option from a single environment variable value.
// A full JSON array (e.g. '[{"label":"a","url":"b"}]') is used as-is, which
// allows arrays of objects. For convenience, a plain comma-separated list
// (e.g. 'en,de,fr') is also accepted and split into an array of strings.
const parseArrayEnv = (value) => {
  const raw = Array.isArray(value) ? value.join(" ") : String(value);
  const trimmed = raw.trim();
  if (trimmed.startsWith("[")) {
    return JSON.parse(trimmed);
  }
  return trimmed
    .split(",")
    .map((v) => v.trim())
    .filter((v) => v.length > 0);
};

const parseEnvConfig = (rawEnv) => {
  const envArgs = Object.entries(rawEnv)
    .filter(([key]) => key.startsWith("SB_") && key !== "SB_CONFIG")
    .flatMap(([key, value]) => [`--${key.slice(3)}`, value]);

  const env = yargs(envArgs)
    .parserConfiguration({ "camel-case-expansion": false })
    .boolean(optionsForType("boolean"))
    .number(optionsForType("number").concat(optionsForType("integer")))
    .option(
      Object.fromEntries([
        ...optionsForType("array").map((k) => [k, { coerce: parseArrayEnv }]),
        ...optionsForType("object").map((k) => [k, { coerce: JSON.parse }]),
      ])
    ).argv;

  delete env._;
  delete env.$0;

  return env;
};

const resolveExternalConfigPath = (configFile) => {
  if (!configFile) {
    return defaultConfigPath;
  }

  const configPath = resolve(process.cwd(), configFile);

  try {
    accessSync(configPath);
  } catch {
    throw new Error(`The config file "${configFile}" could not be found.`);
  }

  return configPath;
};

export default defineConfig(async ({ mode }) => {
  const rawEnv = {
    ...loadEnv(mode, process.cwd(), ""),
    ...process.env,
  };
  const env = parseEnvConfig(rawEnv);
  const externalConfigPath = resolveExternalConfigPath(rawEnv.SB_CONFIG);
  const defaultConfig = (await import(pathToFileURL(defaultConfigPath).href)).default ?? {};
  const externalConfig = (await import(pathToFileURL(externalConfigPath).href)).default ?? {};
  const config = Object.assign({}, defaultConfig, externalConfig, env);
  const runtimeConfig = Boolean(config.runtimeConfig);
  const configFromEnv = runtimeConfig
    ? Object.fromEntries(Object.entries(env).filter(([key]) => key !== "pathPrefix"))
    : env;

  return ({
    base: runtimeConfig ? "./" : config.pathPrefix,
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
          // todo: remove in STAC Browser V6 or if resolved by bootstrap-vue-next.
          silenceDeprecations: ["color-functions", "global-builtin", "import", "if-function"],
        },
      },
    },
    define: {
      STAC_BROWSER_VERSION: JSON.stringify(package_.version),
      // JSON.stringify removes e.g. functions from the config,
      // but from env we do not accept functions anyway.
      CONFIG_FROM_ENV: JSON.stringify(configFromEnv),
      // Expose Vue component internals in the e2e build so end-to-end tests can
      // reach the OpenLayers map (see tests/e2e/helpers.js). Only enabled when the
      // e2e web server sets STAC_BROWSER_E2E; real production builds are unaffected.
      __VUE_PROD_DEVTOOLS__: process.env.STAC_BROWSER_E2E === "true",
    },
    // See https://github.com/vitejs/vite/discussions/14801#discussioncomment-15550931 for details
    optimizeDeps: {
      include: [
        "bootstrap-vue-next/components/*",
        "commonmark",
        "@radiantearth/stac-fields/*",
        "content-type",
        "stac-node-validator",
        "@musement/iso-duration"
      ],
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
      ViteEjsPlugin(config),
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
              BFormInvalidFeedback: true,
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
      // Ensure a single instance of OpenLayers (and stac-js) is used even when
      // ol-stac is symlinked (npm link) during development. Otherwise ol-stac
      // resolves its own copy of `ol`, and adding its LayerGroup to the app's
      // Map breaks OpenLayers' internal map wiring (the layer never gets a map).
      dedupe: ["ol", "stac-js"],
      alias: {
        "@": fileURLToPath(new URL("./src", import.meta.url)),
        "@stac-browser-external-config": externalConfigPath,
      },
    },
    server: {
      fs: {
        allow: [
          searchForWorkspaceRoot(process.cwd()),
          externalConfigPath
        ],
      },
      port: 8080,
    },
  });
});
