const JSON5 = require('json5');
const equal = require('deep-equal');
const fs = require('fs');
const glob = require('glob');
const path = require('path');
const y18n = require('y18n');
const hasTranslation = require('./hasTranslation');
const scrubLocalization = require('./scrubLocalization');
const readString = require('./readString');
const isSubPath = require('./isSubPath');

const defaultLocaleGenerationDirectory = path.resolve('./.locale-gen');
const defaultLocaleGenerationFilename = path.resolve(defaultLocaleGenerationDirectory, 'template.json');

const name = 'translate-static-analyzer';

/**
 * @private
 */
function print(message, ...leftover) {
    console.log(`${name}: ${message}`, ...leftover);
}

/**
 * @private
 */
function calculateTargetFiles(targetDirectories, all) {
    const target = all.reduce((accumulator, a) => {
        let unused = true;

        targetDirectories.forEach((t) => {
            if (isSubPath(t, a)) {
                if (!accumulator[t]) {
                    accumulator[t] = new Set([a]);
                } else {
                    accumulator[t].add(a)
                }

                unused = false;
            }
        });

        if (unused) {
            targetDirectories.forEach((t) => {
                if (!accumulator[t]) {
                    accumulator[t] = new Set([a]);
                } else {
                    accumulator[t].add(a);
                }
            });
        }

        return accumulator;
    }, {});

    return Object.keys(target).reduce((accumulator, k) => {
        return Object.assign({}, accumulator, {
            [k]: [...target[k]].sort()
        });
    }, {});
}

/**
 * @private
 */
function calculateFiles(modifiedFiles, options = {}) {
    const {files, target} = options;
    const all = glob.sync(files);
    const hasModifiedFiles = Boolean(modifiedFiles.length);
    const modifiedFilesAsSet = new Set(modifiedFiles);
    const modified = hasModifiedFiles ? all.filter((a) => modifiedFilesAsSet.has(a)) : all;
    const targetDirectories = glob.sync(target).filter((t) => fs.statSync(t).isDirectory());
    const filesByTargetDirectory = calculateTargetFiles(targetDirectories, all);

    return {
        all,
        modified,
        target: {
            targetDirectories,
            filesByTargetDirectory,
        },
    };
}

/**
 * @private
 */
function serializeLocalizationWithMetaData(localizationWithMetadata) {
    const keys = Object.keys(localizationWithMetadata);
    const length = keys.length;

    return keys.reduce((serialized, k, i) => {
        const hasMore = i < length - 1;
        const indent = '    ';
        const note = localizationWithMetadata[k].note;
        const formattedNote = note ? `${indent}// ${note.toUpperCase()}\n` : '';
        const files = localizationWithMetadata[k].files;
        const formattedFiles = files.length ? `${indent}// ` + files.join(`\n${indent}// `) + '\n' : '';

        return `${serialized}${formattedNote}${formattedFiles}${indent}"${k}": ${JSON.stringify(localizationWithMetadata[k].data)}${hasMore ? ',' : ''}\n`;
    }, '{\n') + '}';
}

