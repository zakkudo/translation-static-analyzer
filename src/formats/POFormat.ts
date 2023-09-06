import { ParsingError } from "src/errors";
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
    let match: ReturnType<typeof String.prototype.match> | null = null;
    const data = (this.data = this.data || {});

    if ((match = line.match(patterns.translatorComments)) !== null) {
      const [, , value] = match;
      data.translatorComments = breakLines(value);
      this.previousKey = "translatorComments";
      return true;
    } else if ((match = line.match(patterns.developerComments)) !== null) {
      const [, , value] = match;
      data.developerComments = breakLines(value);
      this.previousKey = "developerComments";
      return true;
    } else if ((match = line.match(patterns.flags)) !== null) {
      const [, , value] = match;
      data.flags = value.split(" ");
      this.previousKey = "flags";
      return true;
    } else if ((match = line.match(patterns.sourceReferences)) !== null) {
      const [, , value] = match;
      data.sourceReferences = value.split(" ").map((l) => {
        const [filename, lineNumber] = l.split(":");

        return {
          filename,
          lineNumber: parseInt(lineNumber),
        };
      });
      this.previousKey = "sourceReferences";
      return true;
    } else if ((match = line.match(patterns.msgctxt)) !== null) {
      const [, , value] = match;
      data.msgctxt = breakLines(value);
      this.previousKey = "msgctxt";
      return true;
    } else if ((match = line.match(patterns.msgid)) !== null) {
      const [, , value] = match;
      data.msgid = breakLines(value);
      this.previousKey = "msgid";
      return true;
    } else if ((match = line.match(patterns.msgidPlural)) !== null) {
      const [, , value] = match;
      data.msgidPlural = breakLines(value);
      this.previousKey = "msgidPlural";
      return true;
    } else if ((match = line.match(patterns.msgstr)) !== null) {
      const [, , value] = match;
      (data.msgstr as string) = breakLines(value);
      this.previousKey = "msgstr";
      return true;
    } else if ((match = line.match(patterns.msgstrPlural)) !== null) {
      const [, , index, value] = match;
      data.msgstrPlural = data.msgstrPlural || {};
      data.msgstrPlural[index] = breakLines(value);
      this.previousKey = "msgstrPlural";
      this.previousIndex = index;
      return true;
    } else if ((match = line.match(patterns.appendPattern)) !== null) {
      if (
        this.previousKey === "msgstrPlural" &&
        this.previousKey !== undefined
      ) {
        const [, value] = match;
        data.msgstrPlural[this.previousIndex] += breakLines(value);
      } else if (this.previousKey) {
        const [, value] = match;
        switch (this.previousKey) {
          case "msgid":
            data.msgid += breakLines(value);
            break;
          case "msgidPlural":
            data.msgidPlural += breakLines(value);
            break;
          case "msgstr":
            data.msgstr += breakLines(value);
            break;
          case "msgctxt":
            data.msgctxt += breakLines(value);
            break;
        }
      }
      return true;
    } else if (line.trim() === "") {
      return false;
    } else {
      throw new ParsingError(line);
    }
  }
}

const breakLines = (text: string): string => {
  return JSON.parse(`"${text}"`);
};

const unbreakLines = (tag: string, text: string): string => {
  let tagLength = tag.length;
  const maxLength = 80;

  const out: string[] = [];

  text
    .split("\n")
    .map((l) => JSON.stringify(l).slice(1, -1))
    .forEach((s, index, list) => {
      let buffer = s;

      if (index < list.length - 1) {
        buffer += "\\n";
      }

      if (buffer.length > 0) {
        while (buffer.length > 0) {
          const before = buffer.slice(0, maxLength - tagLength);
          buffer = buffer.slice(maxLength - tagLength, -1);
          tagLength = 0;
          out.push(`"${before}"`);
        }
      } else {
        tagLength = 0;
        out.push(`""`);
      }
    });

  if (out.length > 0) {
    return out.join("\n");
  }

  return JSON.stringify("");
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

    text
      .split("\n")
      .map(removeUnusedComment)
      .map((line) => {
        const incomplete = reader.readLine(line);

        if (!incomplete) {
          if (Object.keys(reader.data).length > 0) {
            push(data, reader.data);
          }
          delete reader.data;
          delete reader.previousKey;
          delete reader.previousIndex;
        }
      });

    if (reader.data && Object.keys(reader.data).length > 0) {
      push(data, reader.data);
      delete reader.data;
      delete reader.previousKey;
      delete reader.previousIndex;
    }

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

        if (typeof d.msgctxt === "string" && d.msgctxt !== "default") {
          const tag = `${prefix}msgctxt `;
          accumulator += `${tag}${unbreakLines(tag, d.msgctxt)}\n`;
        }

        if (typeof d.msgid === "string") {
          const tag = `${prefix}msgid `;
          accumulator += `${tag}${unbreakLines(tag, d.msgid)}\n`;
        }

        if (typeof d.msgidPlural === "string") {
          const tag = `${prefix}msgid_plural `;
          accumulator += `${tag}${unbreakLines(tag, d.msgidPlural)}\n`;
        }

        if (d.msgstr !== undefined) {
          if (typeof d.msgstr === "string") {
            const tag = `${prefix}msgstr `;
            accumulator += `${tag}${unbreakLines(tag, d.msgstr)}\n`;
          } else {
            Object.entries(d.msgstr).forEach(([index, msgstr]) => {
              const tag = `${prefix}msgstr[${index}] `;
              accumulator += `${tag}${unbreakLines(tag, msgstr)}\n`;
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
