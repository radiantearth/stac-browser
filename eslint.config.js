import js from '@eslint/js';
import pluginVue from 'eslint-plugin-vue';
import globals from 'globals'; // Import globals package

export default [
  // Apply to JavaScript and Vue files
  {
    files: ['**/*.{js,mjs,cjs,vue}'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        ...globals.browser,
        // Your custom globals
        STAC_BROWSER_VERSION: 'readonly',
        CONFIG_FROM_ENV: 'readonly',
      }
    }
  },

  // ESLint recommended rules
  js.configs.recommended,

  // Vue 3 strongly recommended rules
  ...pluginVue.configs['flat/recommended'],

  // Custom rules
  {
    rules: {
      // General JavaScript rules
      'curly': ['error', 'all'],
      'semi': ['error', 'always'],
      'dot-notation': 'error',
      'eqeqeq': ['error', 'always'],
      'radix': ['error', 'always'],
      'require-await': 'error',
      'no-constructor-return': 'error',
      'no-duplicate-imports': 'error',
      'no-empty': 'error',
      'no-extend-native': 'error',
      'no-implicit-globals': 'error',
      'no-implicit-coercion': 'error',
      'no-lonely-if': 'error',
      'no-nested-ternary': 'error',
      'no-script-url': 'error',
      'no-shadow': 'error',
      'no-throw-literal': 'error',
      'no-var': 'error',

      // Indentation and spacing
      'indent': ['error', 2, { 'SwitchCase': 1 }],
      'vue/html-indent': ['error', 2],
      'vue/script-indent': ['error', 2, { 'baseIndent': 0, 'switchCase': 1 }],
      'vue/padding-line-between-blocks': ['error', 'always'],

      // Vue component structure and API
      'vue/block-order': ['error', {
        'order': ['template', 'script', 'style']
      }],
      'vue/component-api-style': ['error', ['options']],
      'vue/require-name-property': 'error',
      'vue/require-explicit-emits': 'error',
      'vue/prefer-import-from-vue': 'error',

      // Vue naming conventions
      'vue/match-component-file-name': ['error', {
        'extensions': ['vue'],
        'shouldMatchCase': true
      }],
      'vue/multi-word-component-names': 'off',

      // Vue props / HTML attribute conventions
      'vue/prefer-prop-type-boolean-first': 'error',
      'vue/attribute-hyphenation': 'off',
      'vue/attributes-order': 'off',

      // Vue formatting
      'vue/max-attributes-per-line': ['error', {
        'singleline': {
          'max': 6
        },
        'multiline': {
          'max': 4
        }
      }],

      // Vue template and style safety
      'vue/no-duplicate-class-names': 'error',
      'vue/no-static-inline-styles': 'error',
      'vue/no-template-target-blank': 'error',
      'vue/no-v-html': 'off',
      'vue/no-v-text': 'error',

      // Vue reactivity and property usage
      'vue/no-ref-object-reactivity-loss': 'error',

      // Vue 2 to Vue 3 migration warnings (no longer deprecated)
      'vue/no-deprecated-v-on-native-modifier': 'error',
      'vue/no-deprecated-v-bind-sync': 'error',
      'vue/no-deprecated-destroyed-lifecycle': 'error',
      'vue/no-deprecated-dollar-listeners-api': 'error',
      'vue/no-deprecated-events-api': 'error',
      'vue/no-deprecated-filter': 'error',
      'vue/no-deprecated-functional-template': 'error',
      'vue/no-deprecated-html-element-is': 'error',
      'vue/no-deprecated-inline-template': 'error',
      'vue/no-deprecated-props-default-this': 'error',
      'vue/no-deprecated-router-link-tag-prop': 'error',
      'vue/no-deprecated-scope-attribute': 'error',
      'vue/no-deprecated-slot-attribute': 'error',
      'vue/no-deprecated-slot-scope-attribute': 'error',
      'vue/no-deprecated-v-is': 'error',
      'vue/no-deprecated-vue-config-keycodes': 'error',

      // Code quality
      'no-unused-vars': ['error', { args: 'none', caughtErrors: 'none' }],
      'no-promise-executor-return': 'error',
      'no-self-compare': 'error',
      'no-template-curly-in-string': 'error',
      'no-use-before-define': ["error", {
        "functions": true,
        "classes": false,
        "variables": true,
        "allowNamedExports": true,
        "enums": true,
        "typedefs": true,
        "ignoreTypeReferences": true
      }],
      'vue/no-unused-vars': 'error',
      'vue/no-unused-components': 'error',
      'vue/require-default-prop': 'error',
      'vue/no-empty-component-block': 'error',
      'vue/no-reserved-component-names': 'error',
      'vue/no-unused-emit-declarations': 'error',
      'vue/no-unused-properties': 'error',
      'vue/no-unused-refs': 'error',

      // Performance and race conditions
      'no-await-in-loop': 'error',
      'no-inner-declarations': 'error',
      'no-unmodified-loop-condition': 'error',
      'require-atomic-updates': 'error',

      // HTML
      'no-alert': 'error',
      'vue/singleline-html-element-content-newline': 'off',
    }
  },

  // Ignore patterns
  {
    ignores: [
      '**/stac-fields/**',
      '**/stac-migrate/**',
      '**/stac-layer/**',
      'src/codegen/templates/**',
      'config.js',
      '*.config.js',
      'dist/**',
      'node_modules/**'
    ]
  }
];
