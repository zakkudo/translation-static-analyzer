export type FormattedLocalizationItem = Record<
  string,
  string | Record<string, string>
>;

export type Plurals = {
  length: number;
  countToIndex: (count: number) => number;
};

const headers: (keyof Headers)[] = [
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
];

export type Headers = Partial<{
  "Project-Id-Version": string;
  "POT-Creation-Date": string;
  "PO-Revision-Date": string;
  "Language-Team": string;
  "MIME-Version": string;
  "Content-Type": string;
  "Content-Transfer-Encoding": string;
  "X-Generator": string;
  "Last-Translator": string;
  /** @example
   * Contains the information used for generating the Plurals
   * type.
   * ```
   * Plural-Forms: nplurals=2; plural=n == 1 ? 0 : 1;
   * ```*/
  "Plural-Forms": string;
  Language: string;
}>;

type LocalizationItemSingular = {
  /** Comments extracted from the source code for the translators. */
  developerComments?: string;
  /** Flags for the translation.  In particular it is used to mark translations fuzzy. */
  flags?: string[];
  /** Extra context for a translation to differenciate it. */
  msgctxt?: string;
  msgid: string;
  msgidPlural?: undefined;
  msgstr?: string;
  previous?: {
    msgid?: string;
    msgctxt?: string;
  };
  sourceReferences?: { filename: string; lineNumber: number }[];
  translatorComments?: string;
};

type LocalizationItemPlural = {
  developerComments?: string;
  flags?: string[];
  msgctxt?: string;
  msgid: string;
  msgidPlural: string;
  previous?: {
    msgid?: string;
    msgctxt?: string;
    msgidPlural?: string;
  };
  msgstr?: Record<string, string>;
  sourceReferences?: { filename: string; lineNumber: number }[];
  translatorComments?: string;
};

export type LocalizationItem =
  | LocalizationItemSingular
  | LocalizationItemPlural;

type LocalizationCall = {
  fn: string;
  lineNumber: number;
  index: number;
};

export type ReadIterator = Readonly<{
  index: number;
  stack: string[];
  lineNumber: number;
  localizationCall?: LocalizationCall
}>;
