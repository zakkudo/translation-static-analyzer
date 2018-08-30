const y18n = jest.genMockFromModule('y18n');
const filesystem = require('./filesystem');

y18n.mockImplementation(() => {
    const instance = {
        cache: {
            template: {
                "Search": "",
                "%s result": {
                    "one": "",
                    "other": "",
                },
                "About": "",
                "Application": ""
            },
        },
        __(k) {
            const cache = this.cache || {};
            const localization = cache['template'] = cache['template'] || {};

            if (!localization.hasOwnProperty(k)) {
                localization[k] = localization[k] || ''
            }
        },
        __n(singular, plural) {
            const cache = this.cache || {};
            const localization = cache['template'] = cache['template'] || {};

            if (!localization.hasOwnProperty(singular)) {
                localization[singular] = localization[singular] || {'one': singular, 'other': plural}
            }
        }
    };

    instance.__ = instance.__.bind(instance);
    instance.__n = instance.__n.bind(instance);

    return instance;
});

module.exports = y18n;
