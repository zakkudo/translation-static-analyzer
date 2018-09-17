const translationStartPatterns = [
    '__(',
    '__`',
    `__n(`,
    '__n`',
    '__p(',
    '__p`',
    `__np(`,
    '__np`',
];

const length = translationStartPatterns
    .reduce((accumulator, p) => Math.max(p.length, accumulator), 0);

/**
 * @param {String} text - A blob of text to act as a haystack
 * @param {Number} index - The index to look at for the start of the
 * localization function
 * @return {Boolean} true if the index is the start of a y18n style
 * translation function
 * @private
 */
module.exports = function isLocalizationStart(text, {index}) {
    const testString = text.substring(index, index + length);

    return translationStartPatterns.some((p) => testString.startsWith(p));
}
