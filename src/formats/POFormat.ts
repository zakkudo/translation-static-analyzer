import { type LocalizationItem } from "src/types";
import validate from "src/validate";

type LocalizationBuffer = Partial<{
  developerComments: string;
  flags: string[];
  msgctxt: string;
  msgid: string;
  msgidPlural: string;
  msgstr: string;
  msgstrPlural: Record<string, string>;
  previous: Partial<{
    msgid: string;
    msgctxt: string;
  }>;
  sourceReferences: { filename: string; lineNumber: number }[];
  translatorComments: string;
}>;

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

const patterns: Record<string, RegExp> = {
  appendPattern: /^"(.*)"$/,
  /* Extracted comments */
  developerComments: /^(#\.) (.+)$/,
  /* flag */
  flags: /^(#,) (.+)$/,
  msgctxt: /^(msgctxt) "(.*)"$/,
  msgid: /^(msgid) "(.*)"$/,
  msgidPlural: /^(msgid_plural) "(.*)"$/,
  msgstr: /^(msgstr) "(.*)"$/,
  msgstrPlural: /^(msgstr)\[(\d+)\] "(.*)"$/,
  /* reference */
  sourceReferences: /^(#:) (.+)$/,
  /* Translator comments */
  translatorComments: /^(#) (.+)$/,
};

class Reader {
  previousKey: keyof LocalizationBuffer | undefined;
  previousIndex: string | undefined;
  data: LocalizationBuffer | undefined;

  readLine(line: string) {
    /* Translator comments */
    let match;

    this.data = this.data || {};

    if ((match = line.match(patterns.translatorComments)) !== null) {
      const [, , value] = match;
      this.data.translatorComments = breakLines(value);
      this.previousKey = "translatorComments";
    } else if ((match = line.match(patterns.developerComments)) !== null) {
      const [, , value] = match;
      this.data.developerComments = breakLines(value);
      this.previousKey = "developerComments";
    } else if ((match = line.match(patterns.flags)) !== null) {
      const [, , value] = match;
      this.data.flags = value.split(" ");
      this.previousKey = "flags";
    } else if ((match = line.match(patterns.sourceReferences)) !== null) {
      const [, , value] = match;
      this.data.sourceReferences = value.split(" ").map((l) => {
        const [filename, lineNumber] = l.split(":");

        return {
          filename,
          lineNumber: parseInt(lineNumber),
        };
      });
      this.previousKey = "sourceReferences";
    } else if ((match = line.match(patterns.msgctxt)) !== null) {
      const [, , value] = match;
      this.data.msgctxt = breakLines(value);
      this.previousKey = "msgctxt";
      return true;
    } else if ((match = line.match(patterns.msgid)) !== null) {
      const [, , value] = match;
      this.data.msgid = breakLines(value);
      this.previousKey = "msgid";
      return true;
    } else if ((match = line.match(patterns.msgidPlural)) !== null) {
      const [, , value] = match;
      this.data.msgidPlural = breakLines(value);
      this.previousKey = "msgidPlural";
      return true;
    } else if ((match = line.match(patterns.msgstr)) !== null) {
      const [, , value] = match;
      console.log({ value });
      (this.data.msgstr as string) = breakLines(value);
      this.previousKey = "msgstr";
      return true;
    } else if ((match = line.match(patterns.msgstrPlural)) !== null) {
      const [, , index, value] = match;
      this.data.msgstrPlural = this.data.msgstrPlural || {};
      this.data.msgstrPlural[index] = breakLines(value);
      this.previousKey = "msgstrPlural";
      this.previousIndex = index;
      return true;
    } else if ((match = line.match(patterns.appendPattern)) !== null) {
      if (
        this.previousKey === "msgstrPlural" &&
        this.previousKey !== undefined
      ) {
        const [, value] = match;
        this.data.msgstrPlural[this.previousIndex] += breakLines(value);
      } else if (this.previousKey) {
        const [, value] = match;
        switch (this.previousKey) {
          case "msgid":
            this.data.msgid += breakLines(value);
            break;
          case "msgidPlural":
            this.data.msgidPlural += breakLines(value);
            break;
          case "msgstr":
            this.data.msgstr += breakLines(value);
            break;
          case "msgctxt":
            this.data.msgctxt += breakLines(value);
            break;
        }
      }
      return true;
    } else {
      return false;
    }
  }
}

const breakLines = (text: string): string => {
  return text.replace(new RegExp("\\\\n", "gm"), "\n");
};

const unbreakLines = (text: string): string => {
  const lines = text.split("\n").map((t) => JSON.stringify(t).slice(1, -1));

  return `"${lines.join('\\n"\n"')}"`;
};

const push = (
  list: Partial<LocalizationItem>[],
  buffer: LocalizationBuffer,
) => {
  let out: LocalizationItem | null = null;

  if (buffer.msgidPlural !== undefined) {
    out = {
      developerComments: buffer.developerComments,
      flags: buffer.flags,
      msgctxt: buffer.msgctxt,
      msgid: buffer.msgid,
      msgidPlural: buffer.msgidPlural,
      msgstr: buffer.msgstrPlural,
      sourceReferences: buffer.sourceReferences,
      translatorComments: buffer.translatorComments,
    };
  } else {
    out = {
      developerComments: buffer.developerComments,
      flags: buffer.flags,
      msgctxt: buffer.msgctxt,
      msgid: buffer.msgid,
      msgstr: buffer.msgstr,
      sourceReferences: buffer.sourceReferences,
      translatorComments: buffer.translatorComments,
    };
  }

  console.log({ out });

  Object.entries(out).forEach(
    ([key, value]: [keyof LocalizationItem, unknown]) => {
      if (value === undefined) {
        delete out[key];
      }
    },
  );

  list.push(out);
};

class POFormat {
  static parse(text: string) {
    const data: Partial<LocalizationItem>[] = [];

    const reader = new Reader();

    removeUnusedComment(text)
      .split("\n")
      .map((line) => {
        const incomplete = reader.readLine(line);

        if (!incomplete) {
          push(data, reader.data);
          delete reader.data;
          delete reader.previousKey;
          delete reader.previousIndex;
        }
      });

    return data.map(validate);
  }

  static stringify(data: LocalizationItem[]): string {
    return data
      .map((d) => {
        let accumulator = "";
        const { sourceReferences = [] } = d;
        const unused = sourceReferences.length === 0 ? true : false;
        const prefix = unused ? unusedPrefix : "";

        if (d.translatorComments) {
          accumulator += `${prefix}# ${d.translatorComments}\n`;
        }

        if (d.developerComments) {
          accumulator += `#. ${d.developerComments}\n`;
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
          accumulator += `${prefix}msgid ${unbreakLines(d.msgid)}\n`;
        }

        if (Object.hasOwnProperty.call(d, "msgidPlural")) {
          accumulator += `${prefix}msgid_plural ${unbreakLines(
            d.msgidPlural,
          )}\n`;
        }

        if (d.msgstr !== undefined) {
          if (typeof d.msgstr === "string") {
            accumulator += `${prefix}msgstr ${unbreakLines(d.msgstr)}\n`;
          } else {
            Object.entries(d.msgstr).forEach(([index, msgstr]) => {
              accumulator += `${prefix}msgstr[${index}] ${unbreakLines(
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

export default POFormat;
