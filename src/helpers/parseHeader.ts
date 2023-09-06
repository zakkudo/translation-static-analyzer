type Plurals = {
  length?: number;
  countToIndex?: (count: number) => number;
};

type Headers = {
  plurals: Plurals;
  "Project-Id-Version"?: string;
  "POT-Creation-Date"?: string;
  "PO-Revision-Date"?: string;
  "Language-Team"?: string;
  "MIME-Version"?: string;
  "Content-Type"?: string;
  "Content-Transfer-Encoding"?: string;
  "X-Generator"?: string;
  "Last-Translator"?: string;
  "Plural-Forms": string;
  Language?: string;
};

/**
 * @internal
 */
function parsePluralForms(locale: string, text = ""): Plurals {
  const [nplurals, plural] = `${text};`.split(";").map((p) => p.trim());
  const length = parseInt((nplurals.match(/nplurals=([0-9]+)/) || [])[1]);
  const pluralValue = (plural.match(/plural=([^;]+)/) || [])[1];

  const out: Plurals = {};

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

  return out;
}

/**
 * @internal
 */
function parseHeaders(locale: string, text = ""): Headers {
  const lines = text.split("\n").map((l) => l.trim());
  const headers: Record<string, string> = {};

  for (const l of lines) {
    const [key, value] = l.split(":", 2).map((p) => p.trim());

    if (key && value) {
      headers[key] = value;
    }
  }

  const pluralForms = headers["Plural-Forms"];
  const plurals = parsePluralForms(locale, pluralForms);

  return { headers, plurals };
}

export default parseHeaders;
