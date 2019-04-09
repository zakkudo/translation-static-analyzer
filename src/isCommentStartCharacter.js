const commentCharacters = new Set([
  "//",
  '/*'
]);

/**
 * Convenience method for checking for comments characters.
 * @param {String} character - A character pattern to check if is a comments
 * @return {Boolean} True if it is a comments character for javascript
 * @private
 */
module.exports = function isCommentStartCharacter(character) {
  return commentCharacters.has(character);
}
