const validate = require('../validate');

//http://pology.nedohodnik.net/doc/user/en_US/ch-poformat.html
/*
 {
    "notes": "translator notes",
    "comments": "extacted comments",
    "status": "new",
    "references": [
        "src/Application/pages/AboutPage/index.js:14"
    ],
    "key": "About",
    "context": "default",
    "value": ""
}
*/

/*
  #  translator-comments
  #. extracted-comments
  #: reference…
  #: src/msgcmp.c:338 src/po-lex.c:699
  #, flag…
  #| msgid previous-untranslated-string
  msgid untranslated-string
  msgstr translated-string
  */

const unusedPrefix = '#~ '
const unusedPattern = /^#~ /;

/**
 * @private
 */
function removeUnusedComment(line) {
  return line.replace(unusedPattern, '');
}

const patterns = [
  /* Translator comments */
  /^(#) (.+)$/,
  /* Extracted comments */
  /^(#\.) (.+)$/,
  /* flag */
  /^(#,) (,+)$/,
  /* reference */
  /^(#:) (.+)$/,
  /^(msgctxt) "(.*)"$/,
  /^(msgid) "(.*)"$/,
  /^(msgid_plural) "(.*)"$/,
  /^(msgstr) "(.*)"$/,
  /^(msgstr)\[(\d+)\] "(.*)"$/,
  /^"(.*)"$/,
];

class Reader {
  readLine(line) {
    patterns.some((p) => {
      const matches = (line.match(p) || []).slice(1);

      if (this.previousKey === undefined) {
        delete this.data;
      }

      const data = this.data = this.data || {};

      //Blank line, entry end
      if (line === '') {
        delete this.previousKey;
        delete this.previousIndex;
        return true;
        //Continuing line start
      } else if (matches.length === 1) {
        const value = matches[0]

        if (Object(data[this.previousKey]) === data[this.previousKey]) {
          data[this.previousKey][this.previousIndex] += value;
        } else if (typeof data[this.previousKey] === 'string') {
          data[this.previousKey] += value;
        }
        return true;
        //Singular form start
      } else if (matches.length === 2) {
        const key = this.previousKey = matches[0];
        const value = matches[1];

        data[key] = value;
        return true;
        //Plural form start
      } else if (matches.length == 3) {
        const key = this.previousKey = matches[0];
        const index = this.previousIndex = matches[1];
        const value = matches[2];
        const list = data[key] = this.data[key] || {};

        list[index] = value;
        return true;
      }

      return false;
    });

    return Boolean(this.previousKey);
  }
}

function breakLines(text) {
  const lines = text.split('\n').map((t) => JSON.stringify(t).slice(1, -1));

  return `"${lines.join('\\n"\n"')}"`;
}

class PO {
  static parse(text) {
    const data = [];

    let reader = new Reader();

    text.split('\n').map(removeUnusedComment).forEach((line, index, lines) => {
      if (!reader.readLine(line) || (line !== '' && index + 1 === lines.length)) {
        const entry = {}
        let hasContent = false;

        Object.entries({
          'notes': '#',
          'comments': '#.',
          'key': 'msgid',
          'plural': 'msgid_plural',
          'context': 'msgctxt',
          'value': 'msgstr',
        }).forEach(([internalKey, poKey]) => {
          if (reader.data[poKey] !== undefined) {
            hasContent = true;
            const value = reader.data[poKey];

            if (Object(value) === value) {
              entry[internalKey] = Object.entries(value).reduce((accumulator, [k, v]) => {
                return Object.assign({}, accumulator, {[k]: JSON.parse(`"${v}"`)});
              }, {});
            } else {
              entry[internalKey] = JSON.parse(`"${value}"`);
            }
          }
        });

        if (hasContent) {
          data.push(entry);
        }
      }
    });

    return data.map(validate);
  }

  static stringify(data) {
    return data.map((d) => {
      let accumulator = ''
      const prefix = d.status === 'unused' ? unusedPrefix : '';

      if (d.notes) {
        accumulator += `${prefix}# ${d.notes}\n`;
      }

      if (d.status && !['existing', 'unused'].includes(d.status)) {
        accumulator += `#. ${d.status.toUpperCase()}\n`;
      }

      if (d.comments) {
        accumulator += `#. ${d.comments}\n`;
      }

      if (d.references && d.references.length) {
        accumulator += `#: ${d.references.map((r) => `${r.filename}:${r.lineNumber}`).join(' ')}\n`;
      }

      if (d.context && d.context !== 'default') {
        accumulator += `${prefix}msgctxt ${JSON.stringify(d.context)}\n`;
      }

      if (d.hasOwnProperty('key')) {
        accumulator += `${prefix}msgid ${breakLines(d.key)}\n`;
      }

      if (d.hasOwnProperty('plural')) {
        accumulator += `${prefix}msgid_plural ${breakLines(d.plural)}\n`;
      }

      if (d.value !== undefined) {
        if (typeof d.value === 'string') {
          accumulator += `${prefix}msgstr ${breakLines(d.value)}\n`;
        } else {
          Object.entries(d.value).forEach(([index, value]) => {
            accumulator += `${prefix}msgstr[${index}] ${breakLines(value)}\n`;
          });
        }
      }

      validate(d);

      return accumulator;
    }).join('\n');
  }
}
/*

///* This is the first comments.  */
//gettext ("foo");
//
///* This is the second comments: not extracted  */
//gettext (
//"bar");
//
//gettext (
///* This is the third comments.  */
//"baz");
  /*
 *
 *
 *
white-space
#  translator-comments
#. extracted-comments
#: reference…
#, flag…
#| msgid previous-untranslated-string
msgid untranslated-string
msgstr translated-string

#. NEW
#: lib/error.c:116
msgctxt "Context"
msgid "Unknown system error"
msgstr ""
"<b>Tip</b><br/>Some non-Meade telescopes support a subset of the LX200 "
"command set. Select <tt>LX200 Basic</tt> to control such devices."
msgstr ""

#: ../src/waei/application.c:140 ../src/gwaei/application.c:234
#, kde-format
msgid "Time: %1 second"
msgid_plural "Time: %1 seconds"
msgstr[0] ""
msgstr[1] ""

#~ msgid "Set the telescope longitude and latitude."
#~ msgstr "Postavi geo. dužinu i širinu teleskopa."

#. TRANSLATORS: First letter in 'Scope'
#. TRANSLATORS: South
#: tools/observinglist.cpp:700 skycomponents/horizoncomponent.cpp:429
msgid "S"
msgstr ""


*/

module.exports = PO;
