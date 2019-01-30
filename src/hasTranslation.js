/**
 * @private
 */
function singularHasTranslation(data) {
  return Boolean(data.length);
}

/**
 * @private
 */
function pluralHasTranslation(data) {
  return Object.values(data || {}).some((v) => {
    if (Object(v) === v) {
      return pluralHasTranslation(v);
    }

    return singularHasTranslation(v);
  });
}

/**
 * Checks of a translation key-value pair has been created.
 * @param {*} data - An object that is spidered looking for
 * non-empty translation strings
 * @return {Boolean} true if a translation exists
 * @private
 */
module.exports = function hasTranslation(data) {
  if (typeof data === 'string') {
    return singularHasTranslation(data);
  }

  return pluralHasTranslation(data);
}
