const readCharacter = require('./readCharacter');

function readCharacterWithErrorHandling(text, iterator) {
  let currentIterator = Object.assign({}, iterator);
  let nextIterator;

  while (nextIterator === undefined && iterator.index < text.length) {
    try {
      nextIterator = readCharacter(text, currentIterator);
    } catch (e) {

      if (currentIterator.stack.length) {
        currentIterator.stack = currentIterator.stack.slice(1);
      } else {
        currentIterator.index += 1;
      }
    }
  }

  return nextIterator || null;
}

/**
 * Reads a full string, grabbing all of the localization functions.
 * The function is greedy rewinding to unclosed stack items and then skipping only
 * that one character.
 * @param {String} text - The source code
 * @return {Array<String>} The strings
 * @private
 */
module.exports = function readString(text) {
  const localization = [];
  let iterator = {
    index: 0,
    stack: [],
    lineNumber: 0,
  };
  let previousIndex = 0;
  let previousStackLength = 0;
  let iteratorWithComment = {};

  while ((iterator = readCharacterWithErrorHandling(text, iterator)) !== null) {
    if (iterator.index === previousIndex && iterator.stack.length === previousStackLength) {
      const serializedState = JSON.stringify(iterator, null, 4);
      const slice = text.slice(iterator.index);

      throw new Error(
        `infinite loop detected\n\n${serializedState}\n\n Problem starts here -> ${slice}`
      );
    }

    if (iterator.comments) {
      iteratorWithComment = iterator;
    }

    if (iterator.localization) {
      const { comments, ...leftover } = iterator.localization;
      const {index, lineNumber} = iterator;
      const newLocalization = Object.assign({}, leftover, {index, lineNumber});

      if (comments) {
        newLocalization.comments = comments;
      } else if (iteratorWithComment.lineNumber + 1 === iterator.lineNumber) {
        newLocalization.comments = iteratorWithComment.comments;
      }

      localization.push(newLocalization);
    }

    previousIndex = iterator.index;
    previousStackLength = iterator.stack.length;
  }

  return localization;
}

