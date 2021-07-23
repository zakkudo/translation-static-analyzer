const quoteCharacters = new Set([
  "'",
  '"',
  "`"
]);

/**
 * Convenience method for checking for quote characters.
 * @param character - A character pattern to check if is a quote
 * @return `true` if it is a quote character for javascript
 * @private
 */
function isQuoteCharacter(character : string) : boolean {
  return quoteCharacters.has(character);
}

export default isQuoteCharacter;
