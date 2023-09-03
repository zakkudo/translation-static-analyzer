import isEscapeCharacter from "../isEscapeCharacter";
import isLocalizationFunctionStart from "../isLocalizationFunctionStart";
import isQuoteCharacter from "../isQuoteCharacter";
import startsWith from "../startsWith";
import parseLocalizationFunction from "../parseLocalizationFunction";

type FunctionMapping = {
  gettext: string;
  ngettext: string;
  npgettext: string;
  pgettext: string;
};

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

function push(stack: string[], value: string) {
  const copy = [value].concat(stack);

  return { stack: copy, head: copy[0] };
}

function pop(stack: string[]) {
  const copy = stack.slice(1);

  return { stack: copy, head: copy[0] };
}

type Stack = {
  index: number;
  stack: string[];
  lineNumber: number;
};

/**
 * @param text - The text blob
 * @param index - The offset on the text
 * @param stack - The current code stack
 * @param lineNumber - The current line number
 * @return The updated read state which can be passed back into
 * @throws Syntax
 * readCharacter to read the next state
 * @private
 */
function readCharacter(text: string, { index, stack, lineNumber }: Stack, gettextFuntionNames : FunctionMapping) : State {
  const character = text.charAt(index);
  let head = stack[0];
  const escaped = isEscapeCharacter(head);
  let testString;
  let localizationCall: string = null;

  const gettextStrings = Object.values(gettextFuntionNames);
  const mapping = new Map(Object.entries(gettextFuntionNames).map(([a, b]) => [b, a]));

  if (character === "") {
    while (head === "//") {
      ({ head, stack } = pop(stack));
    }

    if (stack.length) {
      throw new SyntaxError(
        `text ended with unclosed stack items ${JSON.stringify(stack, null, 4)}`
      );
    }

    return null;
  }

  if (startsWith()) {
    something
  }

  switch (character) {
    default:
      // check if translation function, if not do something else
      if (!escaped) {
        if (isLocalizationFunctionStart(text, { index })) {
          ({ fn: localizationCall } = parseLocalizationFunction(text, {
            index,
            stack,
            lineNumber,
          }));
        } else {
          index += 1;
        }
      } else {
        index += 1;
      }
      break;
    case "<": //EJS style template strings
      if (isQuoteCharacter(head) && startsWith(text, index, "<%")) {
        ({ head, stack } = push(stack, "<%"));
        index += 2;
      } else {
        index += 1;
      }
      break;
    case "%":
      if (head === "<%" && startsWith(text, index, "%>")) {
        ({ head, stack } = pop(stack));
        index += 2;
      } else {
        index += 1;
      }
      break;
    case "[": //Polymer style template strings
      if (isQuoteCharacter(head) && startsWith(text, index, "[[")) {
        ({ head, stack } = push(stack, "[["));
        index += 2;
      } else {
        index += 1;
      }
      break;
    case "]":
      if (head === "[[" && startsWith(text, index, "]]")) {
        ({ head, stack } = pop(stack));
        index += 2;
      } else {
        index += 1;
      }
      break;
    case "$": //Native javscript template strings
      if (head === "`" && startsWith(text, index, "${")) {
        ({ head, stack } = push(stack, "${"));
        index += 2;
      } else {
        index += 1;
      }
      break;
    case "{": //Angular style template strings
      if (isQuoteCharacter(head) && startsWith(text, index, "{{")) {
        ({ head, stack } = push(stack, "{{"));
        index += 2;
      } else {
        index += 1;
      }
      break;
    case "}":
      if (head === "{{" && startsWith(text, index, "}}")) {
        ({ head, stack } = pop(stack));
        index += 2;
      } else if (head === "${" && startsWith(text, index, "}")) {
        ({ head, stack } = pop(stack));
        index += 1;
      } else {
        index += 1;
      }
      break;
    case "*":
      if (head === "/*" && startsWith(text, index, "*/")) {
        ({ head, stack } = pop(stack));
        index += 2;
      } else {
        index += 1;
      }
      break;
    case "/":
      testString = text.substring(index, index + 2);

      if (!escaped && testString === "//") {
        ({ head, stack } = push(stack, testString));
        index += 2;
      } else if (!escaped && testString === "/*") {
        ({ head, stack } = push(stack, testString));
        index += 2;
      } else {
        index += 1;
      }

      break;
    case "`":
    case '"':
    case `'`:
      if (head === character) {
        ({ head, stack } = pop(stack));
        index += 1;
      } else if (!escaped) {
        ({ head, stack } = push(stack, character));
        index += 1;
      } else {
        index += 1;
      }
      break;
    case "(":
      if (!escaped) {
        ({ head, stack } = push(stack, character));
      }
      index += 1;
      break;
    case ")":
      if (!escaped) {
        if (head === "(") {
          ({ head, stack } = pop(stack));
        } else {
          throw new SyntaxError("missing matching opening brace");
        }
      }
      index += 1;
      break;
    case "\n":
      if (head === "//") {
        ({ head, stack } = pop(stack));
      }
      index += 1;
      lineNumber += 1;
      break;
  }

  return { index, stack, lineNumber, localizationCall };
}
export default readCharacter;
