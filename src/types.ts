type LocalizationItemSingular = {
  developerComments?: string;
  flags: string[];
  msgctxt: string;
  msgid?: string;
  msgidPlural?: undefined;
  msgstr: string;
  sourceReferences: { filename: string; lineNumber: number }[];
  translatorComments?: string;
  status?: "existing" | "unused" | "new";
};

type LocalizationItemPlural = {
  developerComments?: string;
  flags: string[];
  msgctxt: string;
  msgid?: string;
  msgidPlural: string;
  msgstr: Record<string, string>;
  sourceReferences: { filename: string; lineNumber: number }[];
  translatorComments?: string;
  status?: "existing" | "unused" | "new";
};

export type LocalizationItem =
  | LocalizationItemSingular
  | LocalizationItemPlural;
