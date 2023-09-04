import PO from "./PO";

describe("formats/PO", () => {
  describe("parse", () => {
    it("parses a msgctxt entry", () => {
      expect(
        PO.parse(`#. NEW
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
          msgstr:
            "<b>Tip</b><br/>Some non-Meade telescopes support a subset of the LX200 command set. Select <tt>LX200 Basic</tt> to control such devices.",
          msgid: "Unknown system error",
        },
      ]);
    });

    it("parses an obsolete entry", () => {
      expect(
        PO.parse(`#~ # test translatorComments
#~ msgid "test message"
#~ msgstr "test localized message"
`),
      ).toEqual([
        {
          translatorComments: "test translatorComments",
          msgid: "test message",
          msgstr: "test localized message",
        },
      ]);
    });

    it("parses developerComments", () => {
      expect(
        PO.parse(`# test translatorComments
#. test developerComments
msgid "test message"
msgstr "test localized message"
`),
      ).toEqual([
        {
          translatorComments: "test translatorComments",
          developerComments: "test developerComments",
          msgid: "test message",
          msgstr: "test localized message",
        },
      ]);
    });

    it("parses a msgid_plural entry", () => {
      expect(
        PO.parse(`msgid "test message"
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
        PO.parse(`msgid "test message"
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
        PO.parse(
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
        PO.parse(
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
        PO.parse(
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
        PO.parse(`
"test"
"\\n"
"message"
`),
      ).toEqual([]);
    });

    it("reassmbles lines when msgidPlural", () => {
      expect(
        PO.parse(
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
        PO.stringify([
          {
            sourceReferences: [{ filename: "a.js", lineNumber: 10 }],
            msgid: "test message",
            msgstr: "test localized message",
          },
        ]),
      ).toEqual(`#: a.js:10
msgid "test message"
msgstr "test localized message"
`);
    });

    it("throws a SyntaxError when missing msgid", () => {
      expect(() =>
        PO.stringify([
          {
            sourceReferences: [{ filename: "a.js", lineNumber: 10 }],
            msgstr: "test localized message",
          },
        ]),
      ).toThrow(
        new SyntaxError(`Entry is missing msgid, {
    "msgstr": "test localized message"
}`),
      );
    });

    it("throws a SyntaxError when missing msgstr", () => {
      expect(() =>
        PO.stringify([
          {
            sourceReferences: [{ filename: "a.js", lineNumber: 10 }],
            msgid: "test message",
          },
        ]),
      ).toThrow(
        new SyntaxError(`Entry is missing msgstr, {
    "msgid": "test message"
}`),
      );
    });

    it("becomes commented out when no source references", () => {
      expect(
        PO.stringify([
          {
            sourceReferences: [],
            msgid: "test message",
            msgstr: "test localized message",
          },
        ]),
      ).toEqual(`#~ msgid "test message"
#~ msgstr "test localized message"
`);
    });

    it("omits status when existing", () => {
      expect(
        PO.stringify([
          {
            sourceReferences: [{ filename: "a.js", lineNumber: 10 }],
            status: "existing",
            msgid: "test message",
            msgstr: "test localized message",
          },
        ]),
      ).toEqual(`#: a.js:10
msgid "test message"
msgstr "test localized message"
`);
    });

    it("converts status to upper case", () => {
      expect(
        PO.stringify([
          {
            sourceReferences: [{ filename: "a.js", lineNumber: 10 }],
            status: "new",
            msgid: "test message",
            msgstr: "test localized message",
          },
        ]),
      ).toEqual(`#: a.js:10
msgid "test message"
msgstr "test localized message"
`);
    });

    it("stringifies a singular entry with an empty msgstr", () => {
      expect(
        PO.stringify([
          {
            sourceReferences: [{ filename: "a.js", lineNumber: 10 }],
            msgid: "test message",
            msgstr: "",
          },
        ]),
      ).toEqual(`#: a.js:10
msgid "test message"
msgstr ""
`);
    });

    it("stringifies a singular entry with msgctxt", () => {
      expect(
        PO.stringify([
          {
            sourceReferences: [{ filename: "a.js", lineNumber: 10 }],
            msgctxt: "test msgctxt",
            msgid: "test message",
            msgstr: "test localized message",
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
        PO.stringify([
          {
            sourceReferences: [{ filename: "a.js", lineNumber: 10 }],
            msgctxt: "default",
            msgid: "test message",
            msgstr: "test localized message",
          },
        ]),
      ).toEqual(`#: a.js:10
msgid "test message"
msgstr "test localized message"
`);
    });

    it("includes developerComments", () => {
      expect(
        PO.stringify([
          {
            sourceReferences: [{ filename: "a.js", lineNumber: 10 }],
            translatorComments: "test translatorComments",
            developerComments: "test developerComments",
            msgid: "test message",
            msgstr: "test localized message",
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
        PO.stringify([
          {
            sourceReferences: [{ filename: "a.js", lineNumber: 10 }],
            msgid: "test message",
            msgidPlural: "test messages",
            msgstr: {
              [1]: "localized test message",
              [2]: "localized test messages",
            },
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
        PO.stringify([
          {
            sourceReferences: [{ filename: "a.js", lineNumber: 10 }],
            msgid: "test message 1",
            msgstr: "test localized message 1",
          },
          {
            sourceReferences: [{ filename: "a.js", lineNumber: 10 }],
            msgid: "test message 2",
            msgstr: "test localized message 2",
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
        PO.stringify([
          {
            sourceReferences: [{ filename: "a.js", lineNumber: 10 }],
            msgid: "test message 1",
            msgstr: "test\nlocalized\nmessage 1",
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
        PO.stringify([
          {
            sourceReferences: [{ filename: "a.js", lineNumber: 10 }],
            msgid: "test message",
            msgstr: "localized\n",
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
        PO.stringify([
          {
            sourceReferences: [{ filename: "a.js", lineNumber: 10 }],
            msgid: "test message",
            msgstr: "localized\\n",
          },
        ]),
      ).toEqual(
        `#: a.js:10
msgid "test message"
msgstr "localized\\\\n"
`,
      );
    });
  });
});
