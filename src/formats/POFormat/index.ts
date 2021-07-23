// http://pology.nedohodnik.net/doc/user/en_US/ch-poformat.html
//https://www.gnu.org/software/gettext/manual/html_node/PO-Files.html

/*
msgid ""
msgstr ""
"Project-Id-Version: PACKAGE VERSION\n"
"Report-Msgid-Bugs-To: http://bugs.kde.org\n"
"POT-Creation-Date: 2008-09-03 10:09+0200\n"
"PO-Revision-Date: YEAR-MO-DA HO:MI+ZONE\n"
"Last-Translator: FULL NAME <EMAIL@ADDRESS>\n"
"Language-Team: LANGUAGE <kde-i18n-doc@kde.org>\n"
"MIME-Version: 1.0\n"
"Content-Type: text/plain; charset=UTF-8\n"
"Content-Transfer-Encoding: 8bit\n"
"Plural-Forms: nplurals=INTEGER; plural=EXPRESSION;\n"

{
translatorComments
extractedComments
references
flags
msgid
msgid_plural
}

TRANSLATOR COMMENTS
# Wikipedia says that ‘etrurski’ is our name for this script. 

EXTRACTED COMMENTS
#. Tag: title 

FILENAME AND LINE
#: gxsldbgpart/libxsldbg/xsldbg.c:256
#, c-format

FUZZY WITH PREVIOUS MESSAGE
#, fuzzy
#| msgid "Elements with boiling point around this temperature:"

msgid "%s took %d ms to complete."
msgstr "Trebalo je %2$d ms da se %1$s završi."
msgid_plural

OBSOLETE MESSAGES, grouped at end
#~ msgid "Set the telescope longitude and latitude."
#~ msgstr "Postavi geo. dužinu i širinu teleskopa." 
*/

//msgstr[0]

enum Token {
  FLAG = "#,",
  OBSOLETE = "#~",
  SOURCE_REFERENCE = "#:",
  PREVIOUS = "#|",
  EXTRACTED_COMMENT = "#.",
  TRANSLATOR_COMMENT = "#",
  MSGID = "msgid",
  MSGCTXT = "msgctxt",
  MSGSTR = "msgstr",
  MSGID_PLURAL = "msgid_plural",
  BLANK_LINE = "",
  TEXT = '"',
}

const arrayPattern = /^([^ ]+)\[([0-9]+)\] (.*)/;
const normalPattern = /^([^ ]+) (.*)/;

function parseLine(line: string): {
  key: string;
  value: string;
  index: number;
  previous: boolean;
  obsolete: boolean;
} {
  let match;
  const firstCharacter = line.slice(0, 1);

  if (firstCharacter === Token.TEXT) {
    return {
      key: firstCharacter,
      value: line,
      previous: false,
      index: 0,
      obsolete: false,
    };
  } else if (firstCharacter === Token.BLANK_LINE) {
    return {
      key: firstCharacter,
      value: line,
      previous: false,
      index: 0,
      obsolete: false,
    };
  } else if ((match = line.match(arrayPattern))) {
    const [, key, index, value] = match;

    return {
      key,
      index: parseInt(index),
      value,
      previous: false,
      obsolete: false,
    };
  } else if ((match = line.match(normalPattern))) {
    const [, key, value] = match;

    if (key === Token.PREVIOUS) {
      return { ...parseLine(value), previous: true, index: 0, obsolete: false };
    } else if (key === Token.OBSOLETE) {
      return {
        ...parseLine(value),
        previous: false,
        index: 0,
        obsolete: true,
      };
    }

    return { key, value, previous: false, index: 0, obsolete: false };
  } else {
    throw new SyntaxError(`Invalid PO format. ${JSON.stringify(line)}`);
  }
}

type Message = {
  extractedComments: string[];
  flags: string[];
  msgctxt: string;
  msgid: string;
  msgidPlural?: string;
  msgstr: string[];
  previousMsgid?: string;
  previousMsgctxt?: string;
  previousMsgidPlural?: string;
  sourceReferences: string[];
  translatorComments: string[];
  obsolete: boolean;
};

function createMessage(): Message {
  return {
    extractedComments: [],
    flags: [],
    msgctxt: "",
    msgid: "",
    msgstr: [],
    sourceReferences: [],
    translatorComments: [],
    obsolete: false,
  };
}

