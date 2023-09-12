module.exports = {
  env: {
    es2024: true,
    node: true,
  },
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:json/recommended",
    "plugin:node/recommended",
    "plugin:sort/recommended",
  ],
  overrides: [
    {
      env: {
        jest: false,
      },
      extends: ["plugin:jest/recommended"],
      files: ["**/*.test.ts", "**/*.test.js", "**/test.ts", "**/test.js"],
      plugins: ["jest"],
      rules: {
        "jest/consistent-test-it": ["warn", { fn: "it" }],
        "jest/no-jasmine-globals": ["warn"],
      },
    },
  ],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaVersion: "latest",
    requireConfigFile: false,
    sourceType: "module",
    tsconfigRootDir: "..",
  },
  plugins: ["@typescript-eslint", "eslint-plugin-tsdoc", "json", "sort"],
  root: true,
  rules: {
    "no-restricted-globals": ["error", "event"],
    "node/no-missing-import": "off",
    "node/no-unpublished-import": "off",
    "node/no-unsupported-features/es-syntax": "off",
  },
};
