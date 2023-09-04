import { LocalizationItem } from "src/types";
/*
  #  translator-comments
  #. extracted-comments
  #: reference…
  #, flag…
  #| msgid previous-untranslated-string
  msgid untranslated-string
  msgstr translated-string
  */
import validate from "../validate";

class JSONFormat {
  static parse(text: string): LocalizationItem {
    return JSON.parse(text).map(validate);
  }

  static stringify(data: LocalizationItem[]) {
    data.forEach((d) => {
      validate(d);
    });

    return JSON.stringify(data, null, 4);
  }
}

export default JSONFormat;
