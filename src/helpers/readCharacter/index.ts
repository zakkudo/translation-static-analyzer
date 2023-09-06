import isEscapeCharacter from "../isEscapeCharacter";
import isLocalizationFunctionStart from "../isLocalizationFunctionStart";
import isQuoteCharacter from "../isQuoteCharacter";
import parseLocalizationFunction from "../parseLocalizationFunction";
import startsWith from "../startsWith";

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

  return { head: copy[0], stack: copy };
}

function pop(stack: string[]) {
  const copy = stack.slice(1);

  return { head: copy[0], stack: copy };
}

type Stack = {
  index: number;
  stack: string[];
  lineNumber: number;
};

/**
 * @param text - The text blob
 * @param stack - The current iteration context
 * @param stack.index - The offset on the text
 * @param stack.lineNumber - The current line number
 * @param stack.stack - The parenthesis and quote stack
 * @return The updated read state which can be passed back into
 * @throws Syntax
 * readCharacter to read the next state
 * @private
 */
function readCharacter(
  text: string,
  { index, lineNumber, stack }: Stack,
): State {
  const character = text.charAt(index);
  let head = stack[0];
  const escaped = isEscapeCharacter(head);
  let testString;
  let localizationCall: string = null;

  if (character === "") {
    while (head === "//") {
      ({ head, stack } = pop(stack));
    }

    if (stack.length) {
      throw new SyntaxError(
        `text ended with unclosed stack items ${JSON.stringify(
          stack,
          null,
          4,
        )}`,
      );
    }

    return null;
  }

  switch (character) {
    default:
      // check if translation function, if not do something else
      if (!escaped) {
        if (isLocalizationFunctionStart(text, { index })) {
          ({ fn: localizationCall } = parseLocalizationFunction(text, {
            index,
            lineNumber,
            stack,
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

  return { index, lineNumber, localizationCall, stack };
}
export default readCharacter;
