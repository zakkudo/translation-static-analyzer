/* eslint-disable no-useless-escape */
import { ValidationError } from "../errors";
import POFormat from "./POFormat";

describe("formats/POFormat", () => {
  describe("parse", () => {
    it("parses a msgctxt entry", () => {
      expect(
        POFormat.parse(`#. NEW
#: lib/error.c:116
msgctxt "Context"
msgid "Unknown system error"
msgstr ""
"<b>Tip</b><br/>Some non-Meade telescopes support a subset of the LX200 "
"command set. Select <tt>LX200 Basic</tt> to control such devices."`),
      ).toEqual([
        {
          developerComments: "NEW",
          msgctxt: "Context",
          msgid: "Unknown system error",
          msgstr:
            "<b>Tip</b><br/>Some non-Meade telescopes support a subset of the LX200 command set. Select <tt>LX200 Basic</tt> to control such devices.",
          sourceReferences: [
            {
              filename: "lib/error.c",
              lineNumber: 116,
            },
          ],
        },
      ]);
    });

    it("parses a double quote", () => {
      expect(
        POFormat.parse(`
msgid "\\""
msgctxt "\\""
msgstr "\\""
`),
      ).toEqual([
        {
          msgctxt: '"',
          msgid: '"',
          msgstr: '"',
        },
      ]);
    });

    it("parses an obsolete entry", () => {
      expect(
        POFormat.parse(`#~ # test translatorComments
#~ msgid "test message"
#~ msgstr "test localized message"
`),
      ).toEqual([
        {
          msgid: "test message",
          msgstr: "test localized message",
          translatorComments: "test translatorComments",
        },
      ]);
    });

    it("parses developerComments", () => {
      expect(
        POFormat.parse(`# test translatorComments
#. test developerComments
msgid "test message"
msgstr "test localized message"
`),
      ).toEqual([
        {
          developerComments: "test developerComments",
          msgid: "test message",
          msgstr: "test localized message",
          translatorComments: "test translatorComments",
        },
      ]);
    });

    it("parses a msgid_plural entry", () => {
      expect(
        POFormat.parse(`msgid "test message"
msgid_plural "test messages"
msgstr[1] "localized test message"
msgstr[2] "localized test messages"
`),
      ).toEqual([
        {
          msgid: "test message",
          msgidPlural: "test messages",
          msgstr: {
            [1]: "localized test message",
            [2]: "localized test messages",
          },
        },
      ]);
    });

    it("handles missing index for msgid_plural entry gracefully", () => {
      expect(
        POFormat.parse(`msgid "test message"
msgid_plural "test messages"
msgstr[] "localized test message"
msgstr[2] "localized test messages"
`),
      ).toEqual([
        {
          msgid: "test message",
          msgidPlural: "test messages",
          msgstr: {
            [2]: "localized test messages",
          },
        },
      ]);
    });

    it("reassmbles lines", () => {
      expect(
        POFormat.parse(
          `msgid "test message"
msgstr ""
"localized\\n"
"test"
"\\n"
"message"
`,
        ),
      ).toEqual([
        {
          msgid: "test message",
          msgstr: "localized\ntest\nmessage",
        },
      ]);
    });

    it("reassmbles single line with break", () => {
      expect(
        POFormat.parse(
          `msgid "test message"
msgstr "localized\\n"
`,
        ),
      ).toEqual([
        {
          msgid: "test message",
          msgstr: "localized\n",
        },
      ]);
    });

    it("reassembles lines with escaped backslash", () => {
      expect(
        POFormat.parse(
          `msgid "test message"
msgstr "localized\\\\n"
`,
        ),
      ).toEqual([
        {
          msgid: "test message",
          msgstr: "localized\\n",
        },
      ]);
    });

    it("handles floating line gracefully", () => {
      expect(
        POFormat.parse(`
"test"
"\\n"
"message"
`),
      ).toEqual([]);
    });

    it("reassmbles lines when msgidPlural", () => {
      expect(
        POFormat.parse(
          `msgid "test message"
msgid_plural "test messages"
msgstr[0] "localized\\n"
"test"
"\\n"
"message"
`,
        ),
      ).toEqual([
        {
          msgid: "test message",
          msgidPlural: "test messages",
          msgstr: {
            "0": "localized\ntest\nmessage",
          },
        },
      ]);
    });
  });

  describe("stringify", () => {
    it("stringifies a singular entry", () => {
      expect(
        POFormat.stringify([
          {
            msgid: "test message",
            msgstr: "test localized message",
            sourceReferences: [{ filename: "a.js", lineNumber: 10 }],
          },
        ]),
      ).toEqual(`#: a.js:10
msgid "test message"
msgstr "test localized message"
`);
    });

    it("throws a SyntaxError when missing msgid", () => {
      const entry = {
        msgstr: "test localized message",
        sourceReferences: [{ filename: "a.js", lineNumber: 10 }],
      };
      expect(() => POFormat.stringify([entry])).toThrow(
        new ValidationError(`Entry is missing msgid`, entry),
      );
    });

    it("throws a SyntaxError when missing msgstr", () => {
      const entry = {
        msgid: "test message",
        sourceReferences: [{ filename: "a.js", lineNumber: 10 }],
      };
      expect(() => POFormat.stringify([entry])).toThrow(
        new ValidationError(`Entry is missing msgstr`, entry),
      );
    });

    it("becomes commented out when no source references", () => {
      expect(
        POFormat.stringify([
          {
            msgid: "test message",
            msgstr: "test localized message",
            sourceReferences: [],
          },
        ]),
      ).toEqual(`#~ msgid "test message"
#~ msgstr "test localized message"
`);
    });

    it("omits status when existing", () => {
      expect(
        POFormat.stringify([
          {
            msgid: "test message",
            msgstr: "test localized message",
            sourceReferences: [{ filename: "a.js", lineNumber: 10 }],
            status: "existing",
          },
        ]),
      ).toEqual(`#: a.js:10
msgid "test message"
msgstr "test localized message"
`);
    });

    it("converts status to upper case", () => {
      expect(
        POFormat.stringify([
          {
            msgid: "test message",
            msgstr: "test localized message",
            sourceReferences: [{ filename: "a.js", lineNumber: 10 }],
            status: "new",
          },
        ]),
      ).toEqual(`#: a.js:10
msgid "test message"
msgstr "test localized message"
`);
    });

    it("stringifies a singular entry with an empty msgstr", () => {
      expect(
        POFormat.stringify([
          {
            msgid: "test message",
            msgstr: "",
            sourceReferences: [{ filename: "a.js", lineNumber: 10 }],
          },
        ]),
      ).toEqual(`#: a.js:10
msgid "test message"
msgstr ""
`);
    });

    it("stringifies a singular entry with msgctxt", () => {
      expect(
        POFormat.stringify([
          {
            msgctxt: "test msgctxt",
            msgid: "test message",
            msgstr: "test localized message",
            sourceReferences: [{ filename: "a.js", lineNumber: 10 }],
          },
        ]),
      ).toEqual(`#: a.js:10
msgctxt "test msgctxt"
msgid "test message"
msgstr "test localized message"
`);
    });

    it("stringifies a singular entry, ignoring default msgctxt", () => {
      expect(
        POFormat.stringify([
          {
            msgctxt: "default",
            msgid: "test message",
            msgstr: "test localized message",
            sourceReferences: [{ filename: "a.js", lineNumber: 10 }],
          },
        ]),
      ).toEqual(`#: a.js:10
msgid "test message"
msgstr "test localized message"
`);
    });

    it("includes developerComments", () => {
      expect(
        POFormat.stringify([
          {
            developerComments: "test developerComments",
            msgid: "test message",
            msgstr: "test localized message",
            sourceReferences: [{ filename: "a.js", lineNumber: 10 }],
            translatorComments: "test translatorComments",
          },
        ]),
      ).toEqual(`# test translatorComments
#. test developerComments
#: a.js:10
msgid "test message"
msgstr "test localized message"
`);
    });

    it("stringifies a msgidPlural entry", () => {
      expect(
        POFormat.stringify([
          {
            msgid: "test message",
            msgidPlural: "test messages",
            msgstr: {
              [1]: "localized test message",
              [2]: "localized test messages",
            },
            sourceReferences: [{ filename: "a.js", lineNumber: 10 }],
          },
        ]),
      ).toEqual(`#: a.js:10
msgid "test message"
msgid_plural "test messages"
msgstr[1] "localized test message"
msgstr[2] "localized test messages"
`);
    });

    it("stringifies multiple entries", () => {
      expect(
        POFormat.stringify([
          {
            msgid: "test message 1",
            msgstr: "test localized message 1",
            sourceReferences: [{ filename: "a.js", lineNumber: 10 }],
          },
          {
            msgid: "test message 2",
            msgstr: "test localized message 2",
            sourceReferences: [{ filename: "a.js", lineNumber: 10 }],
          },
        ]),
      ).toEqual(`#: a.js:10
msgid "test message 1"
msgstr "test localized message 1"

#: a.js:10
msgid "test message 2"
msgstr "test localized message 2"
`);
    });

    it("splits lines", () => {
      expect(
        POFormat.stringify([
          {
            msgid: "test message 1",
            msgstr: "test\nlocalized\nmessage 1",
            sourceReferences: [{ filename: "a.js", lineNumber: 10 }],
          },
        ]),
      ).toEqual(`#: a.js:10
msgid "test message 1"
msgstr "test\\n"
"localized\\n"
"message 1"
`);
    });

    it("splits end break", () => {
      expect(
        POFormat.stringify([
          {
            msgid: "test message",
            msgstr: "localized\n",
            sourceReferences: [{ filename: "a.js", lineNumber: 10 }],
          },
        ]),
      ).toEqual(
        `#: a.js:10
msgid "test message"
msgstr "localized\\n"
""
`,
      );
    });

    it("handles escaped backslash correctly", () => {
      expect(
        POFormat.stringify([
          {
            msgid: "test message",
            msgstr: "localized\\n",
            sourceReferences: [{ filename: "a.js", lineNumber: 10 }],
          },
        ]),
      ).toEqual(
        `#: a.js:10
msgid "test message"
msgstr "localized\\\\n"
`,
      );
    });

    it("serializes a double quote", () => {
      expect(
        POFormat.stringify([
          {
            msgctxt: '"',
            msgid: '"',
            msgstr: '"',
          },
        ]),
      ).toEqual(`#~ msgctxt "\\""
#~ msgid "\\""
#~ msgstr "\\""
`);
    });
  });
});
