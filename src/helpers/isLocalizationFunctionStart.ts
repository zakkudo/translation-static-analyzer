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
 * @param text - A blob of text to act as a haystack
 * @param index - The index to look at for the start of the
 * localization function
 * @return `true` if the index is the start of a y18n style
 * translation function
 * @private
 */
function isLocalizationStart(text : string, {index} : { index : number }) : boolean {
  const testString = text.substring(index, index + length);

  return translationStartPatterns.some((p) => testString.startsWith(p));
}

export default isLocalizationStart;
