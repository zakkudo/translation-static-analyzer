const InvalidTemplateHeaderError = require('./errors/InvalidTemplateHeaderError');

function slice(text, start, end) {
  if (end < 0) {
    end = text.length;
  }

  return text.slice(start, end);
}

function split(text, delimitor) {
  const index = text.indexOf(delimitor);

  return [slice(text, 0, index), slice(text, index + 1, -1)].map((a) => a.trim());
}

function parsePluralForms(text) {
  return text.split(';').filter(l => l).reduce((accumulator, a) => {
    let [key, value] = split(a, '=');

    if (key === 'nplurals') {
      value = parseInt(value);
    }

    if (!key) {
      throw new InvalidTemplateHeaderError(text, 'Plural-Forms has a blank key, actual: %s', JSON.stringify(text));
    }

    if (value === undefined || Number.isNaN(value)) {
      throw new InvalidTemplateHeaderError(text, `Plural-Forms expected a value for key ${JSON.stringify(key)}, actual: %s`, JSON.stringify(text));
    }

    return Object.assign({}, accumulator, {[key]: value});
  }, {});
}

function parseHeader(header) {
  //"Plural-Forms: nplurals=2; plural=n != 1;\n"
  //nplurals=3; plural=(n==1 ? 0 : n%10>=2 && n%10<=4 && (n%100<10 || n%100>=20) ? 1 : 2);
  const lines = header.split('\n').filter(l => l);
  const configuration = new Map(lines.map((l) => split(l, ':')));
  const pluralForms = configuration.get('Plural-Forms') || 'nplurals=2; plural=n != 1';

  configuration.set('Plural-Forms', parsePluralForms(pluralForms));
  return configuration;
}

module.exports = parseHeader;
