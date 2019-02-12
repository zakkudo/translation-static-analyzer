/*
  #  translator-comments
  #. extracted-comments
  #: reference…
  #, flag…
  #| msgid previous-untranslated-string
  msgid untranslated-string
  msgstr translated-string
  */
const validate = require('../validate');


class _JSON {
  static parse(text) {
    return JSON.parse(text).map(validate);
  }

  static stringify(data) {
    data.forEach((d) => {
      validate(d);
    });

    return JSON.stringify(data, null, 4);
  }
}

module.exports = _JSON;
