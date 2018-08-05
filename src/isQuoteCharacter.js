const quoteCharacters = new Set([
    "'",
    '"',
    "`"
]);

/**
 * Convenience method for checking for quote characters.
 * @param {String} character - A character pattern to check if is a quote
 * @return {Boolean} True if it is a quote character for javascript
 * @private
 */
module.exports = function isQuoteCharacter(character) {
    return quoteCharacters.has(character);
}
