import readCharacter from "./readCharacter";

function readCharacterWithErrorHandling(text: string, state: State): State {
  const currentState = Object.assign({}, state);
  let nextState;

  while (nextState === undefined) {
    try {
      nextState = readCharacter(text, currentState);
    } catch (e) {
      if (currentState.stack.length) {
        currentState.stack = currentState.stack.slice(1);
      } else {
        currentState.index += 1;
      }
    }
  }

  return nextState;
}

type State = {
  index: number;
  stack: string[];
  lineNumber: number;
  localizationCall?: LocalizationCall;
};

type LocalizationCall = {
  fn: string;
  lineNumber: number;
  index: number;
};

/**
 * Reads a full string, grabbing all of the localization functions.
 * The function is greedy rewinding to unclosed stack items and then skipping only
 * that one character.
 * @param {String} text - The source code
 * @return {Array<String>} The strings
 * @private
 */
function readString(text: string): LocalizationCall[] {
  let state: State = {
    index: 0,
    stack: [],
    lineNumber: 0,
  };
  let previousIndex = 0;
  const localizationCalls: LocalizationCall[] = [];

  while ((state = readCharacterWithErrorHandling(text, state)) !== null) {
    if (state.index === previousIndex) {
      const serializedState = JSON.stringify(state, null, 4);
      const slice = text.slice(state.index);

      throw new Error(
        `infinite loop detected\n\n${serializedState}\n\n Problem starts here -> ${slice}`
      );
    }

    if (state.localizationCall) {
      const {
        extractedComments,
        msgid,
        msgidPlural,
        msgctxt,
        fn,
      } = state.localizationCall;
      const { index, lineNumber } = state;

      localizationCalls.push([
        {
          fn,
          lineNumber,
          index,
          extractedComments,
          msgid,
          msgidPlural,
          msgctxt,
        },
      ]);
    }

    previousIndex = state.index;
  }

  return localizationCalls;
}

export default readString;