/**
 * A library for scanning javscript files to build translation mappings in json automatically.
 *
 * [![Build Status](https://travis-ci.org/zakkudo/translation-static-analyzer.svg?branch=master)](https://travis-ci.org/zakkudo/translation-static-analyzer)
 * [![Coverage Status](https://coveralls.io/repos/github/zakkudo/translation-static-analyzer/badge.svg?branch=master)](https://coveralls.io/github/zakkudo/translation-static-analyzer?branch=master)
 *
 * Why use this?
 *
 * - You no longer have to manage hierarchies of translations
 * - Templates are automatically generated for the translators
 * - The translations are noted if they are new, unused and what files
 * - It allows splitting the translations easily for dynamic imports to allow sliced loading
 * - Any string wrapped in `__()` or `__n()`, will be picked up as a translatable making usage extremely easy for developers
 *
 * What does it do?
 *
 * - I generates a locales directory filled with templates where the program was run, used by humans to translate
 * - It generates .locale directories optimized for loading in each of the directories passed to targets
 * - You load those translations from .locales as you need them
 *
 * Install with:
 *
 * ```console
 * yarn add @zakkudo/translation-static-analyzer
 * ```
 *
 * Also consider `@zakkudo/translate-webpack-plugin` which is a wrapper for this library
 * for webpack and `@zakkudo/translator` for a library that can read the localization with
 * no fuss and apply the translations.
 *
 * @example <caption>Usage for just translating everything in a project</caption>
 * const TranslationStaticAnalyzer = require('@zakkudo/translation-static-analyzer');
 * const analyzer = new TransalationStaticAnalyzer({
 *     files: 'src/**\/*.js', // Analyzes all javscript files in the src directory
 *     debug: true, // Enables verbose output
 *     locales: ['fr', 'en'], // generate a locales/fr.json as well as a locales/en.json
 *     target: 'src' // Each page in the folder will get it's own subset of translations
 * });
 * analyzer.update();
 *
 *
 * @example <caption>Usage for splitting transaltions between dynamically imported pages of a web app</caption>
 * const TranslationStaticAnalyzer = require('@zakkudo/translation-static-analyzer');
 * const analyzer = new TransalationStaticAnalyzer({
 *     files: 'src/**\/*.js', // Analyzes all javscript files in the src directory
 *     debug: true, // Enables verbose output
 *     locales: ['fr', 'en'], // generate a locales/fr.json as well as a locales/en.json
 *     target: 'src/pages/*' // Each page in the folder will get it's own subset of translations
 * });
 * analyzer.update();
 *
 *
 * @example <caption>Generated translation templates</caption>
 * {
 *     // NEW
 *     // src/Application/pages/AboutPage/index.js:14
 *     "About": "",
 *     // UNUSED
 *     "This isn't used anymore": "So the text here doesn't really do anything",
 *     // src/Application/pages/AboutPage/index.js:38
 *     "Welcome to the about page!": "ようこそ"
 * }
 *
 *
 * @example <caption>Use the translations with @zakkudo/translator</caption>
 * import Translator from '@zakkudo/translator';
 * import localization = from './src/.locales/ja.json'; //Generated by the analyzer
 *
 * const translator = new Translator();
 * translator.mergeLocalization('ja', localization); //Load the localization
 * translator.setLocale('ja'); //Tell the translator to use it
 *
 * const translated = translator.__('I love fish'); //Translate!
 * const translated = translator.__n('There is a duck in the pond.', 'There are %d ducks in the pond', 3); //Translate!
 *
 * @module TranslationStaticAnalyzer
 */
