import JSON5Format from "./JSON5Format";

describe("formats/JSON5Format", () => {
  describe("parse", () => {
    it("unescapes escaped characters", () => {
      expect(
        JSON5Format.parse(
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
          msgstr: "localized about",
          translatorComments: "Notes",
        },
      ]);
    });

    it("parses singlular form", () => {
      expect(
        JSON5Format.parse(
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
          msgstr: "localized about",
          translatorComments: "Notes",
        },
      ]);
    });

    it("parses block developerComments", () => {
      expect(
        JSON5Format.parse(
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
          msgstr: "localized about",
          translatorComments: "Notes\ncontinued",
        },
      ]);
    });

    it("simple form", () => {
      expect(
        JSON5Format.parse(
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
        JSON5Format.parse(
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
        JSON5Format.parse(
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
        JSON5Format.stringify([
          {
            msgid: "one:two&three",
            msgstr: "test msgstr",
            sourceReferences: [
              { filename: "test-reference-1.js", lineNumber: 80 },
            ],
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
        JSON5Format.stringify([
          {
            msgid: "test msgid",
            msgstr: "test msgstr",
            sourceReferences: [
              { filename: "test-reference-1.js", lineNumber: 80 },
            ],
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
        JSON5Format.stringify([
          {
            msgid: "test msgid",
            msgidPlural: "test plural",
            msgstr: {
              "0": "test msgstr 1",
              "1": "test msgstr 2",
            },
            sourceReferences: [
              { filename: "test-reference-1.js", lineNumber: 80 },
            ],
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
        JSON5Format.stringify([
          {
            msgid: "test msgid",
            msgidPlural: "test plural",
            msgstr: {
              0: "test msgstr 1",
              1: "test msgstr 2",
            },
            sourceReferences: [
              { filename: "test-reference-1.js", lineNumber: 80 },
            ],
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
        JSON5Format.stringify([
          {
            msgid: "test msgid",
            msgidPlural: "test plural",
            msgstr: {
              "0": "test msgstr 1",
              "1": "test msgstr 2",
            },
            sourceReferences: [
              { filename: "test-reference-1.js", lineNumber: 80 },
            ],
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
        JSON5Format.stringify([
          {
            developerComments: "test developerComments",
            msgctxt: "default",
            msgid: "test msgid",
            msgstr: "test msgstr",
            sourceReferences: [
              { filename: "test-reference-1.js", lineNumber: 80 },
              { filename: "test-reference-2.js", lineNumber: 234 },
            ],
            translatorComments: "test translatorComments",
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
        JSON5Format.stringify([
          {
            flags: ["fuzzy"],
            msgid: "test msgid",
            msgstr: "test msgstr",
            sourceReferences: [],
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

    it("will serialize previous msgid and msgctxt", () => {
      expect(
        JSON5Format.stringify([
          {
            msgid: "test msgid",
            msgstr: "test msgstr",
            previous: {
              msgctxt: "test previous msgctxt",
              msgid: "test previous msgid",
            },
            sourceReferences: [{ filename: "a.js", lineNumber: 30 }],
          },
        ]),
      ).toEqual(
        `{
    "test msgid": {
        //| msgid test previous msgid
        //| msgctxt test previous msgctxt
        //: a.js:30
        "default": "test msgstr"
    }
}`,
      );
    });

    it("will parse previous msgid and msgctxt", () => {
      expect(
        JSON5Format.parse(`{
    "test msgid": {
        //| msgid test previous msgid
        //| msgctxt test previous msgctxt
        //: a.js:30
        "default": "test msgstr"
    }
}`),
      ).toEqual([
        {
          msgctxt: "default",
          msgid: "test msgid",
          msgstr: "test msgstr",
          previous: {
            msgctxt: "test previous msgctxt",
            msgid: "test previous msgid",
          },
        },
      ]);
    });

    it("with unused comment", () => {
      expect(
        JSON5Format.stringify([
          {
            flags: ["fuzzy"],
            msgid: "test msgid",
            msgstr: "test msgstr",
            sourceReferences: [],
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
        JSON5Format.stringify([
          {
            msgid: "test msgid",
            msgstr: "test msgstr",
            sourceReferences: [],
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
        JSON5Format.parse(`// {
// 	"test msgid": {
// 		"default": "test msgstr"
// 	}
// }`),
      ).toEqual([
        {
          msgctxt: "default",
          msgid: "test msgid",
          msgstr: "test msgstr",
        },
      ]);
    });
  });
});
