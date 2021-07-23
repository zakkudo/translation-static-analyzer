const path = require("path");

module.exports = {
  root: true,
  parser: "@typescript-eslint/parser",
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:json/recommended",
    "plugin:node/recommended",
  ],
  plugins: ["@typescript-eslint", "eslint-plugin-tsdoc", "json"],
  env: {
    es2021: true,
    node: true,
    jest: true,
  },
  parserOptions: {
    requireConfigFile: false,
    tsconfigRootDir: path.join(__dirname, ".."),
  },
  rules: {
    'node/no-unsupported-features/es-syntax': 'off',
    'node/no-missing-import': 'off',
  },
};
