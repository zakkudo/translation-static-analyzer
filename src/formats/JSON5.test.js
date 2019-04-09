const JSON5 = require('./JSON5');

describe('formats/JSON5', () => {
  describe('parse', () => {
    it('unescapes escaped characters', () => {
      expect(JSON5.parse(
`{
  "one&colon;two&amp;three": {
    // Notes
    //. Test comments
    //, src/Application/index.js:40
    "default": "localized about",
  }
}`
      )).toEqual([{
        comments: 'Test comments',
        context: 'default',
        key: 'one:two&three',
        notes: 'Notes',
        value: 'localized about'
      }]);
    });

    it('parses singlular form', () => {
      expect(JSON5.parse(
`{
  "about": {
    // Notes
    //. Test comments
    //, src/Application/index.js:40
    "default": "localized about",
  }
}`
      )).toEqual([{
        comments: 'Test comments',
        context: 'default',
        key: 'about',
        notes: 'Notes',
        value: 'localized about'
      }]);
    });

    it('parses block comments', () => {
      expect(JSON5.parse(
`{
  "about": {
    /* Notes
continued*/
    //. Test comments
    //, src/Application/index.js:40
    "default": "localized about",
  }
}`
      )).toEqual([{
        comments: 'Test comments',
        context: 'default',
        key: 'about',
        notes: 'Notes\ncontinued',
        value: 'localized about'
      }]);
    });

    it('simple form', () => {
      expect(JSON5.parse(
`{
  "about": {
    "default": "localized about",
  }
}`
      )).toEqual([{
        context: 'default',
        key: 'about',
        value: 'localized about'
      }]);
    });

    it('with context', () => {
      expect(JSON5.parse(
`{
  "about": {
    "test context": "localized about",
  }
}`
      )).toEqual([{
        context: 'test context',
        key: 'about',
        value: 'localized about'
      }]);
    });

    it('parses plural', () => {
      expect(JSON5.parse(
`{
  "test key:test plural": {
    "test context": {"1": "localized singular", "2": "localized plural"}
  }
}`
      )).toEqual([{
        context: 'test context',
        key: 'test key',
        plural: 'test plural',
        value: {
          "1": 'localized singular',
          "2": 'localized plural',
        }
      }]);
    });
  });

  describe('stringify', () => {
    it('escapes special characters', () => {
      expect(JSON5.stringify([{
        key: 'one:two&three',
        value: 'test value'
      }])).toEqual(
`{
    "one&colon;two&amp;three": {
        "default": "test value"
    }
}`
);
    });

    it('serializes the singular form', () => {
      expect(JSON5.stringify([{
        key: 'test key',
        value: 'test value'
      }])).toEqual(
`{
    "test key": {
        "default": "test value"
    }
}`
);
    });

    it('serializes the plural form using string keys', () => {
      expect(JSON5.stringify([{
        key: 'test key',
        plural: 'test plural',
        value: {
          '0': 'test value 1',
          '1': 'test value 2',
        }
      }])).toEqual(
`{
    "test key:test plural": {
        "default": {
            "0": "test value 1",
            "1": "test value 2"
        }
    }
}`
);
    });

    it('serializes the plural form using integer keys', () => {
      expect(JSON5.stringify([{
        key: 'test key',
        plural: 'test plural',
        value: {
          0: 'test value 1',
          1: 'test value 2',
        }
      }])).toEqual(
`{
    "test key:test plural": {
        "default": {
            "0": "test value 1",
            "1": "test value 2"
        }
    }
}`
);
    });

    it('with extra metadata', () => {
      expect(JSON5.stringify([{
        comments: 'test comments',
        notes: 'test notes',
        status: 'NEW',
        references: [
          'test-reference-1.js:80',
          'test-reference-2.js:234',
        ],
        context: 'default',
        key: 'test key',
        value: 'test value',
      }])).toEqual(
`{
    "test key": {
        // test notes
        //. NEW
        //. test comments
        //: test-reference-1.js:80 test-reference-2.js:234
        "default": "test value"
    }
}`
);
    });
  });
});
