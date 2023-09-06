const whiteSpaceCharacters = new Set([
  ' ',
  '   ',
]);

/**
 * Checks for coding whitespace characters
 * @param character - The character pattern to check if is whitespace
 * @return `true` if the character is a whitespace character such as
 * tab or space
 * @private
 */
function isWhiteSpaceCharacter(character : string) : boolean {
  return whiteSpaceCharacters.has(character);
}

export default isWhiteSpaceCharacter;
