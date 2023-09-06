import { ReadIterator } from "src/types";
import readCharacter from "./readCharacter";

const peekUntil = (
  text: string,
  iterator: ReadIterator,
  fn: (i1: ReadIterator, i2: ReadIterator) => boolean,
): ReadIterator => {
  let nextIterator = readCharacter(text, iterator);

  while (nextIterator && fn(iterator, nextIterator)) {
    iterator = nextIterator;
    nextIterator = readCharacter(text, iterator);
  }

  return iterator;
};

export default peekUntil;
