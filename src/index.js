/**
 * @module @zakkudo/translation-static-analyzer
 */

const fs = require('fs-extra');
const glob = require('glob');
const path = require('path');
const console = require('console');
const parseHeader = require('./parseHeader');
const hasTranslation = require('./hasTranslation');
const readString = require('./readString');
const isSubPath = require('./isSubPath');
const TemplateDirectory = require('./TemplateDirectory');
const TargetDirectory = require('./TargetDirectory');
const Status = require('./Status');
const toKey = require('./toKey');
const name = 'translation-static-analyzer';

const HEADER_KEY = 'default::';



/**
 * Combines context and key strings from two levels of objects
 * into one with the key/context concatenated togetherLocale.
 * Converts from:
 * [{key, value, context}]
 * to
 * {key:context: value}
 * @private
 */
function toInternalFormat(localization) {
  return localization.reduce((accumulator, l) => {
    return Object.assign({}, accumulator, {
      [toKey(l.context || 'default', l.key || '', l.plural || '')]: l
    });
  }, {});
}

const statusOrder = {
  [Status.NEW]: 1,
  [Status.EXISTING]: 2,
  [Status.UNUSED]:  3,
};

/**
 * Converts from:
 * {key:context: value}
 * to
 * [{key, value, context}]
 * @private
 */
