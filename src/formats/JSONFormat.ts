class JSONFormat {
  parse(text : string) LocalizationFormat {
  }

  stringify(data) {
  }
}

export default JSONFormat;



type LocalizationFormat = LocalizationFormatItem[];
};

type LocalizationFormatItem = {
  developerComments?: string;
  extractedComments?: string;
  flags: string[];
  msgctxt: string;
  msgid?: string;
  msgidPlural?: string;
  msgstr: string[];
  previousMsgid?: string;
  sourceReferences: string[];
  translatorComments?: string;
  key?: string;
};