function setValue(
  message: Message,
  key: string,
  value: string,
  index: number,
  previous: boolean
) {
  if (previous) {
    switch (key) {
      case Token.MSGID:
        message.previousMsgid = JSON.parse(value);
        break;
      case Token.MSGCTXT:
        message.previousMsgctxt = JSON.parse(value);
        break;
      case Token.MSGID_PLURAL:
        message.previousMsgidPlural = JSON.parse(value);
        break;
      default:
        throw new SyntaxError(
          `Invalid PO format. ${key}, ${value}, ${previous}`
        );
    }
  }

  switch (key) {
    case Token.FLAG:
      message.flags.push(value);
      break;
    case Token.SOURCE_REFERENCE:
      message.sourceReferences.push(value);
      break;
    case Token.MSGCTXT:
      message.msgctxt = JSON.parse(value);
      break;
    case Token.MSGID:
      message.msgid = JSON.parse(value);
      break;
    case Token.MSGID_PLURAL:
      message.msgidPlural = JSON.parse(value);
      break;
    case Token.MSGSTR:
      message.msgstr[index] = JSON.parse(value);
      break;
    case Token.EXTRACTED_COMMENT:
      message.extractedComments.push(value);
      break;
    case Token.TRANSLATOR_COMMENT:
      message.translatorComments.push(value);
      break;
    default:
      throw new SyntaxError(`Invalid PO format. ${key}, ${value}, ${previous}`);
  }
}

function appendValue(
  message: Message,
  key: string,
  index: number,
  value: string,
  previous: boolean
) {
  if (previous) {
    switch (key) {
      case Token.MSGCTXT:
        message.previousMsgctxt += JSON.parse(value);
        break;
      case Token.MSGID:
        message.previousMsgid += JSON.parse(value);
        break;
      case Token.MSGID_PLURAL:
        message.previousMsgidPlural += JSON.parse(value);
        break;
    }
  }

  switch (key) {
    case Token.MSGCTXT:
      message.msgctxt += JSON.parse(value);
      break;
    case Token.MSGID:
      message.msgid += JSON.parse(value);
      break;
    case Token.MSGID_PLURAL:
      message.msgidPlural += JSON.parse(value);
      break;
    case Token.MSGSTR:
      message.msgstr[index] += JSON.parse(value);
      break;
  }
}

class POFormat {
  static parse(text: string): Message[] {
    const lines = text.split("\n");
    const items = [];
    let message = createMessage();
    let previousKey;
    let previousIndex;
    let previousPrevious;

    for (const l of lines) {
      const { key, index, value, previous, obsolete } = parseLine(l);

      if (
        previousKey === Token.MSGSTR &&
        key !== Token.MSGSTR &&
        key !== Token.TEXT &&
        key !== Token.BLANK_LINE
      ) {
        items.push(message);
        message = createMessage();
      }

      switch (key) {
        case Token.TEXT:
          appendValue(message, previousKey, previousIndex, value, previousPrevious);
          break;
        case Token.BLANK_LINE:
          break;
        default:
          setValue(message, key, value, index, previous);
          if (obsolete) {
            message.obsolete = true;
          }
          previousKey = key;
          previousIndex = index;
          previousPrevious = previous;
          break;
      }
    }

    items.push(message);

    return items;
  }

  static stringify(data: Message[]): string {
    const lines = [];

    for (const d of data) {
      const {
        extractedComments,
        flags,
        msgctxt,
        msgid,
        msgidPlural,
        msgstr,
        previousMsgid,
        previousMsgctxt,
        previousMsgidPlural,
        sourceReferences,
        translatorComments,
      } = d;

      if (translatorComments.length) {
        lines.push(`${Token.TRANSLATOR_COMMENT} ${translatorComments}`);
      }

      if (extractedComments.length) {
        lines.push(`${Token.EXTRACTED_COMMENT} ${extractedComments}`);
      }
      if (sourceReferences.length) {
        lines.push(`${Token.SOURCE_REFERENCE} ${sourceReferences.join(" ")}`);
      }

      if (flags.length) {
        lines.push(`${Token.FLAG} ${flags.join(" ")}`);
      }

      if (previousMsgctxt) {
        lines.push(
          `${Token.PREVIOUS} ${Token.MSGCTXT} ${JSON.stringify(msgctxt)}`
        );
      }

      if (msgctxt) {
        lines.push(`${Token.MSGID} ${JSON.stringify(msgctxt)}`);
      }

      if (previousMsgid) {
        lines.push(`${Token.PREVIOUS} ${Token.MSGID} ${JSON.stringify(msgid)}`);
      }

      lines.push(`${Token.MSGID} ${JSON.stringify(msgid)}`);

      if (previousMsgidPlural) {
        lines.push(
          `${Token.PREVIOUS} ${Token.MSGID_PLURAL} ${JSON.stringify(
            previousMsgidPlural
          )}`
        );
      }

      if (msgidPlural) {
        lines.push(`${Token.MSGID_PLURAL} ${JSON.stringify(msgidPlural)}`);
      }

      if (msgstr.length) {
        if (typeof msgidPlural === 'string') {
          msgstr.map((m, index) => {
            lines.push(`${Token.MSGSTR}[${index}] ${JSON.stringify(m)}`);
          });
        } else {
          lines.push(`${Token.MSGSTR} ${JSON.stringify(msgstr[0])}`);
        }
      }
    }

    return lines.join("\n");
  }
}

export default POFormat;
