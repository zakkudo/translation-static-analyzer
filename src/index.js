/**
 * @module @zakkudo/translation-static-analyzer
 */

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
    const options = this.options;
    const locales = options.locales;
    const previousLocalizationWithMetadataByLanguage = this.localizationWithMetadataByLanguage;
    const localizationWithMetadataByLanguage = this.localizationWithMetadataByLanguage = new Map();
    const localizationByLanguage = this.localizationByLanguage = new Map();
    let changed = false;

    fs.ensureDirSync(this.templateDirectory);

    locales.forEach((l) => {
        const localizationWithMetadata = previousLocalizationWithMetadataByLanguage.get(l);
        const localization = readLocalization.call(this, l) || {};
        const nextLocalizationWithMetadata = updateLocalization.call(this, localization);
        const pairs = Object.entries(nextLocalizationWithMetadata);
        const nextLocalization = pairs.reduce((accumulator, [k, v]) => {
            return Object.assign({}, accumulator, {[k]: v.data});
        }, {});

        localizationByLanguage.set(l, nextLocalization);
        localizationWithMetadataByLanguage.set(l, nextLocalizationWithMetadata);

        const sourceCodeChangeUpdatedLocalization = !equal(localizationWithMetadata, nextLocalizationWithMetadata);
        const translationChangeUpdatedLocalization = !equal(localization, nextLocalization);

        if (sourceCodeChangeUpdatedLocalization || translationChangeUpdatedLocalization) {
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

/**
 * @private
 */
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
function writeIndexTarget(targetDirectory, subLocalization) {
    const directory = path.resolve(targetDirectory, '.locales');
    const filename = path.resolve(directory, `index.json`);
    const previousSubLocalization = readJSON5FileWithFallback.call(this, filename);

    if (!equal(subLocalization, previousSubLocalization)) {
        fs.writeFileSync(filename, JSON.stringify(subLocalization, null, 4));
    }
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
    const aggregate = {};

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

            aggregate[l] = subLocalization;

            if (!equal(subLocalization, previousSubLocalization)) {
                fs.writeFileSync(filename, JSON.stringify(subLocalization, null, 4));
            }
        });

        writeIndexTarget(t, aggregate);
    });
}

/**
 * Class for analyzing javascript source files, extracting the translations, and converting them into
 * localization templates.
 */
class TranslationStaticAnalyzer {
    /**
     * @param {Object} options - The modifiers for how the analyzer is run
     * @param {String} options.files - A
     * [glob pattern]{@link https://www.npmjs.com/package/glob} of the files to pull translations from
     * @param {Boolean} [options.debug = false] - Show debugging information in the console
     * @param {Array<String>} [options.locales = []] - The locales to generate (eg fr, ja_JP, en)
     * @param {String} [options.templates] - The location to store
     * the translator translatable templates for each language. Defaults to
     * making a `locales` directory in the current working directory
     * @param {String} [options.target] - Where to write the final translations, which can be split between
     * multiple directories for modularity. If there are no targets, no `.locales` directory will be generated anywhere.
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
        this.localizationWithMetadataByLanguage = new Map();
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
     * Read changes from the source files and update the database stored in the current
     * analyzer instance. No changes will be written to the templates and all reads are
     * accumulative for the next write. Use the `requestFiles` option if you want to hook
     * this method up to a file watcher which can supply a list of files that have changed.
     * @param {Array<String>} [requestFiles = []] - A subset of files from the
     * `options.files` glob to read or non to reread all files. Any files that are supplied to this
     * method that are not part of the `options.files` glob are simply ignored.
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
            print('Updating localization keys for', files.modified);
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
     * Write the current database to the templates and targets. This method is
     * useful to force an update of the targets if a
     * language file template in `templateDirectory` is updated without
     * updating a source file.
     */
    write() {
        const cache = this.instance.cache || {};
        const template = cache.template;

        if (template && generateLocaleFiles.call(this)) {
            writeToTargets.call(this);
        }

        this.files.modified = new Set();
        this.files.removed = new Set();
    }

    /**
     * Updates the translations to match the source files, using logic to try to reduce disk writes
     * if no source files changed.  This method was designed to be hooked up to a file watcher for the source
     * code. *There will be no changes if this method is called after there is a manual change to the translation
     * templates.  It only cares about source files.*
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

module.exports = TranslationStaticAnalyzer;
