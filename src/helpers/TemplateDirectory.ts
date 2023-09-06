import path from 'node:path';
import fs from 'fs-extra';
import FormatParsingError from './errors/FormatParsingError';
import UnsupportedFormatError from './errors/UnsupportedFormatError';
import JSON from './formats/JSON';
import JSON5 from './formats/JSON5';
import PO from './formats/PO';

const FALLBACK_FORMAT = 'po';

const formatHandler = new Map([
  ['po', PO],
  ['json', JSON],
  ['json5', JSON5],
]);

class TemplateDirectory {
  constructor(directoryPath, defaultFormat, cache = {}) {
    this.directoryPath = directoryPath;
    this.defaultFormat = defaultFormat;
    this.cache = cache;
  }

  buildFilename(locale, format) {
    const basename = [locale, format].filter(p => p).join('.');

    return path.resolve(this.directoryPath, `${basename}`);
  }

  writeLocalization(locale, localization, format) {
    format = format || this.defaultFormat || FALLBACK_FORMAT
    const filename = this.buildFilename(locale, format);
    const handler = formatHandler.get(format);
    let serialized;

    if (!handler) {
      throw new UnsupportedFormatError(format);
    }

    serialized = handler.stringify(localization);

    if (this.cache[filename] !== serialized) {
      fs.writeFileSync(filename, serialized);
      this.cache[filename] = serialized;

      return true;
    }

    return false;
  }

  ensureDirectory() {
    fs.ensureDirSync(this.directoryPath);
  }

  readLocalization(locale, format) {
    format = format || this.defaultFormat || FALLBACK_FORMAT
    const filename = this.buildFilename(locale, format);
    const handler = formatHandler.get(format);
    let text;

    if (!handler) {
      throw new UnsupportedFormatError(format);
    }

    try {
      text = String(fs.readFileSync(filename));
    } catch (e) {
      if (e.code === 'ENOENT') {
        text = '[]';
      } else {
        throw e;
      }
    }

    try {
      return handler.parse(text);
    } catch (e) {
      throw new FormatParsingError(format, e.message, e.stack);
    }
  }

    /*
  normalizeTo(format) {
    formatHandler.entries().forEach(([extension, handler]) => {
      if (extension !== format) {
      }
    });
  }
  */
}

export default TemplateDirectory;
