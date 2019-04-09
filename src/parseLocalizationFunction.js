const isQuoteCharacter = require('./isQuoteCharacter');
const isWhiteSpaceCharacter = require('./isWhiteSpaceCharacter');
const isCommentStartCharacter = require('./isCommentStartCharacter');
const peek = require('./peek');
const peekUntil = require('./peekUntil');

function isComment(currentIterator, nextIterator) {
  const {stack, character} = nextIterator;
  const head = stack[0];

  return isCommentStartCharacter(head) || (currentIterator.stack[0] === '/*' && character === '*/');
}

/**
 * @private
 */
function continueToQuoteStart(text, iterator) {
  iterator = peekUntil(text, iterator, (currentIterator, nextIterator) => {
    const {stack, character} = nextIterator;
    const head = stack[0];

    if (isQuoteCharacter(currentIterator.stack[0])) {
      return false;
    }

    if (!isQuoteCharacter(head) && !isComment(currentIterator, nextIterator) && !isWhiteSpaceCharacter(character)) {
      throw new SyntaxError('localization key must be a literal');
    }

    return true;
  });

  return iterator;
}

/**
 * @private
 */
function continueUntilStackLengthIs(text, iterator, length) {
  const readCharacter = require('./readCharacter');

  while ((iterator = readCharacter(text, iterator)) !== null) {
    if (iterator.stack.length <= length) {
      break;
    }
  }

  return iterator;
}

function readPossibleComment(text, iterator) {
  const initialState = iterator;
  const initialStackSize = initialState.stack.length;
  let comments = [];

  iterator = peekUntil(text, iterator, (currentIterator, nextIterator) => {
    if (isCommentStartCharacter(nextIterator.character)) {
      comments.unshift('');
    }

    if (nextIterator.comments) {
      comments[0] = nextIterator.comments;
    }

    if (nextIterator.stack.length < initialStackSize) {
      return false;
    }

    return true;
  });

  if (comments.length) {
    return comments.filter(c => c).reverse().join('\n');
  }

  return null;
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

function forceIncrement(text, iterator, count) {
  const nextIndex = iterator.index + count;

  return Object.assign({}, iterator, {
    index: nextIndex,
    character: text.charAt(nextIndex - 1),
  });
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
module.exports = function parseLocalizationFunction(text, iterator) {
  const functionStart = iterator;
  const initialStackSize = iterator.stack.length;
  let number = false;
  let particular = false;
  let fn = '__';

  iterator = forceIncrement(text, iterator, 2);

  iterator = peek(text, iterator, (nextIterator) => {
    if (nextIterator.character === 'n') {
      fn += 'n';
      number = true;
      return true;
    }
  });

  iterator = peek(text, iterator, (nextIterator) => {
    if (nextIterator.character === 'p') {
      fn += 'p';
      particular = true;
      return true;
    }
  });

  iterator = peek(text, iterator, (nextIterator) => {
    return nextIterator.character === '(';
  });

  const metadata = {number, particular};
  const comments = readPossibleComment(text, iterator);

  if (particular) {
    let context;

    [iterator, context] = readStringArgument(text, iterator, 'context');
    metadata.context = context;

    iterator = peekUntil(text, iterator, (currentIterator, nextIterator) => {
      return isWhiteSpaceCharacter(nextIterator.character);
    });

    iterator = peek(text, iterator, (nextIterator) => {
      return nextIterator.character === ',';
    });
  }

  let key;
  [iterator, key] = readStringArgument(text, iterator, 'key');
  metadata.key = key;

  if (number) {
    let plural;

    iterator = peekUntil(text, iterator, (currentIterator, nextIterator) => {
      return isWhiteSpaceCharacter(nextIterator.character);
    });

    iterator = peek(text, iterator, (nextIterator) => {
      return nextIterator.character === ',';
    });

    [iterator, plural] = readStringArgument(text, iterator, 'plural');
    metadata.plural = plural;

    iterator = peekUntil(text, iterator, (currentIterator, nextIterator) => {
      return isWhiteSpaceCharacter(nextIterator.character);
    });

    iterator = peek(text, iterator, (nextIterator) => {
      return nextIterator.character === ',';
    });
  }

  const functionEnd = (iterator.stack[0] === '(') ?
    continueUntilStackLengthIs(text, {...iterator}, initialStackSize) : iterator;
  const character = text.substring(functionStart.index, functionEnd.index);
  fn += `(${[metadata.context, key, metadata.plural].filter(a => a).map(a => JSON.stringify(a)).join(',')})`;

  const output = Object.assign({}, functionEnd, metadata, {character, fn});

  if (comments) {
    output.comments = comments;
  }

  return output;
}
