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

function readStringArgument(text, {index, stack, lineNumber}, name) {
    const start = continueToQuoteStart(text, {index, stack, lineNumber});
    const end = continueUntilStackLengthIs(text, {...start}, start.stack.length - 1);
    const stringArgument = text.substring(start.index, end.index - 1);

    if (start.index === end.index - 1) {
        throw new SyntaxError(`${name} string argument is empty`);
    }

    return [end, stringArgument];
}

/**
 * Parses the information from a localization function, include the function string,
 * the key, the line number. Parses __, __n, __p, __np.
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
    let plural = false;
    let particular = false;

    index += 1;

    if (text.charAt(index + 1) === 'n') {
        plural = true;
        index += 1;
    }

    if (text.charAt(index + 1) === 'p') {
        particular = true;
        index += 1;
    }

    if (text.charAt(index + 1) === '(') {
        index += 1;
    }

    const metadata = {plural, particular};
    let state = {index, stack, lineNumber};

    if (particular) {
        let context;
        [state, context] = readStringArgument(text, state, 'context');
        metadata.context = context;
    }

    let key;
    [state, key] = readStringArgument(text, state, 'key');
    metadata.key = key;

    const functionEnd = (state.stack[0] === '(') ?
        continueUntilStackLengthIs(text, {...state}, state.stack.length - 1) : state;
    const fn = text.substring(functionStart.index, functionEnd.index);
    metadata.fn = fn;

    return Object.assign({}, functionEnd, metadata);
}
