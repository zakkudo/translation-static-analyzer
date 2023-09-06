const unescape = (text:string) : string => {
  return text.replace(/&colon;/g, ':').replace(/&amp;/g, '&');
}

const fromKey = (key : string) : [string, string] => {
  const parts = key.split(':').filter(p => p).map(unescape);

  return [parts[0], parts[1]];
}

export default fromKey;



