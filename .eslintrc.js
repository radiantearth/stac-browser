module.exports = {
  env: {
    node: true
  },
  extends: [
    "eslint:recommended",
    "plugin:vue/recommended",
    "plugin:prettier/recommended",
    "prettier/vue"
  ],
  globals: {
    Buffer: true,
    process: true,
    require: true
  },
  rules: {
    "vue/html-self-closing": 0
  }
};
