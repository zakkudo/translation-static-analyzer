const escapeCharacters = new Set([
    `'`,
    '"',
    "`",
    "/*",
    "//"
]);

/**
 * Conveneince function to check for escape character patterns
 * @param {String} character - A character to check in the escape list
 * @return {Boolean} true if the character will cause characters after it to
 * not execute their usual meaning.
 * @private
 */
module.exports = function isEscapeCharacter(character) {
    return escapeCharacters.has(character);
}
