import readCharacter from "../readCharacter";

describe("plugins/readCharacter", () => {
  it("reads letters with no special meaning", () => {
    let state = { index: 0, lineNumber: 0, stack: [] };
    const text = "abc";
    const actual = [];

    while ((state = readCharacter(text, state)) !== null) {
      actual.push(state);
    }

    expect(actual).toEqual([
      {
        index: 1,
        lineNumber: 0,
        localizationCall: null,
        stack: [],
      },
      {
        index: 2,
        lineNumber: 0,
        localizationCall: null,
        stack: [],
      },
      {
        index: 3,
        lineNumber: 0,
        localizationCall: null,
        stack: [],
      },
    ]);
  });

  it("reads a string", () => {
    let state = { index: 0, lineNumber: 0, stack: [] };
    const text = 'a"b"c';
    const actual = [];

    while ((state = readCharacter(text, state)) !== null) {
      actual.push(state);
    }

    expect(actual).toEqual([
      {
        index: 1,
        lineNumber: 0,
        localizationCall: null,
        stack: [],
      },
      {
        index: 2,
        lineNumber: 0,
        localizationCall: null,
        stack: ['"'],
      },
      {
        index: 3,
        lineNumber: 0,
        localizationCall: null,
        stack: ['"'],
      },
      {
        index: 4,
        lineNumber: 0,
        localizationCall: null,
        stack: [],
      },
      {
        index: 5,
        lineNumber: 0,
        localizationCall: null,
        stack: [],
      },
    ]);
  });

  it("reads a string surrounded in parenthesis", () => {
    let state = { index: 0, lineNumber: 0, stack: [] };
    const text = 'a("b")c';
    const actual = [];

    while ((state = readCharacter(text, state)) !== null) {
      actual.push(state);
    }

    expect(actual).toEqual([
      {
        index: 1,
        lineNumber: 0,
        localizationCall: null,
        stack: [],
      },
      {
        index: 2,
        lineNumber: 0,
        localizationCall: null,
        stack: ["("],
      },
      {
        index: 3,
        lineNumber: 0,
        localizationCall: null,
        stack: ['"', "("],
      },
      {
        index: 4,
        lineNumber: 0,
        localizationCall: null,
        stack: ['"', "("],
      },
      {
        index: 5,
        lineNumber: 0,
        localizationCall: null,
        stack: ["("],
      },
      {
        index: 6,
        lineNumber: 0,
        localizationCall: null,
        stack: [],
      },
      {
        index: 7,
        lineNumber: 0,
        localizationCall: null,
        stack: [],
      },
    ]);
  });

  it("doesn't add quoted parenthesis to the stack", () => {
    let state = { index: 0, lineNumber: 0, stack: [] };
    const text = 'a"(b)"c';
    const actual = [];

    while ((state = readCharacter(text, state)) !== null) {
      actual.push(state);
    }

    expect(actual).toEqual([
      {
        index: 1,
        lineNumber: 0,
        localizationCall: null,
        stack: [],
      },
      {
        index: 2,
        lineNumber: 0,
        localizationCall: null,
        stack: ['"'],
      },
      {
        index: 3,
        lineNumber: 0,
        localizationCall: null,
        stack: ['"'],
      },
      {
        index: 4,
        lineNumber: 0,
        localizationCall: null,
        stack: ['"'],
      },
      {
        index: 5,
        lineNumber: 0,
        localizationCall: null,
        stack: ['"'],
      },
      {
        index: 6,
        lineNumber: 0,
        localizationCall: null,
        stack: [],
      },
      {
        index: 7,
        lineNumber: 0,
        localizationCall: null,
        stack: [],
      },
    ]);
  });

  it("doesn't add commented quotes", () => {
    let state = { index: 0, lineNumber: 0, stack: [] };
    const text = '//"\n""';
    const actual = [];

    while ((state = readCharacter(text, state)) !== null) {
      actual.push(state);
    }

    expect(actual).toEqual([
      {
        index: 2,
        lineNumber: 0,
        localizationCall: null,
        stack: ["//"],
      },
      {
        index: 3,
        lineNumber: 0,
        localizationCall: null,
        stack: ["//"],
      },
      {
        index: 4,
        lineNumber: 1,
        localizationCall: null,
        stack: [],
      },
      {
        index: 5,
        lineNumber: 1,
        localizationCall: null,
        stack: ['"'],
      },
      {
        index: 6,
        lineNumber: 1,
        localizationCall: null,
        stack: [],
      },
    ]);
  });

  it("multiline comments comment quotes", () => {
    let state = { index: 0, lineNumber: 0, stack: [] };
    const text = '/*"\n*/""';
    const actual = [];

    while ((state = readCharacter(text, state)) !== null) {
      actual.push(state);
    }

    expect(actual).toEqual([
      {
        index: 2,
        lineNumber: 0,
        localizationCall: null,
        stack: ["/*"],
      },
      {
        index: 3,
        lineNumber: 0,
        localizationCall: null,
        stack: ["/*"],
      },
      {
        index: 4,
        lineNumber: 1,
        localizationCall: null,
        stack: ["/*"],
      },
      {
        index: 6,
        lineNumber: 1,
        localizationCall: null,
        stack: [],
      },
      {
        index: 7,
        lineNumber: 1,
        localizationCall: null,
        stack: ['"'],
      },
      {
        index: 8,
        lineNumber: 1,
        localizationCall: null,
        stack: [],
      },
    ]);
  });

  it.only("parses basic translation function", () => {
    let state = { index: 0, lineNumber: 0, stack: [] };
    const text = '__("a")b';
    const actual = [];

    while ((state = readCharacter(text, state)) !== null) {
      actual.push(state);
    }

    expect(actual).toEqual([
      {
        index: 7,
        lineNumber: 0,
        localizationCall: {
          fn: '__("a")',
          key: "a",
          particular: false,
          plural: false,
        },
        stack: [],
      },
      {
        index: 8,
        lineNumber: 0,
        localizationCall: null,
        stack: [],
      },
    ]);
  });

  it("parses basic translation function with context", () => {
    let state = { index: 0, lineNumber: 0, stack: [] };
    const text = '__p("a", "b")c';
    const actual = [];

    while ((state = readCharacter(text, state)) !== null) {
      actual.push(state);
    }

    expect(actual).toEqual([
      {
        index: 13,
        lineNumber: 0,
        localizationCall: {
          context: "a",
          fn: '__p("a", "b")',
          key: "b",
          particular: true,
          plural: false,
        },
        stack: [],
      },
      {
        index: 14,
        lineNumber: 0,
        localizationCall: null,
        stack: [],
      },
    ]);
  });

  it("parses basic plural translation function", () => {
    let state = { index: 0, lineNumber: 0, stack: [] };
    const text = '__n("%d cat", "%d cats", 1)b';
    const actual = [];

    while ((state = readCharacter(text, state)) !== null) {
      actual.push(state);
    }

    expect(actual).toEqual([
      {
        index: 27,
        lineNumber: 0,
        localizationCall: {
          fn: '__n("%d cat", "%d cats", 1)',
          key: "%d cat",
          particular: false,
          plural: true,
        },
        stack: [],
      },
      {
        index: 28,
        lineNumber: 0,
        localizationCall: null,
        stack: [],
      },
    ]);
  });

  it("parses basic plural translation function with context", () => {
    let state = { index: 0, lineNumber: 0, stack: [] };
    const text = '__np("a", "%d cat", "%d cats", 1)b';
    const actual = [];

    while ((state = readCharacter(text, state)) !== null) {
      actual.push(state);
    }

    expect(actual).toEqual([
      {
        index: 33,
        lineNumber: 0,
        localizationCall: {
          context: "a",
          fn: '__np("a", "%d cat", "%d cats", 1)',
          key: "%d cat",
          particular: true,
          plural: true,
        },
        stack: [],
      },
      {
        index: 34,
        lineNumber: 0,
        localizationCall: null,
        stack: [],
      },
    ]);
  });

  describe("polymer-style template strings", () => {
    it("parses basic translation function in [[]] interpolation string", () => {
      let state = { index: 0, lineNumber: 0, stack: [] };
      const text = '`[[__("a")]]`';
      const actual = [];

      while ((state = readCharacter(text, state)) !== null) {
        actual.push(state);
      }

      expect(actual).toEqual([
        {
          index: 1,
          lineNumber: 0,
          localizationCall: null,
          stack: ["`"],
        },
        {
          index: 3,
          lineNumber: 0,
          localizationCall: null,
          stack: ["[[", "`"],
        },
        {
          index: 10,
          lineNumber: 0,
          localizationCall: {
            fn: '__("a")',
            key: "a",
            particular: false,
            plural: false,
          },
          stack: ["[[", "`"],
        },
        {
          index: 12,
          lineNumber: 0,
          localizationCall: null,
          stack: ["`"],
        },
        {
          index: 13,
          lineNumber: 0,
          localizationCall: null,
          stack: [],
        },
      ]);
    });

    it("skips [ interpolation when not part of a string", () => {
      let state = { index: 0, lineNumber: 0, stack: [] };
      const text = "a[[b";
      const actual = [];

      while ((state = readCharacter(text, state)) !== null) {
        actual.push(state);
      }

      expect(actual).toEqual([
        {
          index: 1,
          lineNumber: 0,
          localizationCall: null,
          stack: [],
        },
        {
          index: 2,
          lineNumber: 0,
          localizationCall: null,
          stack: [],
        },
        {
          index: 3,
          lineNumber: 0,
          localizationCall: null,
          stack: [],
        },
        {
          index: 4,
          lineNumber: 0,
          localizationCall: null,
          stack: [],
        },
      ]);
    });

    it("skips ]] interpolation when not started", () => {
      let state = { index: 0, lineNumber: 0, stack: [] };
      const text = "a]]b";
      const actual = [];

      while ((state = readCharacter(text, state)) !== null) {
        actual.push(state);
      }

      expect(actual).toEqual([
        {
          index: 1,
          lineNumber: 0,
          localizationCall: null,
          stack: [],
        },
        {
          index: 2,
          lineNumber: 0,
          localizationCall: null,
          stack: [],
        },
        {
          index: 3,
          lineNumber: 0,
          localizationCall: null,
          stack: [],
        },
        {
          index: 4,
          lineNumber: 0,
          localizationCall: null,
          stack: [],
        },
      ]);
    });
  });

  describe("Angular style template strings", () => {
    it("parses basic translation function in {{}} interpolation string", () => {
      let state = { index: 0, lineNumber: 0, stack: [] };
      const text = '`{{__("a")}}`';
      const actual = [];

      while ((state = readCharacter(text, state)) !== null) {
        actual.push(state);
      }

      expect(actual).toEqual([
        {
          index: 1,
          lineNumber: 0,
          localizationCall: null,
          stack: ["`"],
        },
        {
          index: 3,
          lineNumber: 0,
          localizationCall: null,
          stack: ["{{", "`"],
        },
        {
          index: 10,
          lineNumber: 0,
          localizationCall: {
            fn: '__("a")',
            key: "a",
            particular: false,
            plural: false,
          },
          stack: ["{{", "`"],
        },
        {
          index: 12,
          lineNumber: 0,
          localizationCall: null,
          stack: ["`"],
        },
        {
          index: 13,
          lineNumber: 0,
          localizationCall: null,
          stack: [],
        },
      ]);
    });

    it("skips {{ interpolation when not part of a string", () => {
      let state = { index: 0, lineNumber: 0, stack: [] };
      const text = "a{{b";
      const actual = [];

      while ((state = readCharacter(text, state)) !== null) {
        actual.push(state);
      }

      expect(actual).toEqual([
        {
          index: 1,
          lineNumber: 0,
          localizationCall: null,
          stack: [],
        },
        {
          index: 2,
          lineNumber: 0,
          localizationCall: null,
          stack: [],
        },
        {
          index: 3,
          lineNumber: 0,
          localizationCall: null,
          stack: [],
        },
        {
          index: 4,
          lineNumber: 0,
          localizationCall: null,
          stack: [],
        },
      ]);
    });

    it("skips {{ interpolation when not on stack", () => {
      let state = { index: 0, lineNumber: 0, stack: [] };
      const text = "a}}b";
      const actual = [];

      while ((state = readCharacter(text, state)) !== null) {
        actual.push(state);
      }

      expect(actual).toEqual([
        {
          index: 1,
          lineNumber: 0,
          localizationCall: null,
          stack: [],
        },
        {
          index: 2,
          lineNumber: 0,
          localizationCall: null,
          stack: [],
        },
        {
          index: 3,
          lineNumber: 0,
          localizationCall: null,
          stack: [],
        },
        {
          index: 4,
          lineNumber: 0,
          localizationCall: null,
          stack: [],
        },
      ]);
    });
  });

  describe("Javscript style template strings", () => {
    it("parses basic translation function in `${}` interpolation string", () => {
      let state = { index: 0, lineNumber: 0, stack: [] };
      const text = '`${__("a")}`';
      const actual = [];

      while ((state = readCharacter(text, state)) !== null) {
        actual.push(state);
      }

      expect(actual).toEqual([
        {
          index: 1,
          lineNumber: 0,
          localizationCall: null,
          stack: ["`"],
        },
        {
          index: 3,
          lineNumber: 0,
          localizationCall: null,
          stack: ["${", "`"],
        },
        {
          index: 10,
          lineNumber: 0,
          localizationCall: {
            fn: '__("a")',
            key: "a",
            particular: false,
            plural: false,
          },
          stack: ["${", "`"],
        },
        {
          index: 11,
          lineNumber: 0,
          localizationCall: null,
          stack: ["`"],
        },
        {
          index: 12,
          lineNumber: 0,
          localizationCall: null,
          stack: [],
        },
      ]);
    });

    it("skips $ interpolation when not part of a string", () => {
      let state = { index: 0, lineNumber: 0, stack: [] };
      const text = "a${b";
      const actual = [];

      while ((state = readCharacter(text, state)) !== null) {
        actual.push(state);
      }

      expect(actual).toEqual([
        {
          index: 1,
          lineNumber: 0,
          localizationCall: null,
          stack: [],
        },
        {
          index: 2,
          lineNumber: 0,
          localizationCall: null,
          stack: [],
        },
        {
          index: 3,
          lineNumber: 0,
          localizationCall: null,
          stack: [],
        },
        {
          index: 4,
          lineNumber: 0,
          localizationCall: null,
          stack: [],
        },
      ]);
    });
  });

  describe("EJS style template strings", () => {
    it("parses basic translation function in <% %> interpolation string", () => {
      let state = { index: 0, lineNumber: 0, stack: [] };
      const text = '`<%:__("a")%>`';
      const actual = [];

      while ((state = readCharacter(text, state)) !== null) {
        actual.push(state);
      }

      expect(actual).toEqual([
        {
          index: 1,
          lineNumber: 0,
          localizationCall: null,
          stack: ["`"],
        },
        {
          index: 3,
          lineNumber: 0,
          localizationCall: null,
          stack: ["<%", "`"],
        },
        {
          index: 4,
          lineNumber: 0,
          localizationCall: null,
          stack: ["<%", "`"],
        },
        {
          index: 11,
          lineNumber: 0,
          localizationCall: {
            fn: '__("a")',
            key: "a",
            particular: false,
            plural: false,
          },
          stack: ["<%", "`"],
        },
        {
          index: 13,
          lineNumber: 0,
          localizationCall: null,
          stack: ["`"],
        },
        {
          index: 14,
          lineNumber: 0,
          localizationCall: null,
          stack: [],
        },
      ]);
    });

    it("skips < interpolation when no %", () => {
      let state = { index: 0, lineNumber: 0, stack: [] };
      const text = "a<b";
      const actual = [];

      while ((state = readCharacter(text, state)) !== null) {
        actual.push(state);
      }

      expect(actual).toEqual([
        {
          index: 1,
          lineNumber: 0,
          localizationCall: null,
          stack: [],
        },
        {
          index: 2,
          lineNumber: 0,
          localizationCall: null,
          stack: [],
        },
        {
          index: 3,
          lineNumber: 0,
          localizationCall: null,
          stack: [],
        },
      ]);
    });

    it("skips > interpolation when no %", () => {
      let state = { index: 0, lineNumber: 0, stack: [] };
      const text = "a%>b";
      const actual = [];

      while ((state = readCharacter(text, state)) !== null) {
        actual.push(state);
      }

      expect(actual).toEqual([
        {
          index: 1,
          lineNumber: 0,
          localizationCall: null,
          stack: [],
        },
        {
          index: 2,
          lineNumber: 0,
          localizationCall: null,
          stack: [],
        },
        {
          index: 3,
          lineNumber: 0,
          localizationCall: null,
          stack: [],
        },
        {
          index: 4,
          lineNumber: 0,
          localizationCall: null,
          stack: [],
        },
      ]);
    });
  });

  it("parses template translation function", () => {
    let state = { index: 0, lineNumber: 0, stack: [] };
    const text = "__`a`b";
    const actual = [];

    while ((state = readCharacter(text, state)) !== null) {
      actual.push(state);
    }

    expect(actual).toEqual([
      {
        index: 5,
        lineNumber: 0,
        localizationCall: {
          fn: "__`a`",
          key: "a",
          particular: false,
          plural: false,
        },
        stack: [],
      },
      {
        index: 6,
        lineNumber: 0,
        localizationCall: null,
        stack: [],
      },
    ]);
  });

  it("throws an exception when there is no closing quote", () => {
    let state = { index: 0, lineNumber: 0, stack: [] };
    const text = '"';
    const actual = [];

    expect(() => {
      while ((state = readCharacter(text, state)) !== null) {
        actual.push(state);
      }
    }).toThrow(new SyntaxError("text ended with unclosed stack items"));

    expect(actual).toEqual([
      {
        index: 1,
        lineNumber: 0,
        localizationCall: null,
        stack: ['"'],
      },
    ]);
  });

  it("throws an exception when parenthesis is not closed", () => {
    let state = { index: 0, lineNumber: 0, stack: [] };
    const text = "(";
    const actual = [];

    expect(() => {
      while ((state = readCharacter(text, state)) !== null) {
        actual.push(state);
      }
    }).toThrow(new SyntaxError("text ended with unclosed stack items"));

    expect(actual).toEqual([
      {
        index: 1,
        lineNumber: 0,
        localizationCall: null,
        stack: ["("],
      },
    ]);
  });

  it("throws an exception when a close parenthesis is used when there is no open", () => {
    let state = { index: 0, lineNumber: 0, stack: [] };
    const text = ")";
    const actual = [];

    expect(() => {
      while ((state = readCharacter(text, state)) !== null) {
        actual.push(state);
      }
    }).toThrow(new SyntaxError("missing matching opening brace"));

    expect(actual).toEqual([]);
  });

  it("throws an error when there is no string literal for the translation", () => {
    let state = { index: 0, lineNumber: 0, stack: [] };
    const text = "__(fish)";
    const actual = [];

    expect(() => {
      while ((state = readCharacter(text, state)) !== null) {
        actual.push(state);
      }
    }).toThrow(new SyntaxError("localization key must be a literal"));

    expect(actual).toEqual([]);
  });

  it("throws an error if quote is not the first character", () => {
    let state = { index: 0, lineNumber: 0, stack: [] };
    const text = '__(,"fish")';
    const actual = [];

    expect(() => {
      while ((state = readCharacter(text, state)) !== null) {
        actual.push(state);
      }
    }).toThrow(new SyntaxError("localization key must be a literal"));

    expect(actual).toEqual([]);
  });

  it("throws an error if string is empty", () => {
    let state = { index: 0, lineNumber: 0, stack: [] };
    const text = '__("")';
    const actual = [];

    expect(() => {
      while ((state = readCharacter(text, state)) !== null) {
        actual.push(state);
      }
    }).toThrow(new SyntaxError("key string argument is empty"));

    expect(actual).toEqual([]);
  });

  it("iterates * as a normal character", () => {
    let state = { index: 0, lineNumber: 0, stack: [] };
    const text = "a*b";
    const actual = [];

    while ((state = readCharacter(text, state)) !== null) {
      actual.push(state);
    }

    expect(actual).toEqual([
      {
        index: 1,
        lineNumber: 0,
        localizationCall: null,
        stack: [],
      },
      {
        index: 2,
        lineNumber: 0,
        localizationCall: null,
        stack: [],
      },
      {
        index: 3,
        lineNumber: 0,
        localizationCall: null,
        stack: [],
      },
    ]);
  });

  it("iterates / as a normal character", () => {
    let state = { index: 0, lineNumber: 0, stack: [] };
    const text = "a/b";
    const actual = [];

    while ((state = readCharacter(text, state)) !== null) {
      actual.push(state);
    }

    expect(actual).toEqual([
      {
        index: 1,
        lineNumber: 0,
        localizationCall: null,
        stack: [],
      },
      {
        index: 2,
        lineNumber: 0,
        localizationCall: null,
        stack: [],
      },
      {
        index: 3,
        lineNumber: 0,
        localizationCall: null,
        stack: [],
      },
    ]);
  });

  it("iterates _ as a normal character", () => {
    let state = { index: 0, lineNumber: 0, stack: [] };
    const text = "a_b";
    const actual = [];

    while ((state = readCharacter(text, state)) !== null) {
      actual.push(state);
    }

    expect(actual).toEqual([
      {
        index: 1,
        lineNumber: 0,
        localizationCall: null,
        stack: [],
      },
      {
        index: 2,
        lineNumber: 0,
        localizationCall: null,
        stack: [],
      },
      {
        index: 3,
        lineNumber: 0,
        localizationCall: null,
        stack: [],
      },
    ]);
  });

  it("escapes _", () => {
    let state = { index: 0, lineNumber: 0, stack: [] };
    const text = "a//_";
    const actual = [];

    while ((state = readCharacter(text, state)) !== null) {
      actual.push(state);
    }

    expect(actual).toEqual([
      {
        index: 1,
        lineNumber: 0,
        localizationCall: null,
        stack: [],
      },
      {
        index: 3,
        lineNumber: 0,
        localizationCall: null,
        stack: ["//"],
      },
      {
        index: 4,
        lineNumber: 0,
        localizationCall: null,
        stack: ["//"],
      },
    ]);
  });
});
