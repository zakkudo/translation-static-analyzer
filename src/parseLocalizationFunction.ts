import isQuoteCharacter from './isQuoteCharacter';
import isWhiteSpaceCharacter from './isWhiteSpaceCharacter';
import readCharacter from './readCharacter';

function continueToCommentStart(text : string, state : State) {
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
function continueToQuoteStart(text : string, state : State) {
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
function continueUntilStackLengthIs(text : string, state : State, length : number) {
  while ((state = readCharacter(text, state)) !== null) {
    if (state.stack.length <= length) {
      break;
    }
  }

  return state;
}

function tryReadExtractedComment(text : string, {index, stack, lineNumber} : State, name : string) {
  if (head === '/*' || head === '//') {
  }
  /* TODO
  const start = continueToQuoteStart(text, {index, stack, lineNumber});
  const end = continueUntilStackLengthIs(text, {...start}, start.stack.length - 1);
  const stringArgument = text.substring(start.index, end.index - 1);

  if (start.index === end.index - 1) {
    throw new SyntaxError(`${name} string argument is empty`);
  }

  return [end, stringArgument];
  */
}

function readStringArgument(text : string, {index, stack, lineNumber} : State, name : string) {
  const start = continueToQuoteStart(text, {index, stack, lineNumber});
  const end = continueUntilStackLengthIs(text, {...start}, start.stack.length - 1);
  const stringArgument = text.substring(start.index, end.index - 1);

  if (start.index === end.index - 1) {
    throw new SyntaxError(`${name} string argument is empty`);
  }

  return [end, stringArgument];
}

type Metadata = {
  msgctxt: string;
  msgid: string;
  msgidPlural?: string
  extractedComments: string[],
  fn: string;
};

type State = { index : number, stack : string[], lineNumber : number };

/**
 * Parses the information from a localization function, include the function string,
 * the key, the line number. Parses __, __n, __p, __np.
 * @param text - The text blob
 * @param index - The offset on the text
 * @param stack The current code stack
 * @param stack.lineNumber - The current line number
 * @return An object with the translation key and function, as well
 * as the new index after the translation function
 * @internal
 */
function parseLocalizationFunction(text : string, {index, stack, lineNumber} : State) : Metadata {
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
    //tryReadExtractedComment();
    let msgctxt;
    [state, msgctxt] = readStringArgument(text, state, 'msgctxt');
    metadata.msgctxt = msgctxt;
  }

  //tryReadExtractedComment();

  let msgid;
  [state, msgid] = readStringArgument(text, state, 'msgid');
  metadata.msgid = msgid;

  if (plural) {
    //tryReadExtractedComment();
    let msgidPlural;
    [state, msgPlural] = readStringArgument(text, state, 'msgidPlural');
    metadata.msgPlural = msgidPlural;

  }

  //tryReadExtractedComment();

  const functionEnd = (state.stack[0] === '(') ?
    continueUntilStackLengthIs(text, {...state}, state.stack.length - 1) : state;
  const fn = text.substring(functionStart.index, functionEnd.index);
  metadata.fn = fn;

  return Object.assign({}, functionEnd, metadata);
}

export default parseLocalizationFunction;
