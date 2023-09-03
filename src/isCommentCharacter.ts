const commentCharacters = new Set([
  "/*",
  "//"
]);

/**
 * Conveneince function to check for comments character patterns
 * @param {String} character - A character to check in the comments list
 * @return {Boolean} true if the character will cause characters after it to
 * not execute their usual meaning.
 * @private
 */
export default function isCommentCharacter(character) {
  return commentCharacters.has(character);
}
