import { LocalizationItem } from "src/types";

function validate(entry: unknown): LocalizationItem {
  const o = Object(entry);

  if (!Object.hasOwnProperty.call(o, "msgid")) {
    throw new SyntaxError(
      "Entry is missing msgid, " + JSON.stringify(o, null, 4),
    );
  }

  if (!o.msgstr && o.msgstr !== "") {
    throw new SyntaxError(
      "Entry is missing msgstr, " + JSON.stringify(o, null, 4),
    );
  }

  if (Object(o.msgstr) === o.msgstr && !o.msgidPlural) {
    throw new SyntaxError("Entry is msgidPlural, but has no msgidPlural msgid");
  }

  return o;
}

export default validate;
