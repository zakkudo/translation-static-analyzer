const commentCharacters = new Set([
  "/*",
  "//"
]);

/**
 * Convenient function to check for comments character patterns
 * @param character - A character to check in the comments list
 * @returns true if the character will cause characters after it to
 * not execute their usual meaning.
 * @private
 */
export default function isCommentCharacter(character : string) : boolean {
  return commentCharacters.has(character);
}
