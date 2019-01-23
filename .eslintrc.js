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
  parser: "vue-eslint-parser",
  parserOptions: {
    parser: "babel-eslint"
  },
  rules: {
    "no-console": 0,
    "vue/html-self-closing": 0
  }
};
