import { writeFileSync } from "node:fs";
import path from "node:path";
import toKey from "./toKey";

/**
 * Compresses the translation for use by code, removing any extra context information
 * when not needed. (If there is only a default context, the context object is removed
 * and the translation is linked directly to the key for example.)
 * @private
 */
function collapseLocalization(localization) {
  return Object.entries(
    localization.reduce((accumulator, l) => {
      const key = toKey(l.key, l.plural);
      const context = l.context || "default";
      const value = Object.assign({}, accumulator[key] || {}, {
        [context]: l.value,
      });

      return Object.assign({}, accumulator, { [key]: value });
    }, {}),
  ).reduce((accumulator, [key, value]) => {
    const keys = new Set(Object.keys(value));

    if (keys.size === 1 && keys.has("default")) {
      return Object.assign({}, accumulator, { [key]: value.default });
    }

    return Object.assign({}, accumulator, { [key]: value });
  }, {});
}

function collapseLocalizations(localizations) {
  return Object.entries(localizations).reduce(
    (accumulator, [locale, localization]) => {
      return Object.assign({}, accumulator, {
        [locale]: collapseLocalization(localization),
      });
    },
    {},
  );
}

class TargetDirectory {
  constructor(directoryPath: string, cache = {}) {
    this.cache = cache;
    this.directoryPath = directoryPath;
  }

  buildFilename(locale) {
    const basename = [locale, "json"].filter((p) => p).join(".");

    return path.resolve(this.directoryPath, `${basename}`);
  }

  ensureDirectory() {
    ensureDirSync(this.directoryPath);
  }

  writeIndex(localizations) {
    const filename = this.buildFilename("index");
    const collapsed = collapseLocalizations(localizations);
    const serialized = JSON.stringify(collapsed, null, 4);

    if (this.cache[filename] !== serialized) {
      writeFileSync(filename, serialized);
      this.cache[filename] = serialized;
    }
  }

  writeLocalization(locale: string, localization) {
    const filename = this.buildFilename(locale);
    const collapsed = collapseLocalization(localization);
    const serialized = JSON.stringify(collapsed, null, 4);

    if (this.cache[filename] !== serialized) {
      writeFileSync(filename, serialized);
      this.cache[filename] = serialized;
    }
  }
}

export default TargetDirectory;
