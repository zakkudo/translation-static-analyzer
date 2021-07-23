import POFormat from ".";

/*
msgid ""
msgstr ""
"Project-Id-Version: \n"
"POT-Creation-Date: \n"
"PO-Revision-Date: \n"
"Language-Team: \n"
"MIME-Version: 1.0\n"
"Content-Type: text/plain; charset=UTF-8\n"
"Content-Transfer-Encoding: 8bit\n"
"X-Generator: Poedit 3.0\n"
"Last-Translator: \n"
"Plural-Forms: nplurals=1; plural=0;\n"
"Language: ja\n"

#: modules/user/views_handler_filter_user_name.inc:29
msgid "Enter a comma separated list of user names."
msgstr ""

#: modules/user/views_handler_filter_user_name.inc:112
msgid "Unable to find user: @users"
msgid_plural "Unable to find users: @users"
msgstr[0] "Benutzer konnte nicht gefunden werden: @users"
*/

describe("src/formats/POFOrmat", () => {
  describe("stringify", () => {
    it("renders singular", () => {
      expect(
        POFormat.stringify([
          {
            extractedComments: [],
            flags: [],
            msgctxt: "",
            msgid: "Enter a comma separated list of user names.",
            msgstr: [""],
            sourceReferences: [],
            translatorComments: [],
            previousMsgctxt: "",
            previousMsgid: "",
            previousMsgidPlural: "",
            obsolete: false,
          },
        ])
      ).toEqual(`msgid "Enter a comma separated list of user names."
msgstr ""`);
    });

    it("renders plural", () => {
      expect(
        POFormat.stringify([
          {
            extractedComments: [],
            flags: [],
            msgctxt: "",
            msgid: "Enter a comma separated list of user names.",
            msgstr: [""],
            sourceReferences: [],
            translatorComments: [],
            previousMsgctxt: "",
            previousMsgid: "",
            previousMsgidPlural: "",
            obsolete: false,
          },
        ])
      ).toEqual(`msgid "Enter a comma separated list of user names."
msgstr ""`);
    });

    it("renders with minimal props", () => {
      expect(
        POFormat.stringify([
          {
            extractedComments: [],
            flags: [],
            msgctxt: "",
            msgid: "test msgid",
            msgstr: [],
            sourceReferences: [],
            translatorComments: [],
            previousMsgctxt: "",
            previousMsgid: "",
            previousMsgidPlural: "",
            obsolete: false,
          },
        ])
      ).toEqual(`msgid "test msgid"`);
    });

    it("renders a all values", () => {
      expect(
        POFormat.stringify([
          {
            extractedComments: ["test extracted comments"],
            flags: ["test-flag"],
            msgctxt: "test-mesage-context",
            msgid: "test msgid",
            msgidPlural: "test msgid plural",
            msgstr: ["test msgstr"],
            sourceReferences: ["test-source-reference"],
            translatorComments: ["test-translator comments"],
            previousMsgctxt: "test previous msgctxt",
            previousMsgid: "test-previous-msgid",
            previousMsgidPlural: "test previous msgid plural",
            obsolete: false,
          },
        ])
      ).toEqual(`# test-translator comments
#. test extracted comments
#: test-source-reference
#, test-flag
#| msgctxt "test-mesage-context"
msgid "test-mesage-context"
#| msgid "test msgid"
msgid "test msgid"
#| msgid_plural "test previous msgid plural"
msgid_plural "test msgid plural"
msgstr[0] "test msgstr"`);
    });
  });

  describe("parse", () => {
    it("parses a string value pair", () => {
      const data = `msgid "Enter a comma separated list of user names."
msgstr ""`;
      expect(POFormat.parse(data)).toEqual([
        {
          extractedComments: [],
          flags: [],
          msgctxt: "",
          msgid: "Enter a comma separated list of user names.",
          msgstr: [""],
          sourceReferences: [],
          translatorComments: [],
          obsolete: false,
        },
      ]);
    });

    it("parses multiple messages", () => {
      const data = `msgid "test key 1"
msgstr ""
msgid "test key 2"
msgstr ""`;
      expect(POFormat.parse(data)).toEqual([
        {
          extractedComments: [],
          flags: [],
          msgctxt: "",
          msgid: "test key 1",
          msgstr: [""],
          sourceReferences: [],
          translatorComments: [],
          obsolete: false,
        },
        {
          extractedComments: [],
          flags: [],
          msgctxt: "",
          msgid: "test key 2",
          msgstr: [""],
          sourceReferences: [],
          translatorComments: [],
          obsolete: false,
        },
      ]);
    });

    it("parses all", () => {
      const data = `
# test-translator-comment
#. test-extracted-comment
#: test-source-line
#, fuzzy
#| msgctxt "test previous msgctxt"
msgctxt "test msgctxt"
#| msgid "test previous msgid"
msgid "test msgid"
#| msgid_plural "test previous plural msgid"
msgid_plural "test plural msgid"
msgstr "test msgstr"`;
      expect(POFormat.parse(data)).toEqual([
        {
          extractedComments: ["test-extracted-comment"],
          flags: ["fuzzy"],
          msgctxt: "test msgctxt",
          msgid: "test msgid",
          msgstr: ["test msgstr"],
          sourceReferences: ["test-source-line"],
          translatorComments: ["test-translator-comment"],
          previousMsgctxt: "test previous msgctxt",
          previousMsgid: "test previous msgid",
          previousMsgidPlural: "test previous plural msgid",
          msgidPlural: "test plural msgid",
          obsolete: false,
        },
      ]);
    });

    it("plural", () => {
      const data = `
msgid "test msgid"
msgid_plural "test plural msgid"
msgstr[0] "test msgstr 1"
msgstr[1] "test msgstr 2"
msgstr[2] "test msgstr 3"`;
      expect(POFormat.parse(data)).toEqual([
        {
          extractedComments: [],
          flags: [],
          msgctxt: "",
          msgid: "test msgid",
          msgstr: ["test msgstr 1", "test msgstr 2", "test msgstr 3"],
          sourceReferences: [],
          translatorComments: [],
          msgidPlural: "test plural msgid",
          obsolete: false,
        },
      ]);
    });

    it("multiple lines", () => {
      const data = `
#| msgctxt "test previous msgctxt one\\n"
"test previous msgctxt two\\n"
"test previous msgctxt three"
msgctxt "test msgctxt one\\n"
"test msgctxt two\\n"
"test msgctxt three"
#| msgid "test previous msgid one\\n"
"test previous msgid two\\n"
"test previous msgid three"
msgid "test msgid one\\n"
"test msgid two\\n"
"test msgid three"
#| msgid_plural "test previous plural msgid one\\n"
"test previous plural msgid two\\n"
"test previous plural msgid three"
msgid_plural "test plural msgid one\\n"
"test plural msgid two\\n"
"test plural msgid three"
msgstr[0] "test msgstr one\\n"
"test msgstr two\\n"
"test msgstr three"
`;
      expect(POFormat.parse(data)).toEqual([
        {
          extractedComments: [],
          flags: [],
          msgctxt: "test msgctxt one\ntest msgctxt two\ntest msgctxt three",
          msgid: "test msgid one\ntest msgid two\ntest msgid three",
          msgstr: ["test msgstr one\ntest msgstr two\ntest msgstr three"],
          previousMsgctxt:
            "test previous msgctxt one\ntest previous msgctxt two\ntest previous msgctxt three",
          previousMsgid:
            "test previous msgid one\ntest previous msgid two\ntest previous msgid three",
          previousMsgidPlural:
            "test previous plural msgid one\ntest previous plural msgid two\ntest previous plural msgid three",
          sourceReferences: [],
          translatorComments: [],
          msgidPlural:
            "test plural msgid one\ntest plural msgid two\ntest plural msgid three",
          obsolete: false,
        },
      ]);
    });

    it("throws exception when invalid key", () => {
      const data = `
invalidkey "test msgid"
`;
      expect(() => POFormat.parse(data)).toThrow(SyntaxError);
    });

    it("throws an exception when no keys match", () => {
      const data = `
invalidline"
`;
      expect(() => POFormat.parse(data)).toThrow(SyntaxError);
    });

    it("loads obsolete items", () => {
      const data = `
#~ msgctxt "test msgctxt"
#~ msgid "test msgid"
#~ msgid_plural "test msgid plural"
`;
      expect(POFormat.parse(data)).toEqual([
        {
          extractedComments: [],
          flags: [],
          msgctxt: "test msgctxt",
          msgid: "test msgid",
          msgstr: [],
          sourceReferences: [],
          translatorComments: [],
          obsolete: true,
          msgidPlural: "test msgid plural",
        },
      ]);
    });

    it("creates multiple items", () => {});
  });
});
