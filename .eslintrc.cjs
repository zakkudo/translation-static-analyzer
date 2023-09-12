module.exports = {
  env: {
    es2024: true,
    node: true,
  },
  extends: [
    "plugin:node/recommended",
    "eslint:recommended",
    "plugin:json/recommended",
    "plugin:sort/recommended",
  ],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaVersion: "latest",
    requireConfigFile: false,
    sourceType: "module",
  },
  plugins: ["node", "json", "sort"],
  root: true,
  rules: {
    "no-restricted-globals": ["error", "event"],
    "node/no-missing-import": "off",
    "node/no-unpublished-import": "off",
    "node/no-unsupported-features/es-syntax": "off",
    "node/shebang": "off",
  },
};
