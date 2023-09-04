import toKey from "src/toKey";
import fromKey from "src/fromKey";
import validate from "src/validate";
import JSON5 from "json5";
import jju from "jju";
import { type Token } from "jju";
import { type LocalizationItem } from "src/types";

/*
  #  translator-comments
  #. extracted-comments
  #: reference…
  #, flag…
  #| msgid previous-untranslated-string
  #| msgctxt previous-untranslated-string
  msgid untranslated-string
  msgstr translated-string
  */

function isWhitespace(token: Token) {
  return token.type === "whitespace" || token.type === "newline";
}

function removeCommentMarkers(text: string) {
  if (text.startsWith("//")) {
    return text.slice(2);
  }

  return text.slice(2, -2);
}

function parseComments(text: string): Record<string, Record<string, string[]>> {
  const tokens = jju.tokenize(text).filter((t) => !isWhitespace(t));
  let buffer: string[] = [];
  const comments = {};

  tokens.forEach((t) => {
    if (t.type === "comment") {
      buffer.push(removeCommentMarkers(t.raw));
    } else if (t.type === "key") {
      if (buffer.length) {
        const leaf = t.stack.reduce(
          (node: Record<string, unknown>, msgid: string) => {
            const subNode = (node[msgid] = node[msgid] || {});
            return subNode;
          },
          comments,
        ) as Record<string, unknown>;

        leaf[t.value] = buffer;
        buffer = [];
      }
    } else {
      buffer = [];
    }
  });

  return comments;
}

type MappingTuple = [
  keyof LocalizationItem,
  string,
  (entry: LocalizationItem) => string,
];

const commentsMapping: MappingTuple[] = [
  ["translatorComments", "", (entry) => entry.translatorComments],
  ["flags", ",", (entry) => entry.flags.join(" ")],
  [
    "previous",
    "|",
    (entry) => {
      const out: string[] = [];

      if (entry.previous.msgid) {
        out.push(`msgid ${entry.previous.msgid}`);
      }
      if (entry.previous.msgctxt) {
        out.push(`msgid ${entry.previous.msgctxt}`);
      }

      return out.join("\n");
    },
  ],
  ["developerComments", ".", (entry) => entry.developerComments],
  [
    "sourceReferences",
    ":",
    (entry) =>
      entry.sourceReferences
        .map(({ filename, lineNumber }) => `${filename}:${lineNumber}`)
        .join(" "),
  ],
];

function serializeEntryComments(entry: LocalizationItem) {
  return commentsMapping
    .reduce((accumulator, [msgid, prefix, normalize]) => {
      if (entry[msgid]) {
        const out = normalize(entry);

        if (out) {
          return accumulator.concat(
            normalize(entry)
              .split("\n")
              .map((line) => {
                return `\t\t//${prefix} ${line}`;
              })
              .join("\n"),
          );
        }

        return accumulator;
      }

      return accumulator;
    }, [])
    .map((l) => l + "\n")
    .join("");
}

function stringify(value: unknown): string {
  return JSON.stringify(value);
}

function serializeValue(value: string | Record<string, string>) {
  if (typeof value === "string") {
    return stringify(value);
  } else {
    return (
      "{\n" +
      Object.entries(value)
        .sort(([k1], [k2]) => k1.localeCompare(k2))
        .map(([index, msgstr]) => {
          return `\t\t\t${stringify(index)}: ${stringify(msgstr)}`;
        })
        .join(",\n") +
      "\n\t\t}"
    );
  }
}

function serializeEntry(entry: LocalizationItem) {
  const msgctxt = entry.msgctxt || "default";
  const { flags = [], sourceReferences = [] } = entry;
  const out = `{
\t"${toKey(entry.msgid, entry.msgidPlural)}": {
${serializeEntryComments(entry)}\t\t"${msgctxt}": ${serializeValue(
    entry.msgstr,
  )}
\t}
}`;

  if (!flags.includes("fuzzy") && sourceReferences.length === 0) {
    return out.replace(/^/gm, "// ");
  }

  return out;
}

class _JSON5 {
  static parse(text: string) {
    const comments = parseComments(text);
    const localizations = JSON5.parse(text);

    return Object.entries(localizations)
      .reduce((accumulator, [keys, contexts]) => {
        return accumulator.concat(
          Object.entries(contexts).map(([msgctxt, msgstr]) => {
            const [msgid, msgidPlural] = fromKey(keys);
            const out: Partial<LocalizationItem> = {
              msgid,
              msgctxt,
              msgstr,
            };

            if (msgidPlural) {
              out.msgidPlural = msgidPlural;
            }

            if (comments[keys] && comments[keys][msgctxt]) {
              comments[keys][msgctxt].forEach((c) => {
                if (c.startsWith(" ")) {
                  out.translatorComments = out.translatorComments || "";
                  out.translatorComments += c.slice(1);
                } else if (c.startsWith(". ")) {
                  out.developerComments = out.developerComments || "";
                  out.developerComments += c.slice(2);
                }
              });
            }

            return out;
          }),
        );
      }, [])
      .map(validate);
  }

  static stringify(data: LocalizationItem[]) {
    return data
      .map((entry) => {
        validate(entry);

        return serializeEntry(entry);
      })
      .join(",\n")
      .replace(/^\t+/gm, (x) => "".padStart(x.length * 4, " "));
  }
}

export default _JSON5;
