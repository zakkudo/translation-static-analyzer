import validate from "src/validate";
import { type LocalizationItem } from "src/types";

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
    "msgstr": ""
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

const unusedPrefix = "#~ ";
const unusedPattern = /^#~ /;

/**
 * @private
 */
function removeUnusedComment(line: string): string {
  return line.replace(unusedPattern, "");
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
  previousKey: keyof LocalizationItem | undefined;
  previousIndex: number | undefined;
  data: Partial<LocalizationItem> | undefined;

  readLine(line: string) {
    patterns.some((p) => {
      const matches = (line.match(p) || []).slice(1);

      if (this.previousKey === undefined) {
        delete this.data;
      }

      const data: Partial<LocalizationItem> = (this.data = this.data || {});

      //Blank line, entry end
      if (line === "") {
        delete this.previousKey;
        delete this.previousIndex;
        return true;
        //Continuing line start
      } else if (matches.length === 1) {
        const msgstr = matches[0];

        if (Object(data[this.previousKey]) === data[this.previousKey]) {
          data[this.previousKey][this.previousIndex] += msgstr;
        } else if (typeof data[this.previousKey] === "string") {
          data[this.previousKey] += msgstr;
        }
        return true;
        //Singular form start
      } else if (matches.length === 2) {
        const msgid = (this.previousKey = matches[0]);
        const msgstr = matches[1];

        data[msgid] = msgstr;
        return true;
        //Plural form start
      } else if (matches.length == 3) {
        const msgid = (this.previousKey = matches[0]);
        const index = (this.previousIndex = matches[1]);
        const msgstr = matches[2];
        const list = (data[msgid] = this.data[msgid] || {});

        list[index] = msgstr;
        return true;
      }

      return false;
    });

    return Boolean(this.previousKey);
  }
}

function breakLines(text: string): string {
  const lines = text.split("\n").map((t) => JSON.stringify(t).slice(1, -1));

  return `"${lines.join('\\n"\n"')}"`;
}

class PO {
  static parse(text: string) {
    const data: LocalizationItem[] = [];

    const reader = new Reader();

    text
      .split("\n")
      .map(removeUnusedComment)
      .forEach((line, index, lines) => {
        if (
          !reader.readLine(line) ||
          (line !== "" && index + 1 === lines.length)
        ) {
          const entry = {};
          let hasContent = false;

          Object.entries({
            translatorComments: "#",
            extractedComments: "#.",
            msgid: "msgid",
            msgidPlural: "msgid_plural",
            msgctxt: "msgctxt",
            msgstr: "msgstr",
          }).forEach(
            ([internalKey, poKey]: [keyof LocalizationItem, string]) => {
              if (reader.data[poKey] !== undefined) {
                hasContent = true;
                const msgstr = reader.data[poKey];

                if (Object(msgstr) === msgstr) {
                  entry[internalKey] = Object.entries(msgstr).reduce(
                    (accumulator, [k, v]) => {
                      return Object.assign({}, accumulator, {
                        [k]: JSON.parse(`"${v}"`),
                      });
                    },
                    {},
                  );
                } else {
                  entry[internalKey] = JSON.parse(`"${msgstr}"`);
                }
              }
            },
          );

          if (hasContent) {
            data.push(entry);
          }
        }
      });

    return data.map(validate);
  }

  static stringify(data: LocalizationItem[]): string {
    return data
      .map((d) => {
        let accumulator = "";
        const prefix = d.status === "unused" ? unusedPrefix : "";

        if (d.translatorComments) {
          accumulator += `${prefix}# ${d.translatorComments}\n`;
        }

        if (d.status && !["existing", "unused"].includes(d.status)) {
          accumulator += `#. ${d.status.toUpperCase()}\n`;
        }

        if (d.extractedComments) {
          accumulator += `#. ${d.extractedComments}\n`;
        }

        if (d.sourceReferences && d.sourceReferences.length) {
          accumulator += `#: ${d.sourceReferences
            .map((r) => `${r.filename}:${r.lineNumber}`)
            .join(" ")}\n`;
        }

        if (d.msgctxt && d.msgctxt !== "default") {
          accumulator += `${prefix}msgctxt ${JSON.stringify(d.msgctxt)}\n`;
        }

        if (Object.hasOwnProperty.call(d, "msgid")) {
          accumulator += `${prefix}msgid ${breakLines(d.msgid)}\n`;
        }

        if (Object.hasOwnProperty.call(d, "msgidPlural")) {
          accumulator += `${prefix}msgid_plural ${breakLines(d.msgidPlural)}\n`;
        }

        if (d.msgstr !== undefined) {
          if (typeof d.msgstr === "string") {
            accumulator += `${prefix}msgstr ${breakLines(d.msgstr)}\n`;
          } else {
            Object.entries(d.msgstr).forEach(([index, msgstr]) => {
              accumulator += `${prefix}msgstr[${index}] ${breakLines(
                msgstr,
              )}\n`;
            });
          }
        }

        validate(d);

        return accumulator;
      })
      .join("\n");
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

export default PO;
