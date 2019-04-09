const JSON = require('./JSON');

describe('formats/JSON', () => {
  describe('parse', () => {
    it('parses singlular form', () => {
      expect(JSON.parse(`[{"key": "test key", "value": "test value"}]`)).toEqual([{
        key: 'test key',
        value: 'test value'
      }]);

    });

    it ('throws a SyntaxError when missing key', () => {
      expect(() => JSON.parse(`[{"value": "test localized message"}]`)).toThrow(new SyntaxError(`Entry is missing key, {
    "value": "test localized message"
}`));
    });

    it ('throws a SyntaxError when missing value', () => {
      expect(() => JSON.parse(`[{"key": "test message"}]`)).toThrow(new SyntaxError(`Entry is missing value, {
    "key": "test message"
}`));
    });
  });

  describe('stringify', () => {
    it('serializes the singular form', () => {
      expect(JSON.stringify([{
        key: 'test key',
        value: 'test value'
      }])).toEqual(
`[
    {
        "key": "test key",
        "value": "test value"
    }
]`
);
    });
  });
});
