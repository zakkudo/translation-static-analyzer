import { type Headers, type Plurals } from 'src/types';

const headerKeys: Readonly<(keyof Headers)[]> = Object.freeze([
  "Project-Id-Version",
  "POT-Creation-Date",
  "PO-Revision-Date",
  "Language-Team",
  "MIME-Version",
  "Content-Type",
  "Content-Transfer-Encoding",
  "X-Generator",
  "Last-Translator",
  "Plural-Forms",
  "Language",
]);

/**
 * @internal
 */
function parsePluralForms(locale: string, text = ""): Plurals {
  const [nplurals, plural] = `${text};`.split(";").map((p) => p.trim());
  const length = parseInt((nplurals.match(/nplurals=([0-9]+)/) || [])[1]);
  const pluralValue = (plural.match(/plural=([^;]+)/) || [])[1];
  const out: Partial<Plurals> = {};

  if (!Number.isNaN(length)) {
    out.length = length;
  }

  if (pluralValue) {
    const countToIndexImplementation = new Function(
      "n",
      `return ${pluralValue};`,
    );

    const countToIndex = (n: number): number => {
      const value = countToIndexImplementation(n);

      if (typeof value === "boolean") {
        return value ? 1 : 0;
      }

      return value;
    };

    out.countToIndex = countToIndex;
  }

  return out as Plurals;
}

/**
 * @internal
 */
function parseHeaders(locale: string, text = ""): { headers: Headers, plurals: Plurals } {
  const lines = text.split("\n").map((l) => l.trim());
  const buffer: Record<string, string> = {};
  const headers: Headers = {};

  // Parse the headers not key-value pairs
  for (const l of lines) {
    const [key, value] = l.split(":", 2).map((p) => p.trim());

    if (key && value) {
      buffer[key] = value;
    }
  }

  // Copy the ones that match valid keys
  for (const h of headerKeys) {
    if (buffer[h]) {
      headers[h] = buffer[h];
    }
  }

  const pluralForms = headers["Plural-Forms"];
  const plurals = parsePluralForms(locale, pluralForms);

  return { headers, plurals };
}

export default parseHeaders;
