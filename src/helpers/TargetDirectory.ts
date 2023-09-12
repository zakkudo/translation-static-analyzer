import { writeFileSync } from "node:fs";
import path from "node:path";
import toKey from "src/helpers/toKey";
import { type LocalizationItem } from 'src/types';


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
