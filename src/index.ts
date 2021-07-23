/**
 * @module @zakkudo/translation-static-analyzer
 */

import fs from "fs";
import console from "console";
import glob from "glob";
import vm from "vm";
import escape from "./escape";
import readString from "./readString";
import hasTranslation from "./hasTranslation";
import isSubPath from "./isSubPath";
import parseHeaders from "./parseHeaders";

/*
import equal from "deep-equal";
import path from "path";
*/

//const name = "translation-static-analyzer";

const DEFAULT_CONTEXT = "";

/**
 * @internal
 */
function gettext(key: string) {
  return {
    key: [DEFAULT_CONTEXT, key].map(escape).join(":"),
    plural: false,
  };
}

/**
 * @internal
 */
function pgettext(context: string, key: string) {
  return {
    key: [context, key].map(escape).join(":"),
    plural: false,
  };
}

/**
 * @internal
 */
function ngettext(singular: string, plural: string) {
  return {
    key: [DEFAULT_CONTEXT, singular, plural].map(escape).join(":"),
    plural: true,
  };
}

/**
 * @internal
 */
function npgettext(context: string, singular: string, plural: string) {
  return {
    key: [context, singular, plural].map(escape).join(":"),
    plural: true,
  };
}
//
// /**
//  * @internal
//  */
// function print(message, ...leftover) {
//   console.log(`${name}: ${message}`, ...leftover);
// }
//
// /**
//  * @internal
//  */
// function calculateTargetFiles(targetDirectories, all) {
//   const target = all.reduce((accumulator, a) => {
//     let unused = true;
//
//     targetDirectories.forEach((t) => {
//       if (isSubPath(t, a)) {
//         if (!accumulator[t]) {
//           accumulator[t] = new Set([a]);
//         } else {
//           accumulator[t].add(a);
//         }
//
//         unused = false;
//       }
//     });
//
//     if (unused) {
//       targetDirectories.forEach((t) => {
//         if (!accumulator[t]) {
//           accumulator[t] = new Set([a]);
//         } else {
//           accumulator[t].add(a);
//         }
//       });
//     }
//
//     return accumulator;
//   }, {});
//
//   return Object.keys(target).reduce((accumulator, k) => {
//     return Object.assign({}, accumulator, {
//       [k]: [...target[k]].sort(),
//     });
//   }, {});
// }
//
//
// /**
//  * @internal
//  */
// function serializeLocalizationWithMetaData(localizationWithMetadata) {
//   const templateDirectory = path.resolve(this.templateDirectory, "..");
//   const translations = Object.values(localizationWithMetadata)
//     .map((t) => {
//       const usages = t.usages
//         .map((u) => {
//           return `${path.relative(templateDirectory, u.filename)}:${
//             u.lineNumber
//           }`;
//         })
//         .sort();
//
//       return Object.assign({}, t, { usages });
//     })
//     .sort((a, b) => {
//       return a.key.localeCompare(b.key) || a.context.localeCompare(b.context);
//     });
//   const indent = "    ";
//   const lines = ["{"];
//   let previousKey = translations[0].key;
//
//   /*
//    * EXAMPLE
//    * {
//    *     "English": {
//    *         // filename:number
//    *         "default": "French"
//    *     }
//    * }
//    *
//    */
//   return translations
//     .reduce((lines, t, i) => {
//       const { key, context, data, usages, note } = t;
//       const newLines = [];
//
//       if (i === 0) {
//         newLines.push(`${indent}"${key}": {`);
//       }
//
//       if (previousKey !== key) {
//         newLines.push(`${indent}},`);
//         newLines.push(`${indent}"${key}": {`);
//       } else if (i > 0) {
//         const length = lines.length;
//         const last = length - 1;
//
//         lines[last] = lines[last] + ",";
//       }
//
//       if (note) {
//         newLines.push(`${indent}${indent}// ${note.toUpperCase()}`);
//       }
//
//       usages.forEach((u) => {
//         newLines.push(`${indent}${indent}// ${u}`);
//       });
//
//       newLines.push(`${indent}${indent}"${context}": ${JSON.stringify(data)}`);
//
//       previousKey = key;
//
//       return lines.concat(newLines);
//     }, lines)
//     .concat([`${indent}}`, "}"])
//     .join("\n");
// }
//
// /**
//  * @internal
//  */
// function readJSON5FileWithFallback(filename, fallback = {}) {
//   let data = fallback;
//
//   try {
//     data = JSON5.parse(fs.readFileSync(filename));
//   } catch (e) {
//     if (e.code !== "ENOENT") {
//       throw e;
//     }
//   }
//
//   return data;
// }
//
// /**
//  * Combines context and key strings from two levels of objects
//  * into one with the key/context concatenated together.
//  * @internal
//  */
// function flattenLocalization(localization) {
//   return Object.entries(localization).reduce((accumulator, [k, v]) => {
//     if (Object(v) === v) {
//       const translations = {};
//
//       Object.entries(v).forEach(([context, translation]) => {
//         translations[toKeyWithContext(k, context)] = translation;
//       });
//
//       return Object.assign(accumulator, translations);
//     }
//
//     return accumulator;
//   }, {});
// }
//
// /**
//  * @internal
//  */
// function unflattenLocalization(localization) {
//   return Object.entries(localization).reduce(
//     (accumulator, [keyWithContext, translation]) => {
//       const [key, context] = fromKeyWithContext(keyWithContext);
//       const contexts = accumulator[key] || {};
//
//       return Object.assign({}, accumulator, {
//         [key]: Object.assign({}, contexts, { [context]: translation }),
//       });
//     },
//     {}
//   );
// }
//
// /**
//  * Compresses the translation for use by code, removing any extra context information
//  * when not needed. (If there is only a default context, the context object is removed
//  * and the translation is linked directly to the key for example.)
//  * @internal
//  */
// function collapseLocalization(localization) {
//   return Object.entries(localization).reduce((accumulator, [key, contexts]) => {
//     const keys = new Set(Object.keys(contexts));
//
//     if (keys.size === 1 && keys.has("default")) {
//       return Object.assign({}, accumulator, { [key]: contexts.default });
//     }
//
//     return Object.assign({}, accumulator, { [key]: contexts });
//   }, {});
// }
//
// /**
//  * @internal
//  */
// function readLocalization(locale) {
//   const directory = this.templateDirectory;
//   const filename = `${directory}/${locale}.json`;
//   const data = readJSON5FileWithFallback.call(this, filename);
//
//   return flattenLocalization(data);
// }
//
// /**
//  * @internal
//  */
// function writeLocalizationWithMetadata(locale, localization) {
//   const directory = this.templateDirectory;
//   const filename = `${directory}/${locale}.json`;
//   const serialized = serializeLocalizationWithMetaData.call(this, localization);
//   const options = this.options;
//
//   if (options.debug) {
//     print("Writing localization for", filename, localization);
//   }
//
//   fs.writeFileSync(filename, serialized);
// }
//
// /**
//  * @internal
//  */
// function updateLocalization(localization) {
//   const template = this.referenceTemplate;
//   const usagesByKey = this.usagesByKey;
//   const keys = [
//     ...new Set(Object.keys(localization).concat(Object.keys(template))),
//   ].sort();
//   const fallbackFiles = new Set();
//
//   return keys.reduce((accumulator, k) => {
//     const usages = [...(usagesByKey.get(k) || fallbackFiles)].sort();
//
//     const localizationHasTranslation = hasTranslation(localization[k]);
//     const templateHasProperty = template.hasOwnProperty(k);
//     const [key, context] = fromKeyWithContext(k);
//
//     if (!templateHasProperty && localizationHasTranslation) {
//       return Object.assign({}, accumulator, {
//         [k]: {
//           note: "unused",
//           usages,
//           key,
//           context,
//           data: localization[k],
//         },
//       });
//     } else if (templateHasProperty && !localizationHasTranslation) {
//       return Object.assign({}, accumulator, {
//         [k]: {
//           note: "new",
//           usages,
//           key,
//           context,
//           data: template[k],
//         },
//       });
//     } else if (templateHasProperty && localizationHasTranslation) {
//       return Object.assign({}, accumulator, {
//         [k]: {
//           usages,
//           key,
//           context,
//           data: localization[k],
//         },
//       });
//     }
//
//     return accumulator;
//   }, {});
// }
//
// /**
//  * @internal
//  */
// function stripMetadata(localizationWithMetadata) {
//   const pairs = Object.entries(localizationWithMetadata);
//
//   return pairs.reduce((accumulator, [keyWithContext, m]) => {
//     return Object.assign(accumulator, {
//       [keyWithContext]: m.data,
//     });
//   }, {});
// }
//
// /**
//  * @internal
//  */
// function writeLocaleFiles() {
//   const options = this.options;
//   const locales = options.locales;
//   const previousLocalizationWithMetadataByLanguage = this
//     .localizationWithMetadataByLanguage;
//   const localizationWithMetadataByLanguage = (this.localizationWithMetadataByLanguage = new Map());
//   const localizationByLanguage = (this.localizationByLanguage = new Map());
//   let changed = false;
//
//   fs.ensureDirSync(this.templateDirectory);
//
//   locales.forEach((l) => {
//     const localizationWithMetadata = previousLocalizationWithMetadataByLanguage.get(
//       l
//     );
//     const localization = readLocalization.call(this, l);
//     const nextLocalizationWithMetadata = updateLocalization.call(
//       this,
//       localization
//     );
//     const nextLocalization = stripMetadata(nextLocalizationWithMetadata);
//     const sourceCodeChangeUpdatedLocalization = !equal(
//       localizationWithMetadata,
//       nextLocalizationWithMetadata
//     );
//     const translationChangeUpdatedLocalization = !equal(
//       localization,
//       nextLocalization
//     );
//
//     localizationByLanguage.set(l, nextLocalization);
//     localizationWithMetadataByLanguage.set(l, nextLocalizationWithMetadata);
//
//     if (
//       sourceCodeChangeUpdatedLocalization ||
//       translationChangeUpdatedLocalization ||
//       this.firstRun
//     ) {
//       writeLocalizationWithMetadata.call(this, l, nextLocalizationWithMetadata);
//       changed = true;
//     }
//   });
//
//   this.firstRun = false;
//
//   return changed;
// }
//
// /**
//  * @internal
//  */
//
//
// /**
//  * @internal
//  */
// function writeIndexTarget(targetDirectory, subLocalization) {
//   const directory = path.resolve(targetDirectory, ".locales");
//   const filename = path.resolve(directory, `index.json`);
//
//   fs.writeFileSync(filename, JSON.stringify(subLocalization, null, 4));
// }
//
// /**
//  * @internal
//  */
// function buildTargetLocalization(localization, filenames) {
//   const subLocalization = {};
//   const keysByFilename = this.keysByFilename;
//
//   filenames.forEach((f) => {
//     const keys = keysByFilename.get(f);
//
//     keys.forEach((k) => {
//       if (localization.hasOwnProperty(k) && hasTranslation(localization[k])) {
//         subLocalization[k] = localization[k];
//       }
//     });
//   });
//
//   return collapseLocalization(unflattenLocalization(subLocalization));
// }
//
// /**
//  * @internal
//  */
// function writeToTargets() {
//   const options = this.options;
//   const locales = options.locales;
//   const filesByTargetDirectory = this.files.target.filesByTargetDirectory;
//   const targetDirectories = Object.keys(filesByTargetDirectory);
//   const localizationByLanguage = this.localizationByLanguage;
//   const aggregate = {};
//   let localizationChanged = false;
//
//   targetDirectories.forEach((t) => {
//     // This is intentionally a hidden directory. It should generally not be included
//     // with git.
//     const directory = path.resolve(t, ".locales");
//
//     fs.ensureDirSync(directory);
//
//     locales.forEach((l) => {
//       const filenames = filesByTargetDirectory[t];
//       const localization = localizationByLanguage.get(l);
//       const subLocalization = buildTargetLocalization.call(
//         this,
//         localization,
//         filenames
//       );
//       const filename = path.resolve(directory, `${l}.json`);
//       const previousSubLocalization = readJSON5FileWithFallback.call(
//         this,
//         filename,
//         null
//       );
//
//       aggregate[l] = subLocalization;
//
//       if (!equal(subLocalization, previousSubLocalization)) {
//         if (options.debug) {
//           print("Writing final target to ", filename);
//         }
//         localizationChanged = true;
//         fs.writeFileSync(filename, JSON.stringify(subLocalization, null, 4));
//       }
//     });
//
//     if (localizationChanged) {
//       writeIndexTarget(t, aggregate);
//     }
//   });
// }
//