function toExternalFormat(localization) {
  return Object.values(localization).sort((a, b) => {
    // Move the translation heaader to the top
    if (!a.key && b.key) {
      return -1;
    } else if (a.key && !b.key) {
      return 1;
    }

    if (a.status !== b.status) {
      return (statusOrder[a.status]) - (statusOrder[b.status]);
    }

    if (a.key !== b.key) {
      return a.key.localeCompare(b.key);
    }

    return a.context.localeCompare(b.context);
  });
}

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
function calculateFiles(requestFiles) {
  const options = this.options;
  const {files, target} = options;
  const all = files && glob.sync(files).map((a) => path.resolve(a)) || [];
  const hasModifiedFiles = Boolean(requestFiles.length);
  const allAsSet = new Set(all);
  const modified = hasModifiedFiles ? requestFiles.filter((f) => allAsSet.has(f)) : all;
  const removed = requestFiles.filter((f) => !allAsSet.has(f));
  const targetDirectories = target && glob.sync(target).filter((t) => fs.statSync(t).isDirectory()) || [];
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

function generateTemplate(translation, nplural) {
  const template = {}

  if (translation.plural === undefined) {
    return '';
  }

  for (let i = 0; i < nplural; i += 1) {
    template[String(i)] = '';
  }

  return template;
}

function parseHeaderFromLocalization(localization) {
  const header = (localization[HEADER_KEY] || {}).value || '';

  return parseHeader(header);
}

/**
 * @private
 */
function updateTemplate(localization) {
  const template = this.referenceTemplate;
  const usagesByKey = this.usagesByKey;
  const keys = [
    ...new Set(Object.keys(localization).concat(Object.keys(template)))
  ].sort();
  const fallbackFiles = new Set();
  const header = parseHeaderFromLocalization(localization);
  const nplurals = header.get('Plural-Forms').nplurals;

  return keys.reduce((accumulator, k) => {
    const references = [...(usagesByKey.get(k) || fallbackFiles)].sort();

    const localizationHasTranslation = hasTranslation((localization[k] || {}).value);
    const templateHasProperty = template.hasOwnProperty(k);
    const templateTranslation = template[k] || {};

    if (!templateHasProperty && localizationHasTranslation) {
      return Object.assign({}, accumulator, {
        [k]: Object.assign({}, localization[k], {
          status: k === HEADER_KEY ? Status.EXISTING : Status.UNUSED,
          comments: templateTranslation.comments,
          references,
        })
      });
    } else if (templateHasProperty && !localizationHasTranslation) {
      return Object.assign({}, accumulator, {
        [k]: Object.assign({}, templateTranslation, {
          status: Status.NEW,
          value: generateTemplate(templateTranslation, nplurals),
          references,
        })
      });
    } else if (templateHasProperty && localizationHasTranslation) {
      return Object.assign({}, accumulator, {
        [k]: Object.assign({}, localization[k], {
          status: Status.EXISTING,
          comments: templateTranslation.comments,
          references,
        })
      });
    }

    return accumulator;
  }, {});
}

/**
 * @private
 */
function generateTemplates() {
  const options = this.options;
  const {locales, format} = options;
  const templates = new TemplateDirectory(this.templateDirectory, format, this.cache);
  const localizationWithMetadataByLanguage = this.localizationWithMetadataByLanguage = new Map();
  const localizationByLanguage = this.localizationByLanguage = new Map();
  let changed = false;

  templates.ensureDirectory();

  locales.forEach((l) => {
    const localization = toInternalFormat(templates.readLocalization(l));
    const nextLocalization = updateTemplate.call(this, localization);

    localizationByLanguage.set(l, nextLocalization);
    localizationWithMetadataByLanguage.set(l, nextLocalization);

    changed = templates.writeLocalization(l, toExternalFormat(nextLocalization)) || changed;
  });

  return changed;
}

/**
 * @private
 */
function rebuildCache() {
  const usagesByKey = this.usagesByKey = new Map();
  const keysByFilename = this.keysByFilename = new Map();
  const referenceTemplate = this.referenceTemplate = {};
  const options = this.options;
  const sourceByFilename = this.sourceByFilename;

  this.files.all.forEach((m) => {
    const contents = sourceByFilename.get(m);
    const addedKeysWithContext = new Set();

    if (contents && typeof contents === 'string') {
      const metadata = readString(contents);

      metadata.forEach((t) => {
        try {
          const {
            key,
            plural,
            comments,
            context = 'default',
            lineNumber,
          } = t;
          const uniqueKey = toKey(context || 'default', key || '', plural || '');

          referenceTemplate[uniqueKey] = JSON.parse(JSON.stringify({
            key,
            plural,
            comments,
            context
          }));

          addedKeysWithContext.add(uniqueKey);

          if (!usagesByKey.has(uniqueKey)) {
            usagesByKey.set(uniqueKey, new Set());
          }

          usagesByKey.get(uniqueKey).add({
            filename: m,
            lineNumber,
          });
        } catch(e) {
          console.warn(e);
        }
      });
    }

    keysByFilename.set(m, addedKeysWithContext);
  });

  if (options.debug) {
    print('Parsed keys', JSON.stringify(Array.from(usagesByKey.keys()), null, 4));
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
function buildLocalizationForFilenames(l, filenames) {
  const localizationByLanguage = this.localizationByLanguage;
  const localization = localizationByLanguage.get(l);
  const subLocalization = {};
  const keysByFilename = this.keysByFilename;

  filenames.forEach((f) => {
    const keys = keysByFilename.get(f);

    keys.forEach((k) => {
      if (localization.hasOwnProperty(k) && hasTranslation(localization[k].value)) {
        subLocalization[k] = localization[k]
      }
    });
  });

  if (localization[HEADER_KEY]) {
    const header = parseHeader(localization[HEADER_KEY].value);
    subLocalization[HEADER_KEY] = {
      key: '',
      value: {
        'Plural-Forms': header.get('Plural-Forms'),
      }
    };
  }

  return toExternalFormat(subLocalization);
}

/**
 * @private
 */
function writeToTargets() {
  const options = this.options;
  const locales = options.locales;
  const filesByTargetDirectory = this.files.target.filesByTargetDirectory;
  const targetDirectories = Object.keys(filesByTargetDirectory);
  const localizations = {};

  targetDirectories.forEach((t) => {
    const target = new TargetDirectory(path.resolve(t, '.locales'), this.cache);

    target.ensureDirectory();

    locales.forEach((l) => {
      const filenames = filesByTargetDirectory[t];
      const localization = localizations[l] = buildLocalizationForFilenames.call(this, l, filenames);

      target.writeLocalization(l, localization);
    });

    target.writeIndex(localizations);
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
   * @param {String} [options.format = 'po'] - The format for the tempalte files.  One of [po, json, json5]
   * @param {Array<String>} [options.locales = []] - The locales to generate (eg fr, ja_JP, en)
   * @param {String} [options.templates] - The location to store
   * the translator translatable templates for each language. Defaults to
   * making a `locales` directory in the current working directory
   * @param {String} [options.target] - Where to write the final translations, which can be split between
   * multiple directories for modularity. If there are no targets, no `.locales` directory will be generated anywhere.
   */
  constructor(options) {
    this.cache = {};
    this.options = options || {};
    this.sourceByFilename = new Map();
    this.keysByFilename = new Map();
    this.usagesByKey = new Map();
    this.localizationByLanguage = new Map();
    this.firstRun = true;
    this.localizationWithMetadataByLanguage = new Map();
    this.files = {
      modified: new Set(),
      removed: new Set(),
    };
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
    const referenceTemplate = this.referenceTemplate;
    if (referenceTemplate && generateTemplates.call(this)) {
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
