function escape(text: string) {
  return text.replace(/&/g, '&amp;').replace(/:/g, '&colon;');
}

function toKey(...tokens: unknown[]) {
  return tokens.filter(p => typeof p === 'string').map(escape).join(':');
}

export default toKey;



