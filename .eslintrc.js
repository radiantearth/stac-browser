module.exports = {
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: "module"
  },
  extends: [
    'plugin:vue/strongly-recommended'
  ],
  rules: {
    "semi": [1, "always"],
    "vue/multi-word-component-names": "off",
    "vue/singleline-html-element-content-newline": "off",
    "vue/attribute-hyphenation": "off",
    "vue/max-attributes-per-line": ["error", {
      "singleline": {
        "max": 6
      },      
      "multiline": {
        "max": 4
      }
    }],
    "vue/component-tags-order": ["error", {
      "order": ["template", "script", "style"]
    }],
    "vue/order-in-components": "error",
    "vue/this-in-template": "error",
    "vue/match-component-file-name": "error"
  }
};