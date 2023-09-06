import { ReadIterator } from "src/types";
import readCharacter from "./readCharacter";

const peek = (
  text: string,
  iterator: ReadIterator,
  fn: (iterator: ReadIterator) => boolean,
) : ReadIterator => {
  const nextIterator = readCharacter(text, iterator);

  if (fn(nextIterator)) {
    return nextIterator;
  }

  return iterator;
}

export default peek;
