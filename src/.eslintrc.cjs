module.exports = {
  env: {
    es2021: true,
    jest: true,
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
      extends: ["plugin:jest/recommended"],
      files: ["**/*.test.ts", "**/*.test.js", "**/test.ts", "**/test.js"],
      plugins: ["jest"],
      rules: {
      },
    },
  ],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    requireConfigFile: false,
    tsconfigRootDir: "..",
  },
  plugins: [
    "@typescript-eslint",
    "eslint-plugin-tsdoc",
    "json",
    "sort",
    "jest",
  ],
  root: true,
  rules: {
    "node/no-missing-import": "off",
    "node/no-unsupported-features/es-syntax": "off",
  },
};