type FileDelta = {
  all: Set<string>;
  modified: Set<string>;
  removed: Set<string>;
};

function calculateFiles(include: string[], exclude?: string[]): Set<string> {
  let files: string[] = [];

  for (const pattern of include) {
    files = {
      ...files,
      ...glob.sync(pattern, { ignore: exclude }).map(path.resolve),
    };
  }

  files.sort();

  return new Set(files);
}

type Options = {
  include: string[];
  exclude?: string[];
  debug?: boolean;
  locales: string;
  /*
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
};

type Localization = {
  [key: string]: {
    [context: string]: Array<string>;
  };
};

type FunctionMapping = {
  gettext: string;
  ngettext: string;
  npgettext: string;
  pgettext: string;
};

const DEFAULT_FUNCTION_MAPPING = Object.freeze({
  gettext: "gettext",
  ngettext: "ngettext",
  npgettext: "npgettext",
  pgettext: "pgettext",
});

const DEFAULT_IMPORT_PATTERNS = [
  /import([^)]+)/,
  /import.*from.*[^;]+;/,
  /require([^)]+)/,
];

/**
 * Class for analyzing javascript source files, extracting the translations, and converting them into
 * localization templates.
 */
class TranslationStaticAnalyzer {
  options: Options;
  private keysByFilename: Map<string, string[]> = new Map();
  private sourceByFilename: Map<string, string> = new Map();
  private usagesByKey: Map<string, string[]> = new Map();
  private localizationByLocale: Map<string, Localization> = new Map();
  private referenceTemplate: Localization = {};
  private functions: FunctionMapping;

  constructor({
    debug = false,
    locales,
    include,
    exclude,
    gettextFunctionNames = DEFAULT_FUNCTION_MAPPING,
  }: Options) {
    this.options = {
      debug,
      locales,
      include,
      exclude,
      gettextFunctionNames,
      importPatterns = DEFAULT_IMPORT_PATTERNS,
    };
  }

  /**
   * Creates a localization file that only includes the localizations that are used
   * based off of the dependencies.
   */
  generate(dependencies) {
    //writeToTarget logic
    const headers = parseHeaders();
  }

  private calculateFileDelta(filter?: string[]): FileDelta {
    const { include, exclude } = this.options;
    const all = calculateFiles(include, exclude);
    let modified = all;
    let removed = new Set([]);

    if (filter) {
      const normalizedFilter = filter.map((f) => path.resolve(f)).sort();

      modified = new Set(normalizedFilter.filter((f) => all.has(f)));
      removed = new Set(normalizedFilter.filter((f) => !all.has(f)));
    }

    return {
      all,
      modified,
      removed,
    };
  }

  private rebuildCache(delta: FileDelta) {
    const originalReferenceTemplate = this.referenceTemplate;
    const usagesByKey = (this.usagesByKey = new Map());
    const keysByFilename = (this.keysByFilename = new Map());
    const referenceTemplate = (this.referenceTemplate = {});
    const { sourceByFilename, gettextFunctionNames } = this;
    const { all, removed, modified } = delta;
    const context = vm.createContext({
      [gettextFunctionNames.gettext]: gettext,
      [gettextFunctionNames.ngettext]: ngettext,
      [gettextFunctionNames.pgettext]: pgettext,
      [gettextFunctionNames.npgettext]: npgettext,
    });

    for (const f of all) {
      const source = sourceByFilename.get(f);
      const addedKeys = new Set<string>();
      const translationCalls = readString(source, gettextFunctionNames);

      for (const t of translationCalls) {
        try {
          const { lineNumber, fn } = t;
          const { key, plural } = vm.runInContext(fn, context);
          let usages = usagesByKey.get(key);

          referenceTemplate[key] = plural;
          addedKeys.add(key);

          if (!usages) {
            usages = new Set();
            usagesByKey.set(key, usages);
          }

          usages.add({
            filename: f,
            lineNumber,
          });
        } catch (e) {
          console.warn(e);
        }
      }

      keysByFilename.set(f, addedKeys);
    }

    if (options.debug) {
      console.log(
        "Parsed keys",
        JSON.stringify(Array.from(usagesByKey.keys()), null, 4)
      );
    }
  }

  /**
   * Loads (or unloads) the source code for any files that have changed.
   * This function does no real parsing.
   * @internal
   */
  private readSourceFiles(delta: FileDelta) {
    const { locales, debug } = this.options;
    const { modified, removed } = delta;
    const sourceByFilename = this.sourceByFilename;
    const keysByFilename = this.keysByFilename;
    let changed = false;

    // Delete metadata for removed files
    for (const f of removed.values()) {
      if (sourceByFilename.has(f) || keysByFilename.has(f)) {
        sourceByFilename.delete(f);
        keysByFilename.delete(f);
        changed = true;
      }
    }

    // Update metadata for added or modified files
    for (const f of modified.values()) {
      try {
        const contents = String(fs.readFileSync(f));
        if (contents !== sourceByFilename.get(f)) {
          changed = true;
          sourceByFilename.set(f, contents);
        }
      } catch (e) {
        sourceByFilename.delete(f);
        keysByFilename.delete(f);
        modified.delete(f);
        removed.add(f);
        changed = true;
      }
    }

    return changed;
  }

  /**
   * Loads the asset files looking for localization calls.  it is then used
   * to update the scripts. When requestFiles is passed in, only those files will be checked.
   * @param {Array<String>} [requestFiles = []] - The files or none to
   * update everything in the options.files glob pattern.
   */
  merge(requestFiles?: string[]) {
    const fileDelta = this.calculateFileDelta(requestFiles);

    if (this.readSourceFiles(fileDelta)) {
      this.rebuildCache();
      this.writeLocaleFiles(fileDelta);
    }

    if (options.debug) {
      print("DONE");
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
      return path.resolve(options.templates, "locales");
    }

    return "./locales";
  }
}

module.exports = TranslationStaticAnalyzer;