module.exports = class TranslationStaticAnalyzer {
    /**
     * @param {Object} options - The modifiers for how the analyzer is run
     * @param {String} options.files - A glob of the files to pull translations from
     * @param {Boolean} options.debug - Show debugging information in the console
     * @param {Array<String>} options.locales - The locales to generate (eg fr, ja_JP, en)
     * @param {String} options.target - Where to write the final translations, which can be split between
     *                                  multiple directories for modularity
     */
    constructor(options) {
        this.options = options;
        this.sourceByFilename = new Map();
        this.keysByFilename = new Map();
        this.filenamesByKey = new Map();
        this.localizationByLanguage = new Map();

        this.instance = y18n({
            updateFiles: true, //If it doesn't write the file, it also don't update the cache
            directory: defaultLocaleGenerationDirectory,
            locale: 'template',
        });
    }

    getDirectory() {
        const options = this.options || {};

        return options.directory || './locales';
    }

    readJSON5FileWithFallback(filename, fallback = null) {
        let data = fallback;

        try {
            data = JSON5.parse(fs.readFileSync(filename));
        } catch (e) {
            if (e.code !== 'ENOENT') {
                throw e;
            }
        }

        return data;
    }

    readLocalization(locale) {
        const directory = this.getDirectory();
        const filename = `${directory}/${locale}.json`;

        return this.readJSON5FileWithFallback(filename);
    }

    writeLocalizationWithMetadata(locale, localization) {
        const directory = this.getDirectory();
        const filename = `${directory}/${locale}.json`;
        const serialized = serializeLocalizationWithMetaData(localization);

        fs.writeFileSync(filename, serialized);
    }

    updateLocalization(localization) {
        const template = scrubLocalization(this.instance.cache.template);
        const filenamesByKey = this.filenamesByKey;
        const keys = [
            ...new Set(Object.keys(localization).concat(Object.keys(template)))
        ].sort();
        const fallbackFiles = new Set();

        return keys.reduce((accumulator, k) => {
            const files = [...(filenamesByKey.get(k) || fallbackFiles)].sort();
            const localizationHasProperty = localization.hasOwnProperty(k);
            const localizationHasTranslation = hasTranslation(localization[k]);
            const templateHasProperty = template.hasOwnProperty(k);

            if (!templateHasProperty && localizationHasTranslation) {
                return Object.assign({}, accumulator, {
                    [k]: {
                        note: 'unused',
                        files,
                        data: localization[k]
                    }
                });
            } else if (templateHasProperty && !localizationHasTranslation) {
                return Object.assign({}, accumulator, {
                    [k]: {
                        note: 'new',
                        files,
                        data: template[k]
                    }
                });
            } else if (templateHasProperty && localizationHasProperty) {
                return Object.assign({}, accumulator, {
                    [k]: {
                        files,
                        data: localization[k]
                    }
                });
            }

            return accumulator;
        }, {});
    }

    generateLocaleFiles() {
        const options = this.options || {};
        const locales = options.locales || [];
        const localizationByLanguage = this.localizationByLanguage = new Map();

        locales.forEach((l) => {
            const localization = this.readLocalization(l) || {};
            const localizationWithMetadata = this.updateLocalization(localization);

            localizationByLanguage.set(l, localization);

            this.writeLocalizationWithMetadata(l, localizationWithMetadata);
        });
    }

    clear() {
        try {
            fs.unlinkSync(defaultLocaleGenerationFilename);
        } catch (e) {
        }

        this.instance.cache.template = {};
    }

    parseSourceFiles() {
        const files = this.files.modified;
        const filenamesByKey = this.filenamesByKey = new Map();

        this.clear();

        files.forEach((m) => {
            const contents = String(fs.readFileSync(m));
            const metadata = readString(contents);
            const keysByFilename = this.keysByFilename;
            const sourceByFilename = this.sourceByFilename;

            if (metadata) {
                const keys = Object.keys(metadata);
                const {__, __n} = this.instance;

                Object.values(metadata).forEach((v) => {
                    try {
                        eval(v.fn);
                    } catch(e) {
                        console.warn(e);
                    }
                });

                keys.forEach((k) => {
                    const {lineNumber} = metadata[k];

                    if (!filenamesByKey.has(k)) {
                        filenamesByKey.set(k, new Set());
                    }

                    filenamesByKey.get(k).add(`${m}:${lineNumber}`);
                });

                sourceByFilename.set(m, contents);
                keysByFilename.set(m, new Set(keys));
            }
        });
    }

    writeToTargets() {
        const options = this.options || {};
        const locales = options.locales || [];
        const filesByTargetDirectory = this.files.target.filesByTargetDirectory;
        const targetDirectories = Object.keys(filesByTargetDirectory);
        const localizationByLanguage = this.localizationByLanguage;
        const keysByFilename = this.keysByFilename;

        targetDirectories.forEach((t) => {
            const directory = path.resolve(t, '.locales'); //Initintionally a hidden directory

            try {
                fs.mkdirSync(directory);
            } catch(e) {
                if (e.code !== 'EEXIST') {
                    console.error(e);
                }
            }

            locales.forEach((l) => {
                const filenames = filesByTargetDirectory[t] || [];
                const localization = localizationByLanguage.get(l);
                const subLocalization = {};
                const filename = path.resolve(directory, `${l}.json`);
                const previous = this.readJSON5FileWithFallback(filename);

                filenames.forEach((f) => {
                    const keys = keysByFilename.get(f) || new Set();

                    keys.forEach((k) => {
                        if (localization.hasOwnProperty(k) && hasTranslation(localization[k])) {
                            subLocalization[k] = localization[k]
                        }
                    });
                });

                const previousSubLocalization = this.readJSON5FileWithFallback(filename);

                if (!equal(subLocalization, previousSubLocalization)) {
                    fs.writeFileSync(filename, JSON.stringify(subLocalization, null, 4));
                }

            });
        });
    }

    update(modifiedFiles) {
        const options = this.options;
        const files = this.files = calculateFiles(modifiedFiles, options)

        if (options.debug) {
            print('Initializing localizations of: ', files);
        }

        if (files.modified.length) {
            this.parseSourceFiles();
            this.generateLocaleFiles();
            this.writeToTargets();
        }
    }
}
