const escapeCharacters = new Set([
  `'`,
  '"',
  "`",
  "/*",
  "//"
]);

/**
 * Conveneince function to check for escape character patterns
 * @param character - A character to check in the escape list
 * @return true if the character will cause characters after it to
 * not execute their usual meaning.
 * @private
 */
function isEscapeCharacter(character : string) : boolean {
  return escapeCharacters.has(character);
}

export default isEscapeCharacter;
