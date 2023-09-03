import PO from './PO';

describe('formats/PO', () => {
  describe('parse', () => {
    it('parses a context entry', () => {
      expect(PO.parse(`#. NEW
#: lib/error.c:116
msgctxt "Context"
msgid "Unknown system error"
msgstr ""
"<b>Tip</b><br/>Some non-Meade telescopes support a subset of the LX200 "
"command set. Select <tt>LX200 Basic</tt> to control such devices."`)).toEqual([{
  comments: 'NEW',
  context: 'Context',
  value: '<b>Tip</b><br/>Some non-Meade telescopes support a subset of the LX200 command set. Select <tt>LX200 Basic</tt> to control such devices.',
  key: 'Unknown system error',
}]);
    });

    it('parses an obsolete entry', () => {
      expect(PO.parse(`#~ # test notes
#~ msgid "test message"
#~ msgstr "test localized message"
`)).toEqual([{
  notes: 'test notes',
  key: 'test message',
  value: 'test localized message'
}]);
    });

    it('parses comments', () => {
      expect(PO.parse(`# test notes
#. test comments
msgid "test message"
msgstr "test localized message"
`)).toEqual([{
  notes: 'test notes',
  comments: 'test comments',
  key: 'test message',
  value: 'test localized message'
}]);
    });

    it('parses a plural entry', () => {
      expect(PO.parse(`#. NEW
msgid "test message"
msgid_plural "test messages"
msgstr[1] "localized test message"
msgstr[2] "localized test messages"
`)).toEqual([{
  comments: 'NEW',
  key: 'test message',
  plural: 'test messages',
  value: {
    [1]: 'localized test message',
    [2]: 'localized test messages',
  }
}]);
    });

    it('handles missing index for plural entry gracefully', () => {
      expect(PO.parse(`#. NEW
msgid "test message"
msgid_plural "test messages"
msgstr[] "localized test message"
msgstr[2] "localized test messages"
`)).toEqual([{
  comments: 'NEW',
  key: 'test message',
  plural: "test messages",
  value: {
    [2]: 'localized test messages',
  }
}]);
    });

    it('reassmbles lines', () => {
      expect(PO.parse(
`msgid "test message"
msgstr ""
"localized\\n"
"test"
"\\n"
"message"
`
      )).toEqual([{
        key: 'test message',
        value: "localized\ntest\nmessage"
      }]);
    });

    it('reassmbles single line with break', () => {
      expect(PO.parse(
`msgid "test message"
msgstr "localized\\n"
`
      )).toEqual([{
        key: 'test message',
        value: "localized\n"
      }]);
    });

    it('reassembles lines with escaped backslash', () => {
      expect(PO.parse(
`msgid "test message"
msgstr "localized\\\\n"
`
      )).toEqual([{
        key: 'test message',
        value: "localized\\n"
      }]);
    });

    it('handles floating line gracefully', () => {
      expect(PO.parse(`
"test"
"\\n"
"message"
`
    )).toEqual([]);
    });

    it('reassmbles lines when plural', () => {
      expect(PO.parse(
`msgid "test message"
msgid_plural "test messages"
msgstr[0] "localized\\n"
"test"
"\\n"
"message"
`
    )).toEqual([{
      key: 'test message',
      plural: 'test messages',
      value: {
        "0": "localized\ntest\nmessage"
      }
    }]);
    });
  });

  describe('stringify', () => {
    it ('stringifies a singular entry', () => {
      expect(PO.stringify([{
        key: 'test message',
        value: 'test localized message',
      }])).toEqual(`msgid "test message"
msgstr "test localized message"
`);
    });

    it ('throws a SyntaxError when missing key', () => {
      expect(() => PO.stringify([{
        value: 'test localized message',
      }])).toThrow(new SyntaxError(`Entry is missing key, {
    "value": "test localized message"
}`));
    });

    it ('throws a SyntaxError when missing value', () => {
      expect(() => PO.stringify([{
        key: 'test message',
      }])).toThrow(new SyntaxError(`Entry is missing value, {
    "key": "test message"
}`));
    });

    it('omits references when empty array', () => {
      expect(PO.stringify([{
        references: [],
        key: 'test message',
        value: 'test localized message',
      }])).toEqual(`msgid "test message"
msgstr "test localized message"
`);
    });

    it('omits status when existing', () => {
      expect(PO.stringify([{
        status: 'existing',
        key: 'test message',
        value: 'test localized message',
      }])).toEqual(`msgid "test message"
msgstr "test localized message"
`);
    });

    it('converts status to upper case', () => {
      expect(PO.stringify([{
        status: 'new',
        key: 'test message',
        value: 'test localized message',
      }])).toEqual(`#. NEW
msgid "test message"
msgstr "test localized message"
`);
    });

    it ('stringifies a singular entry with an empty value', () => {
      expect(PO.stringify([{
        key: 'test message',
        value: '',
      }])).toEqual(`msgid "test message"
msgstr ""
`);
    });

    it ('stringifies a singular entry with context', () => {
      expect(PO.stringify([{
        context: 'test context',
        key: 'test message',
        value: 'test localized message',
      }])).toEqual(`msgctxt "test context"
msgid "test message"
msgstr "test localized message"
`);
    });

    it ('stringifies a singular entry, ignoring default context', () => {
      expect(PO.stringify([{
        context: 'default',
        key: 'test message',
        value: 'test localized message',
      }])).toEqual(`msgid "test message"
msgstr "test localized message"
`);
    });

    it ('includes comments', () => {
      expect(PO.stringify([{
        notes: 'test notes',
        comments: 'test comments',
        key: 'test message',
        value: 'test localized message',
      }])).toEqual(`# test notes
#. test comments
msgid "test message"
msgstr "test localized message"
`);
    });

    it ('stringifies a plural entry', () => {
      expect(PO.stringify([{
        key: 'test message',
        plural: 'test messages',
        value: {
          [1]: 'localized test message',
          [2]: 'localized test messages',
        }
      }])).toEqual(`msgid "test message"
msgid_plural "test messages"
msgstr[1] "localized test message"
msgstr[2] "localized test messages"
`);
    });

    it('stringifies multiple entries', () => {
      expect(PO.stringify([{
        key: 'test message 1',
        value: 'test localized message 1',
      }, {
        key: 'test message 2',
        value: 'test localized message 2',
      }])).toEqual(`msgid "test message 1"
msgstr "test localized message 1"

msgid "test message 2"
msgstr "test localized message 2"
`);
    });

    it('splits lines', () => {
      expect(PO.stringify([{
        key: 'test message 1',
        value: 'test\nlocalized\nmessage 1',
      }])).toEqual(`msgid "test message 1"
msgstr "test\\n"
"localized\\n"
"message 1"
`);
    });

    it('splits end break', () => {
      expect(PO.stringify([{
        key: 'test message',
        value: "localized\n"
      }])).toEqual(
`msgid "test message"
msgstr "localized\\n"
""
`
      );
    });

    it('handles escaped backslash correctly', () => {
      expect(PO.stringify([{
        key: 'test message',
        value: "localized\\n"
      }])).toEqual(
`msgid "test message"
msgstr "localized\\\\n"
`
      );
    });
  });
});
