const packageConfig = require("../package.json");

module.exports = {
  presets: [
    "@babel/preset-typescript",
    [
      "@babel/env",
      {
        debug: process.env.NODE_ENV === "build",
        targets: {
          browsers: ["last 1 version", "> 1%", "not dead"],
          node: "20",
        },
      },
    ],
  ],
  plugins: [
    "transform-undefined-to-void",
    ["transform-define", { __VERSION__: packageConfig.version }],
  ],
  minified: false, // When enabled, makes debuggers confused even with source maps
  comments: false,
};
