import JSON5 from "./JSON5";

describe("formats/JSON5", () => {
  describe("parse", () => {
    it("unescapes escaped characters", () => {
      expect(
        JSON5.parse(
          `{
  "one&colon;two&amp;three": {
    // Notes
    //. Test developerComments
    //, src/Application/index.js:40
    "default": "localized about",
  }
}`,
        ),
      ).toEqual([
        {
          developerComments: "Test developerComments",
          msgctxt: "default",
          msgid: "one:two&three",
          translatorComments: "Notes",
          msgstr: "localized about",
        },
      ]);
    });

    it("parses singlular form", () => {
      expect(
        JSON5.parse(
          `{
  "about": {
    // Notes
    //. Test developerComments
    //, src/Application/index.js:40
    "default": "localized about",
  }
}`,
        ),
      ).toEqual([
        {
          developerComments: "Test developerComments",
          msgctxt: "default",
          msgid: "about",
          translatorComments: "Notes",
          msgstr: "localized about",
        },
      ]);
    });

    it("parses block developerComments", () => {
      expect(
        JSON5.parse(
          `{
  "about": {
    /* Notes
continued*/
    //. Test developerComments
    //, src/Application/index.js:40
    "default": "localized about",
  }
}`,
        ),
      ).toEqual([
        {
          developerComments: "Test developerComments",
          msgctxt: "default",
          msgid: "about",
          translatorComments: "Notes\ncontinued",
          msgstr: "localized about",
        },
      ]);
    });

    it("simple form", () => {
      expect(
        JSON5.parse(
          `{
  "about": {
    "default": "localized about",
  }
}`,
        ),
      ).toEqual([
        {
          msgctxt: "default",
          msgid: "about",
          msgstr: "localized about",
        },
      ]);
    });

    it("with msgctxt", () => {
      expect(
        JSON5.parse(
          `{
  "about": {
    "test msgctxt": "localized about",
  }
}`,
        ),
      ).toEqual([
        {
          msgctxt: "test msgctxt",
          msgid: "about",
          msgstr: "localized about",
        },
      ]);
    });

    it("parses plural", () => {
      expect(
        JSON5.parse(
          `{
  "test msgid:test plural": {
    "test msgctxt": {"1": "localized singular", "2": "localized plural"}
  }
}`,
        ),
      ).toEqual([
        {
          msgctxt: "test msgctxt",
          msgid: "test msgid",
          msgidPlural: "test plural",
          msgstr: {
            "1": "localized singular",
            "2": "localized plural",
          },
        },
      ]);
    });
  });

  describe("stringify", () => {
    it("escapes special characters", () => {
      expect(
        JSON5.stringify([
          {
            sourceReferences: [
              { filename: "test-reference-1.js", lineNumber: 80 },
            ],
            msgid: "one:two&three",
            msgstr: "test msgstr",
          },
        ]),
      ).toEqual(
        `{
    "one&colon;two&amp;three": {
        //: test-reference-1.js:80
        "default": "test msgstr"
    }
}`,
      );
    });

    it("serializes the singular form", () => {
      expect(
        JSON5.stringify([
          {
            sourceReferences: [
              { filename: "test-reference-1.js", lineNumber: 80 },
            ],
            msgid: "test msgid",
            msgstr: "test msgstr",
          },
        ]),
      ).toEqual(
        `{
    "test msgid": {
        //: test-reference-1.js:80
        "default": "test msgstr"
    }
}`,
      );
    });

    it("serializes the plural form using string keys", () => {
      expect(
        JSON5.stringify([
          {
            sourceReferences: [
              { filename: "test-reference-1.js", lineNumber: 80 },
            ],
            msgid: "test msgid",
            msgidPlural: "test plural",
            msgstr: {
              "0": "test msgstr 1",
              "1": "test msgstr 2",
            },
          },
        ]),
      ).toEqual(
        `{
    "test msgid:test plural": {
        //: test-reference-1.js:80
        "default": {
            "0": "test msgstr 1",
            "1": "test msgstr 2"
        }
    }
}`,
      );
    });

    it("serializes the plural form using integer keys", () => {
      expect(
        JSON5.stringify([
          {
            sourceReferences: [
              { filename: "test-reference-1.js", lineNumber: 80 },
            ],
            msgid: "test msgid",
            msgidPlural: "test plural",
            msgstr: {
              0: "test msgstr 1",
              1: "test msgstr 2",
            },
          },
        ]),
      ).toEqual(
        `{
    "test msgid:test plural": {
        //: test-reference-1.js:80
        "default": {
            "0": "test msgstr 1",
            "1": "test msgstr 2"
        }
    }
}`,
      );
    });

    it("serializes the plural form with out of order keys", () => {
      expect(
        JSON5.stringify([
          {
            sourceReferences: [
              { filename: "test-reference-1.js", lineNumber: 80 },
            ],
            msgid: "test msgid",
            msgidPlural: "test plural",
            msgstr: {
              "1": "test msgstr 2",
              "0": "test msgstr 1",
            },
          },
        ]),
      ).toEqual(
        `{
    "test msgid:test plural": {
        //: test-reference-1.js:80
        "default": {
            "0": "test msgstr 1",
            "1": "test msgstr 2"
        }
    }
}`,
      );
    });

    it("with extra metadata", () => {
      expect(
        JSON5.stringify([
          {
            developerComments: "test developerComments",
            translatorComments: "test translatorComments",
            sourceReferences: [
              { filename: "test-reference-1.js", lineNumber: 80 },
              { filename: "test-reference-2.js", lineNumber: 234 },
            ],
            msgctxt: "default",
            msgid: "test msgid",
            msgstr: "test msgstr",
          },
        ]),
      ).toEqual(
        `{
    "test msgid": {
        // test translatorComments
        //. test developerComments
        //: test-reference-1.js:80 test-reference-2.js:234
        "default": "test msgstr"
    }
}`,
      );
    });

    it("with fuzzy", () => {
      expect(
        JSON5.stringify([
          {
            flags: ["fuzzy"],
            sourceReferences: [],
            msgid: "test msgid",
            msgstr: "test msgstr",
          },
        ]),
      ).toEqual(
        `{
    "test msgid": {
        //, fuzzy
        "default": "test msgstr"
    }
}`,
      );
    });

    it("with unused comment", () => {
      expect(
        JSON5.stringify([
          {
            flags: ["fuzzy"],
            sourceReferences: [],
            msgid: "test msgid",
            msgstr: "test msgstr",
          },
        ]),
      ).toEqual(
        `{
    "test msgid": {
        //, fuzzy
        "default": "test msgstr"
    }
}`,
      );
    });

    it("comments out unused translations that are not fuzzy", () => {
      expect(
        JSON5.stringify([
          {
            sourceReferences: [],
            msgid: "test msgid",
            msgstr: "test msgstr",
          },
        ]),
      ).toEqual(
        `// {
// 	"test msgid": {
// 		"default": "test msgstr"
// 	}
// }`,
      );
    });

    it("can parse a commented out translation", () => {
      expect(
        JSON5.parse(`// {
// 	"test msgid": {
// 		"default": "test msgstr"
// 	}
// }`),
      ).toEqual([
        {
          msgid: "test msgid",
          msgctxt: "default",
          msgstr: "test msgstr",
        },
      ]);
    });
  });
});
