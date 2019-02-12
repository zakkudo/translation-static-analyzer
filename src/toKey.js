function escape(text) {
  return text.replace(/&/g, '&amp;').replace(/:/g, '&colon;');
}

function toKey(...tokens) {
  return tokens.filter(p => typeof p === 'string').map(escape).join(':');
}

module.exports = toKey;



