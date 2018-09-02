const JSON5 = require('json5');
const safeEval = require('safe-eval');
const equal = require('deep-equal');
const fs = require('fs-extra');
const glob = require('glob');
const os = require('os');
const path = require('path');
const y18n = require('y18n');
const console = require('console');
const hasTranslation = require('./hasTranslation');
const scrubLocalization = require('./scrubLocalization');
const readString = require('./readString');
const isSubPath = require('./isSubPath');

const name = 'translation-static-analyzer';

/**
 * @private
 */
function print(message, ...leftover) {
    console.log(`${name}: ${message}`, ...leftover);
}


/**
 * @private
 */
function cleanup() {
    const localeGen = this.localeGen;

    fs.removeSync(localeGen.directory);
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
function calculateFiles(requestFiles) {
    const options = this.options;
    const {files, target} = options;
    const all = glob.sync(files).map((a) => path.resolve(a));
    const hasModifiedFiles = Boolean(requestFiles.length);
    const allAsSet = new Set(all);
    const modified = hasModifiedFiles ? requestFiles.filter((f) => allAsSet.has(f)) : all;
    const removed = requestFiles.filter((f) => !allAsSet.has(f));
    const targetDirectories = glob.sync(target).filter((t) => fs.statSync(t).isDirectory());
    const filesByTargetDirectory = calculateTargetFiles(targetDirectories, all);

    return {
        all,
        modified: new Set([...this.files.modified, ...modified]),
        removed: new Set([...this.files.removed, ...removed]),
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
    const templateDirectory = path.resolve(this.templateDirectory, '..');

    return keys.reduce((serialized, k, i) => {
        const hasMore = i < length - 1;
        const indent = '    ';
        const note = localizationWithMetadata[k].note;
        const formattedNote = note ? `${indent}// ${note.toUpperCase()}\n` : '';
        const files = localizationWithMetadata[k].files.map((f) => {
            return path.relative(templateDirectory, f)
        });
        const formattedFiles = files.length ? `${indent}// ` + files.join(`\n${indent}// `) + '\n' : '';

        return `${serialized}${formattedNote}${formattedFiles}${indent}"${k}": ${JSON.stringify(localizationWithMetadata[k].data)}${hasMore ? ',' : ''}\n`;
    }, '{\n') + '}';
}

/**
 * @private
 */
function readJSON5FileWithFallback(filename, fallback = null) {
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

/**
 * @private
 */
function readLocalization(locale) {
    const directory = this.templateDirectory;
    const filename = `${directory}/${locale}.json`;

    return readJSON5FileWithFallback.call(this, filename);
}

/**
 * @private
 */
function writeLocalizationWithMetadata(locale, localization) {
    const directory = this.templateDirectory;
    const filename = `${directory}/${locale}.json`;
    const serialized = serializeLocalizationWithMetaData.call(this, localization);
    const options = this.options;

    if (options.debug) {
        print('Writing localization for', filename, localization);
    }

    fs.writeFileSync(filename, serialized);
}

/**
 * @private
 */
function updateLocalization(localization) {
    const template = scrubLocalization(this.instance.cache.template);
    const filenamesByKey = this.filenamesByKey;
    const keys = [
        ...new Set(Object.keys(localization).concat(Object.keys(template)))
    ].sort();
    const fallbackFiles = new Set();

    return keys.reduce((accumulator, k) => {
        const files = [...(filenamesByKey.get(k) || fallbackFiles)].sort();
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
        } else if (templateHasProperty && localizationHasTranslation) {
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

/**
 * @private
 */
function generateLocaleFiles() {
    const files = this.files;
    const options = this.options;
    const locales = options.locales;
    const localizationByLanguage = this.localizationByLanguage = new Map();
    let changed = false;

    fs.ensureDirSync(this.templateDirectory);

    locales.forEach((l) => {
        const localization = readLocalization.call(this, l) || {};
        const nextLocalizationWithMetadata = updateLocalization.call(this, localization);
        const pairs = Object.entries(nextLocalizationWithMetadata);
        const nextLocalization = pairs.reduce((accumulator, [k, v]) => {
            return Object.assign({}, accumulator, {[k]: v.data});
        }, {});

        localizationByLanguage.set(l, nextLocalization);

        if (!equal(localization, nextLocalization) || files.removed.size) {
            writeLocalizationWithMetadata.call(this, l, nextLocalizationWithMetadata);
            changed = true;
        }
    });

    return changed;
}

/**
 * @private
 */
function clear() {
    try {
        fs.unlinkSync(this.template.name);
    } catch (e) {
        // No content
    }

    this.instance.cache.template = {};
}

function rebuildCache() {
    const filenamesByKey = this.filenamesByKey = new Map();
    const options = this.options;
    const sourceByFilename = this.sourceByFilename;

    clear.call(this);

    this.files.all.forEach((m) => {
        const contents = sourceByFilename.get(m);

        if (contents && typeof contents === 'string') {
            const metadata = readString(contents);
            const keysByFilename = this.keysByFilename;
            const keys = Object.keys(metadata);
            const {__, __n} = this.instance;

            Object.values(metadata).forEach((v) => {
                try {
                    safeEval(v.fn, {__, __n});
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

            keysByFilename.set(m, new Set(keys));
        }
    });

    if (options.debug) {
        print('Parsed keys', JSON.stringify(Array.from(filenamesByKey.keys()), null, 4));
    }
}

/**
 * @private
 */
function loadSourceFiles() {
    const {modified, removed} = this.files;
    const sourceByFilename = this.sourceByFilename;
    const keysByFilename = this.keysByFilename;

    modified.forEach((m) => {
        try {
            const contents = String(fs.readFileSync(m));
            sourceByFilename.set(m, contents);
        } catch (e) {
            sourceByFilename.delete(m);
            keysByFilename.delete(m);
            removed.add(m);
        }
    });
}

/**
 * @private
 */
function writeToTargets() {
    const options = this.options;
    const locales = options.locales;
    const filesByTargetDirectory = this.files.target.filesByTargetDirectory;
    const targetDirectories = Object.keys(filesByTargetDirectory);
    const localizationByLanguage = this.localizationByLanguage;
    const keysByFilename = this.keysByFilename;

    targetDirectories.forEach((t) => {
        // This is intentionally a hidden directory. It should generally not be included
        // with git.
        const directory = path.resolve(t, '.locales');

        fs.ensureDirSync(directory)

        locales.forEach((l) => {
            const filenames = filesByTargetDirectory[t];
            const localization = localizationByLanguage.get(l);
            const subLocalization = {};
            const filename = path.resolve(directory, `${l}.json`);

            if (options.debug) {
                print('Writing final target to ', filename);
            }

            filenames.forEach((f) => {
                const keys = keysByFilename.get(f) || [];

                keys.forEach((k) => {
                    if (localization.hasOwnProperty(k) && hasTranslation(localization[k])) {
                        subLocalization[k] = localization[k]
                    }
                });
            });

            const previousSubLocalization = readJSON5FileWithFallback.call(this, filename);

            if (!equal(subLocalization, previousSubLocalization)) {
                fs.writeFileSync(filename, JSON.stringify(subLocalization, null, 4));
            }
        });
    });
}

/**
 * Class description.
 */
class TranslationStaticAnalyzer {
    /**
     * @param {Object} options - The modifiers for how the analyzer is run
     * @param {String} options.files - A glob of the files to pull translations from
     * @param {Boolean} [options.debug = false] - Show debugging information in the console
     * @param {Array<String>} [options.locales = []] - The locales to generate (eg fr, ja_JP, en)
     * @param {String} [options.templates = 'locales'] - The location to store
     * the translator translatable templates for each language
     * @param {String} [options.target] - Where to write the final translations, which can be split between
     * multiple directories for modularity.
     */
    constructor(options) {
        const localeGen = this.localeGen = {
            directory: fs.mkdtempSync(path.resolve(os.tmpdir(), 'locale-gen-'), {}),
            name: 'template',
        };

        this.options = options || {};
        this.sourceByFilename = new Map();
        this.keysByFilename = new Map();
        this.filenamesByKey = new Map();
        this.localizationByLanguage = new Map();
        this.files = {
            modified: new Set(),
            removed: new Set(),
        };

        if (this.options.debug) {
            print('Creating locale gen directory', localeGen.directory);
        }

        process.on('exit', cleanup.bind(this));
        process.on('SIGINT', cleanup.bind(this));

        this.instance = y18n({
            updateFiles: true, //If it doesn't write the file, it also don't update the cache
            directory: localeGen.directory,
            locale: localeGen.name,
        });

        this.files = calculateFiles.call(this, []);
        this.files.modified = new Set();
        this.files.removed = new Set();
    }

    /**
     * Read changes from the source files and update the language templates.
     * @param {Array<String>} [requestFiles = []] - The files or none to
     * update everything in the options.files glob pattern.
     * @return {Boolean} True if some some of the modified files matches the
     * file option passed on initialization
     */
    read(requestFiles = []) {
        const options = this.options;
        const locales = options.locales || [];
        const files = this.files = calculateFiles.call(
            this,
            requestFiles.map((m) => path.resolve(m))
        )

        if (!locales.length) {
            console.warn(
                "This library isn't particularly useful " +
                "if you don't request any locales to be generated."
            );
            return;
        }

        if (options.debug) {
            print('Updating localization keys for', JSON.stringify(files.modified, null, 4));
        }

        if (files.removed.size) {
            files.removed.forEach((f) => {
                this.sourceByFilename.delete(f);
                this.keysByFilename.delete(f);
            });
        }

        if (files.modified.size) {
            loadSourceFiles.call(this);
        }

        rebuildCache.call(this);

        return Boolean(files.modified.size || files.removed.size);
    }

    /**
     * Write to the targets. Use to force an update of the targets if a
     * language file template in the templateDirectory is updated without
     * updating a source file.
     */
    write() {
        if (generateLocaleFiles.call(this)) {
            writeToTargets.call(this);
        }

        this.files.modified = new Set();
        this.files.removed = new Set();
    }

    /**
     * Updates the translations to match the source files.
     * @param {Array<String>} [requestFiles = []] - The files or none to
     * update everything in the options.files glob pattern.
     */
    update(requestFiles = []) {
        const options = this.options;

        if (this.read(requestFiles)) {
            this.write();
        }

        if (options.debug) {
            print('DONE');
        }
    }

    /**
     * @return {String} The path to the directory which holds
     * the translation templates that are dynamically updated
     * by code changes and should be used by translators
     * to add the localizations.
     */
    get templateDirectory() {
        const options = this.options;

        if (options.templates) {
            return path.resolve(options.templates, 'locales');
        }

        return './locales';
    }
}


/**
 * A library for scanning javscript files to build translation mappings in json automatically.
 *
 * <p>
 * <a href="https://travis-ci.org/zakkudo/translation-static-analyzer">
 *     <img src="https://travis-ci.org/zakkudo/translation-static-analyzer.svg?branch=master"
 *          alt="Build Status" /></a>
 * <a href="https://coveralls.io/github/zakkudo/translation-static-analyzer?branch=master">
 *     <img src="https://coveralls.io/repos/github/zakkudo/translation-static-analyzer/badge.svg?branch=master"
 *          alt="Coverage Status" /></a>
 * <a href="https://snyk.io/test/github/zakkudo/translation-static-analyzer">
 *     <img src="https://snyk.io/test/github/zakkudo/translation-static-analyzer/badge.svg"
 *          alt="Known Vulnerabilities"
 *          data-canonical-src="https://snyk.io/test/github/zakkudo/translation-static-analyzer"
 *          style="max-width:100%;" /></a>
 * </p>
 *
 * Why use this?
 *
 * - You no longer have to manage hierarchies of translations
 * - Templates are automatically generated for the translators
 * - The translations are noted if they are new, unused and what files
 * - It allows splitting the translations easily for dynamic imports to allow sliced loading
 * - Any string wrapped in `__()` or `__n()`, will be picked up as a
 *   translatable making usage extremely easy for developers
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
module.exports = TranslationStaticAnalyzer;
