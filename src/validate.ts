import { LocalizationItem } from 'src/types';

function validate(entry : unknown) : LocalizationItem {
  const o = Object(entry);

  if (!Object.hasOwnProperty.call(o, 'key')) {
    throw new SyntaxError('Entry is missing key, ' + JSON.stringify(o, null, 4))
  }

  if (!o.value && o.value !== '') {
    throw new SyntaxError('Entry is missing value, ' + JSON.stringify(o, null, 4))
  }

  if (Object(o.value) === o.value && !o.plural) {
    throw new SyntaxError('Entry is plural, but has no plural key');
  }

  return o;
}

export default validate;
