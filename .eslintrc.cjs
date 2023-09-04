module.exports = {
  root: true,
  parser: "@typescript-eslint/parser",
  extends: [
    "plugin:node/recommended",
    "eslint:recommended",
    "plugin:json/recommended",
  ],
  plugins: ["node", "json"],
  env: {
    es2021: true,
    jest: true,
    node: true,
  },
  parserOptions: {
    requireConfigFile: false,
  },
  rules: {
    "node/shebang": "off",
  },
};
