import toKey from "src/helpers/toKey";
import {
  type FormattedLocalizationItem,
  type LocalizationItem,
} from "src/types";

/**
 * Compresses the translation for use by code, removing any extra context information
 * when not needed. (If there is only a default context, the context object is removed
 * and the translation is linked directly to the key for example.)
 * @private
 */
function formatLocalization(
  localization: LocalizationItem,
): FormattedLocalizationItem {
  return Object.entries(
    localization.reduce((accumulator, l) => {
      const key = toKey(l.key, l.plural);
      const context = l.context || "default";
      const value = Object.assign({}, accumulator[key] || {}, {
        [context]: l.value,
      });

      return Object.assign({}, accumulator, { [key]: value });
    }, {}),
  ).reduce((accumulator, [key, value]) => {
    const keys = new Set(Object.keys(value));

    if (keys.size === 1 && keys.has("default")) {
      return Object.assign({}, accumulator, { [key]: value.default });
    }

    return Object.assign({}, accumulator, { [key]: value });
  }, {});
}

function formatLocalizations(localizations) {
  return Object.entries(localizations).reduce(
    (accumulator, [locale, localization]) => {
      return Object.assign({}, accumulator, {
        [locale]: formatLocalization(localization),
      });
    },
    {},
  );
}
