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
  parserOptions: {
    parser: "babel-eslint"
  },
  rules: {
    "no-console": 0,
    "vue/html-self-closing": 0
  }
};
