
function peek(text, iterator, fn) {
  const readCharacter = require('./readCharacter');
  const nextIterator = readCharacter(text, iterator);

  if (fn(nextIterator)) {
    return nextIterator;
  }

  return iterator;
}

module.exports = peek;
