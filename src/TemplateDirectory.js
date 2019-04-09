const fs = require('fs-extra');
const path = require('path');
const PO = require('./formats/PO');
const JSON = require('./formats/JSON');
const JSON5 = require('./formats/JSON5');
const UnsupportedFormatError = require('./errors/UnsupportedFormatError');
const FormatParsingError = require('./errors/FormatParsingError');

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

module.exports = TemplateDirectory;
