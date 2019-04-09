const isEscapeCharacter = require('./isEscapeCharacter');
const isCommentCharacter = require('./isCommentCharacter');
const isLocalizationFunctionStart = require('./isLocalizationFunctionStart');
const isQuoteCharacter = require('./isQuoteCharacter');
const startsWith = require('./startsWith');
const parseLocalizationFunction = require('./parseLocalizationFunction');


function push(stack, value) {
  const copy = [value].concat(stack);

  return {stack: copy, head: copy[0]};
}

function pop(stack) {
  const copy = stack.slice(1);

  return {stack: copy, head: copy[0]};
}

/**
 * @param {String} text - The text blob
 * @param {Number} index - The offset on the text
 * @param {Array<String>} stack - The current code stack
 * @param {Number} lineNumber - The current line number
 * @return {Object} The updated read state which can be passed back into
 * @throws Syntax
 * readCharacter to read the next state
 * @private
 */
function readCharacter(text, iterator = {index: 0, stack: [], lineNumber: 0}) {
  let {index, stack, lineNumber, comments} = iterator;
  let character = text.charAt(index);
  let head = stack[0];
  const escaped = isEscapeCharacter(head);
  let localization;
  let testString;

  if (character === '') {
    while (head === '//') {
      ({head, stack} = pop(stack));
    }

    if (stack.length) {
      throw new SyntaxError(
        'text ended with unclosed stack items',
        JSON.stringify(stack, null, 4)
      );
    }

    return null;
  }

  switch (character) {
    case '_':
      if (!escaped) {
        if (isLocalizationFunctionStart(text, {index})) {
          ({
            character,
            index,
            stack,
            lineNumber,
            ...localization
          } = parseLocalizationFunction(text, {index, stack, lineNumber}));
        } else {
          index += 1;
        }
      } else {
        index += 1;
      }
      break;
    case '<': //EJS style template strings
      if (isQuoteCharacter(head) && startsWith(text, index, '<%')) {
        ({head, stack} = push(stack, '<%'));
        character = '<%';
        index += 2;
      } else {
        index += 1;
      }
      break;
    case '%':
      if (head === '<%' && startsWith(text, index, '%>')) {
        ({head, stack} = pop(stack));
        character = '%>';
        index += 2;
      } else {
        index += 1;
      }
      break;
    case '[': //Polymer style template strings
      if (isQuoteCharacter(head) && startsWith(text, index, '[[')) {
        ({head, stack} = push(stack, '[['));
        character = '[[';
        index += 2;
      } else {
        index += 1;
      }
      break;
    case ']':
      if (head === '[[' && startsWith(text, index, ']]')) {
        ({head, stack} = pop(stack));
        character = ']]';
        index += 2;
      } else {
        index += 1;
      }
      break;
    case '$': //Native javscript template strings
      if (head === '`' && startsWith(text, index, '${')) {
        ({head, stack} = push(stack, '${'));
        character = '${';
        index += 2;
      } else {
        index += 1;
      }
      break;
    case '{': //Angular style template strings
      if (isQuoteCharacter(head) && startsWith(text, index, '{{')) {
        ({head, stack} = push(stack, '{{'));
        character = '{{';
        index += 2;
      } else {
        index += 1;
      }
      break;
    case '}':
      if (head === '{{' && startsWith(text, index, '}}')) {
        ({head, stack} = pop(stack));
        character = '}}';
        index += 2;
      } else if (head === '${' && startsWith(text, index, '}')) {
        ({head, stack} = pop(stack));
        index += 1;
      } else {
        index += 1;
      }
      break;
    case '*':
      if (head === '/*' && startsWith(text, index, '*/')) {
        ({head, stack} = pop(stack));
        character = '*/';
        index += 2;
      } else {
        index += 1;
      }
      break;
    case '/':
      testString = text.substring(index, index + 2);

      if (!escaped && testString === '//') {
        ({head, stack} = push(stack, testString));
        comments = '';
        character = '//';
        index += 2;
      } else if (!escaped && testString === '/*') {
        ({head, stack} = push(stack, testString));
        comments = '';
        character = '/*';
        index += 2;
      } else {
        index += 1;
      }

      break;
    case '`':
    case '"':
    case `'`:
      if (head === character) {
        ({head, stack} = pop(stack));
        index += 1;
      } else if (!escaped) {
        ({head, stack} = push(stack, character));
        index += 1;
      } else {
        index += 1;
      }
      break;
    case '(':
      if (!escaped) {
        ({head, stack} = push(stack, character));
      }
      index += 1;
      break;
    case ')':
      if (!escaped) {
        if (head === '(') {
          ({head, stack} = pop(stack));
        } else {
          throw new SyntaxError('missing matching opening brace');
        }
      }
      index += 1;
      break;
    case '\n':
      if (head === '//') {
        ({head, stack} = pop(stack));
        comments = null;
      }
      index += 1;
      lineNumber += 1;
      break;
    default:
      index += 1;
      break;
  }

  if (isCommentCharacter(head) && !isCommentCharacter(character)) {
    comments += character;
  }

  if (!isCommentCharacter(head) && typeof comments === 'string' && character !== '*/') {
    comments = null;
  }

  const output = {index, stack, lineNumber, character};

  if (localization) {
    output.localization = localization
  }

  if (comments !== null && comments !== undefined) {
    output.comments = comments;
  }

  return output;
}
module.exports = readCharacter;
