import readCharacter from './readCharacter';

function peek(text, iterator, fn) {
  const nextIterator = readCharacter(text, iterator);

  if (fn(nextIterator)) {
    return nextIterator;
  }

  return iterator;
}

export default peek;
