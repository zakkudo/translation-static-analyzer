module.exports = {
    "extends": [
        "eslint:recommended",
        "plugin:node/recommended"
    ],
    "env": {
        "jasmine": true,
        "jest/globals": true
    },
    "plugins": [
        "jasmine",
        "jest"
    ],
    "parserOptions": {
        "ecmaVersion": 6,
        "ecmaFeatures": {
            "experimentalObjectRestSpread": true
        }
    },
    "rules": {
        'max-len': ["error", { "code": 100, "comments": 120 }],
        "no-console": "off"
    }
};
