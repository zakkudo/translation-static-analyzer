const isQuoteCharacter = require('./isQuoteCharacter');
const isWhiteSpaceCharacter = require('./isWhiteSpaceCharacter');

/**
 * @private
 */
function continueToQuoteStart(text, state) {
    const readCharacter = require('./readCharacter');

    while ((state = readCharacter(text, state)) !== null) {
        const character = text.charAt(state.index);

        if (isQuoteCharacter(state.stack[0])) {
            break;
        }

        if (!isQuoteCharacter(character) && !isWhiteSpaceCharacter(character)) {
            throw new SyntaxError('localization key must be a literal');
        }
    }

    return state;
}

/**
 * @private
 */
function continueUntilStackLengthIs(text, state, length) {
    const readCharacter = require('./readCharacter');

    while ((state = readCharacter(text, state)) !== null) {
        if (state.stack.length <= length) {
            break;
        }
    }

    return state;
}

/**
 * Parses the information from a localization function, include the function string,
 * the key, the line number.
 * @param {String} text - The text blob
 * @param {Number} index - The offset on the text
 * @param {Array<String>} stack The current code stack
 * @param {Number} lineNumber - The current line number
 * @return {Object} An object with the translation key and function, as well
 * as the new index after the translation function
 * @private
 */
module.exports = function parseLocalizationFunction(text, {index, stack, lineNumber}) {
    const functionStart = {index, stack, lineNumber};

    index += 1;

    if (text.charAt(index + 1) === 'n') {
        index += 1;
    }

    if (text.charAt(index + 1) === '(') {
        index += 1;

    }

    const keyStart = continueToQuoteStart(text, {index, stack, lineNumber});
    const keyEnd = continueUntilStackLengthIs(text, {...keyStart}, keyStart.stack.length - 1);

    if (keyStart.index === keyEnd.index - 1) {
        throw new SyntaxError('empty localization key');
    }

    const functionEnd = (keyEnd.stack[0] === '(') ?
        continueUntilStackLengthIs(text, {...keyEnd}, keyEnd.stack.length - 1) : keyEnd;

    return {
        ...functionEnd,
        key: text.substring(keyStart.index, keyEnd.index - 1),
        fn: text.substring(functionStart.index, functionEnd.index),
    };
}
