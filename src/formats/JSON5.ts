import toKey from "src/toKey";
import fromKey from "src/fromKey";
import validate from "src/validate";
import JSON5 from "json5";
import jju from "jju";
import { type Token } from "jju";
import { type LocalizationItem } from "src/types";

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
      "data": ""
  }
  */
/*
  #  translator-comments
  #. extracted-comments
  #: reference…
  #, flag…
  #| msgid previous-untranslated-string
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

function parseComments(text: string) {
  const tokens = jju.tokenize(text).filter((t) => !isWhitespace(t));
  let buffer = [];
  const comments = {};

  tokens.forEach((t) => {
    if (t.type === "comment") {
      buffer.push(removeCommentMarkers(t.raw));
    } else if (t.type === "key") {
      if (buffer.length) {
        const leaf = t.stack.reduce((node, key) => {
          const subNode = (node[key] = node[key] || {});
          return subNode;
        }, comments);

        leaf[t.value] = buffer;
        buffer = [];
      }
    } else {
      buffer = [];
    }
  });

  return comments;
}

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
      "data": ""
  }
  */
/*
{
  [key]: {
    // notes
    //. status
    //. comments
    //: references
    [context]: value
  }
},\n
  */

const commentsMapping = [
  ["notes", "", (entry) => entry.notes],
  ["status", ".", (entry) => entry.status],
  ["comments", ".", (entry) => entry.comments],
  ["references", ":", (entry) => entry.references.join(" ")],
];

function serializeEntryComments(entry) {
  return commentsMapping
    .reduce((accumulator, [key, prefix, normalize]) => {
      if (entry[key]) {
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
    }, [])
    .map((l) => l + "\n")
    .join("");
}

function stringify(value: unknown): string {
  return JSON.stringify(value);
}

function serializeValue(value) {
  if (typeof value === "string") {
    return stringify(value);
  } else {
    return (
      "{\n" +
      Object.entries(value)
        .map(([key, value]) => {
          return `\t\t\t${stringify(key)}: ${stringify(value)}`;
        })
        .join(",\n") +
      "\n\t\t}"
    );
  }
}

function serializeEntry(entry: LocalizationItem) {
  const context = entry.context || "default";

  return `{
\t"${toKey(entry.key, entry.plural)}": {
${serializeEntryComments(entry)}\t\t"${context}": ${serializeValue(entry.value)}
\t}
}`;
}

class _JSON5 {
  static parse(text: string) {
    const comments = parseComments(text);
    const localizations = JSON5.parse(text);

    return Object.entries(localizations)
      .reduce((accumulator, [keys, contexts]) => {
        return accumulator.concat(
          Object.entries(contexts).map(([context, value]) => {
            const [key, plural] = fromKey(keys);
            const out: LocalizationItem = {
              key,
              context,
              value,
            };

            if (plural) {
              out.plural = plural;
            }

            if (comments[keys] && comments[keys][context]) {
              comments[keys][context].forEach((c) => {
                if (c.startsWith(" ")) {
                  out.notes = out.notes || "";
                  out.notes += c.slice(1);
                } else if (c.startsWith(". ")) {
                  out.comments = out.comments || "";
                  out.comments += c.slice(2);
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
