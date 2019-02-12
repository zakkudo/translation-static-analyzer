function unescape(text) {
  return text.replace(/&colon;/g, ':').replace(/&amp;/g, '&');
}

function fromKey(key) {
  return key.split(':').filter(p => p).map(unescape);
}

module.exports = fromKey;



