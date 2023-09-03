export type LocalizationItem = {
  developerComments?: string;
  extractedComments?: string;
  flags: string[];
  msgctxt: string;
  msgid?: string;
  msgidPlural?: string;
  msgstr: string[];
  previousMsgid?: string;
  sourceReferences: { filename: string; lineNumber: number }[];
  translatorComments?: string;
  key?: string;
  status: "existing" | "unused" | "new";
};
