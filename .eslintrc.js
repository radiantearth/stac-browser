module.exports = {
  extends: ["eslint:recommended", "plugin:vue/recommended"],
  globals: {
    require: true
  },
  parser: "vue-eslint-parser",
  parserOptions: {
    parser: "babel-eslint"
  },
  rules: {
    "no-console": 0
  }
};
