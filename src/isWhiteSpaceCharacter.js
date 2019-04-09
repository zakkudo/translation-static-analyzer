const pattern = new RegExp(/^\s$/);

/**
 * Checks for coding whitespace characters
 * @param {String} character - The character pattern to check if is whitespace
 * @return {Boolean} True if the character is a whitespace character such as
 * tab or space
 * @private
 */
module.exports = function isWhiteSpaceCharacter(character) {
  return pattern.test(character);
}
