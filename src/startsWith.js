/**
 * @param {String} haystack - The text blob
 * @param {Number} index - The offset of the text to check the start of the needle
 * @param {String} needle - THe substring ot check for
 * @return {Boolean} True if the substring matches the text at the offset
 */
module.exports = function startsWith(haystack, index, needle) {
    return haystack.substring(index, index + needle.length) === needle;
}
