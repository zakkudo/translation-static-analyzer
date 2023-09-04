import console from "node:console";
import { ValidationError } from "src/errors";
import { LocalizationItem } from "src/types";

function validate(entry: unknown): LocalizationItem {
  const o = Object(entry);

  if (!Object.hasOwnProperty.call(o, "msgid")) {
    console.error(o);
    throw new ValidationError("Entry is missing msgid", o);
  }

  if (!o.msgstr && o.msgstr !== "") {
    console.error(o);
    throw new ValidationError("Entry is missing msgstr", o);
  }

  if (Object(o.msgstr) === o.msgstr && !o.msgidPlural) {
    console.error(o);
    throw new ValidationError(
      "Entry is msgidPlural, but has no msgidPlural msgid",
      o,
    );
  }

  return o;
}

export default validate;
