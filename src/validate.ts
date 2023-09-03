function validate(entry) {
  if (!entry.hasOwnProperty('key')) {
    throw new SyntaxError('Entry is missing key, ' + JSON.stringify(entry, null, 4))
  }

  if (!entry.value && entry.value !== '') {
    throw new SyntaxError('Entry is missing value, ' + JSON.stringify(entry, null, 4))
  }

  if (Object(entry.value) === entry.value && !entry.plural) {
    throw new SyntaxError('Entry is plural, but has no plural key');
  }

  return entry;
}

export default validate;
