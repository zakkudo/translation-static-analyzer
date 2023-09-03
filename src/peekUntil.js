import readCharacter from './readCharacter';

function peekUntil(text, iterator, fn) {
  let nextIterator = readCharacter(text, iterator);

  while (nextIterator && fn(iterator, nextIterator)) {
    iterator = nextIterator;
    nextIterator = readCharacter(text, iterator);
  }

  return iterator;
}

export default peekUntil;
