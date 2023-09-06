/**
 * @param haystack - The text blob
 * @param index - The offset of the text to check the start of the needle
 * @param needle - THe substring ot check for
 * @return True if the substring matches the text at the offset
 * @internal
 */
const startsWith = (
  haystack: string,
  index: number,
  needle: string,
): boolean => {
  return haystack.substring(index, index + needle.length) === needle;
};

export default startsWith;
