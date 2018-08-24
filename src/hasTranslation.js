/**
 * Checks of a translation key-value pair has been created.
 * @param {*} data - An object that is spidered looking for
 * non-empty translation strings
 * @return {Boolean} true if a translation exists
 * @private
 */
module.exports = function hasTranslation(data) {
    if (Object(data) === data) {
        const keys = Object.keys(data);

        if (!keys.length) {
            return false;
        }

        return keys.some((k) => {
            if (typeof data[k] === 'string') {
                return Boolean(data[k].length);
            } else {
                return hasTranslation(data[k]);
            }
        });
    } else if (typeof data === 'string') {
        return Boolean(data.length);
    }

    return false;
}
