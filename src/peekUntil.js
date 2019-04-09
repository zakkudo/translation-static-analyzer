
function peekUntil(text, iterator, fn) {
  const readCharacter = require('./readCharacter');
  let nextIterator = readCharacter(text, iterator);

  while (nextIterator && fn(iterator, nextIterator)) {
    iterator = nextIterator;
    nextIterator = readCharacter(text, iterator);
  }

  return iterator;
}

module.exports = peekUntil;
