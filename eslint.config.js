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
        CONFIG_PATH: 'readonly',
        CONFIG_CLI: 'readonly',
        CONFIG: 'readonly'
      }
    }
  },
  
  // ESLint recommended rules
  js.configs.recommended,
  
  // Vue 3 strongly recommended rules
  ...pluginVue.configs['flat/strongly-recommended'],
  
  // Custom rules
  {
    rules: {
      // General JavaScript rules
      'curly': [1, 'all'],
      'semi': [1, 'always'],
      
      // Vue component naming
      'vue/multi-word-component-names': 'off',
      'vue/singleline-html-element-content-newline': 'off',
      'vue/attribute-hyphenation': 'off',
      
      // Vue formatting
      'vue/max-attributes-per-line': ['error', {
        'singleline': {
          'max': 6
        },      
        'multiline': {
          'max': 4
        }
      }],
      
      // Component structure
      'vue/block-order': ['error', {
        'order': ['template', 'script', 'style']
      }],
      'vue/this-in-template': 'error',
      
      // Vue 3 specific
      'vue/no-v-model-argument': 'off',
      'vue/require-explicit-emits': 'warn',
      'vue/v-on-event-hyphenation': 'warn',
      'vue/prefer-import-from-vue': 'error',
      
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
      'vue/no-unused-vars': 'warn',
      'vue/no-unused-components': 'warn',
      'vue/require-default-prop': 'warn',
      'vue/no-undef-properties': 'off',
      'vue/no-empty-component-block': 'warn',
      'vue/no-reserved-component-names': 'warn'
    }
  },
  
  // Ignore patterns
  {
    ignores: [
      '**/stac-fields/**',
      '**/stac-migrate/**',
      '**/stac-layer/**',
      'config.js',
      '*.config.js',
      'dist/**',
      'node_modules/**'
    ]
  }
];
