import readCharacter from "../readCharacter";

describe("plugins/readCharacter", () => {
  it("reads letters with no special meaning", () => {
    let state = { index: 0, stack: [], lineNumber: 0 };
    const text = "abc";
    const actual = [];

    while ((state = readCharacter(text, state)) !== null) {
      actual.push(state);
    }

    expect(actual).toEqual([
      {
        index: 1,
        stack: [],
        localizationCall: null,
        lineNumber: 0,
      },
      {
        index: 2,
        stack: [],
        localizationCall: null,
        lineNumber: 0,
      },
      {
        index: 3,
        stack: [],
        localizationCall: null,
        lineNumber: 0,
      },
    ]);
  });

  it("reads a string", () => {
    let state = { index: 0, stack: [], lineNumber: 0 };
    const text = 'a"b"c';
    const actual = [];

    while ((state = readCharacter(text, state)) !== null) {
      actual.push(state);
    }

    expect(actual).toEqual([
      {
        index: 1,
        stack: [],
        localizationCall: null,
        lineNumber: 0,
      },
      {
        index: 2,
        stack: ['"'],
        localizationCall: null,
        lineNumber: 0,
      },
      {
        index: 3,
        stack: ['"'],
        localizationCall: null,
        lineNumber: 0,
      },
      {
        index: 4,
        stack: [],
        localizationCall: null,
        lineNumber: 0,
      },
      {
        index: 5,
        stack: [],
        localizationCall: null,
        lineNumber: 0,
      },
    ]);
  });

  it("reads a string surrounded in parenthesis", () => {
    let state = { index: 0, stack: [], lineNumber: 0 };
    const text = 'a("b")c';
    const actual = [];

    while ((state = readCharacter(text, state)) !== null) {
      actual.push(state);
    }

    expect(actual).toEqual([
      {
        index: 1,
        stack: [],
        localizationCall: null,
        lineNumber: 0,
      },
      {
        index: 2,
        stack: ["("],
        localizationCall: null,
        lineNumber: 0,
      },
      {
        index: 3,
        stack: ['"', "("],
        localizationCall: null,
        lineNumber: 0,
      },
      {
        index: 4,
        stack: ['"', "("],
        localizationCall: null,
        lineNumber: 0,
      },
      {
        index: 5,
        stack: ["("],
        localizationCall: null,
        lineNumber: 0,
      },
      {
        index: 6,
        stack: [],
        localizationCall: null,
        lineNumber: 0,
      },
      {
        index: 7,
        stack: [],
        localizationCall: null,
        lineNumber: 0,
      },
    ]);
  });

  it("doesn't add quoted parenthesis to the stack", () => {
    let state = { index: 0, stack: [], lineNumber: 0 };
    const text = 'a"(b)"c';
    const actual = [];

    while ((state = readCharacter(text, state)) !== null) {
      actual.push(state);
    }

    expect(actual).toEqual([
      {
        index: 1,
        stack: [],
        localizationCall: null,
        lineNumber: 0,
      },
      {
        index: 2,
        stack: ['"'],
        localizationCall: null,
        lineNumber: 0,
      },
      {
        index: 3,
        stack: ['"'],
        localizationCall: null,
        lineNumber: 0,
      },
      {
        index: 4,
        stack: ['"'],
        localizationCall: null,
        lineNumber: 0,
      },
      {
        index: 5,
        stack: ['"'],
        localizationCall: null,
        lineNumber: 0,
      },
      {
        index: 6,
        stack: [],
        localizationCall: null,
        lineNumber: 0,
      },
      {
        index: 7,
        stack: [],
        localizationCall: null,
        lineNumber: 0,
      },
    ]);
  });

  it("doesn't add commented quotes", () => {
    let state = { index: 0, stack: [], lineNumber: 0 };
    const text = '//"\n""';
    const actual = [];

    while ((state = readCharacter(text, state)) !== null) {
      actual.push(state);
    }

    expect(actual).toEqual([
      {
        index: 2,
        stack: ["//"],
        localizationCall: null,
        lineNumber: 0,
      },
      {
        index: 3,
        stack: ["//"],
        localizationCall: null,
        lineNumber: 0,
      },
      {
        index: 4,
        stack: [],
        localizationCall: null,
        lineNumber: 1,
      },
      {
        index: 5,
        stack: ['"'],
        localizationCall: null,
        lineNumber: 1,
      },
      {
        index: 6,
        stack: [],
        localizationCall: null,
        lineNumber: 1,
      },
    ]);
  });

  it("multiline comments comment quotes", () => {
    let state = { index: 0, stack: [], lineNumber: 0 };
    const text = '/*"\n*/""';
    const actual = [];

    while ((state = readCharacter(text, state)) !== null) {
      actual.push(state);
    }

    expect(actual).toEqual([
      {
        index: 2,
        stack: ["/*"],
        localizationCall: null,
        lineNumber: 0,
      },
      {
        index: 3,
        stack: ["/*"],
        localizationCall: null,
        lineNumber: 0,
      },
      {
        index: 4,
        stack: ["/*"],
        localizationCall: null,
        lineNumber: 1,
      },
      {
        index: 6,
        stack: [],
        localizationCall: null,
        lineNumber: 1,
      },
      {
        index: 7,
        stack: ['"'],
        localizationCall: null,
        lineNumber: 1,
      },
      {
        index: 8,
        stack: [],
        localizationCall: null,
        lineNumber: 1,
      },
    ]);
  });

  fit("parses basic translation function", () => {
    let state = { index: 0, stack: [], lineNumber: 0 };
    const text = '__("a")b';
    const actual = [];

    while ((state = readCharacter(text, state)) !== null) {
      actual.push(state);
    }

    expect(actual).toEqual([
      {
        index: 7,
        stack: [],
        lineNumber: 0,
        localizationCall: {
          key: "a",
          fn: '__("a")',
          plural: false,
          particular: false,
        },
      },
      {
        index: 8,
        stack: [],
        localizationCall: null,
        lineNumber: 0,
      },
    ]);
  });

  it("parses basic translation function with context", () => {
    let state = { index: 0, stack: [], lineNumber: 0 };
    const text = '__p("a", "b")c';
    const actual = [];

    while ((state = readCharacter(text, state)) !== null) {
      actual.push(state);
    }

    expect(actual).toEqual([
      {
        index: 13,
        stack: [],
        lineNumber: 0,
        localizationCall: {
          context: "a",
          key: "b",
          fn: '__p("a", "b")',
          plural: false,
          particular: true,
        },
      },
      {
        index: 14,
        stack: [],
        localizationCall: null,
        lineNumber: 0,
      },
    ]);
  });

  it("parses basic plural translation function", () => {
    let state = { index: 0, stack: [], lineNumber: 0 };
    const text = '__n("%d cat", "%d cats", 1)b';
    const actual = [];

    while ((state = readCharacter(text, state)) !== null) {
      actual.push(state);
    }

    expect(actual).toEqual([
      {
        index: 27,
        stack: [],
        lineNumber: 0,
        localizationCall: {
          key: "%d cat",
          fn: '__n("%d cat", "%d cats", 1)',
          plural: true,
          particular: false,
        },
      },
      {
        index: 28,
        stack: [],
        localizationCall: null,
        lineNumber: 0,
      },
    ]);
  });

  it("parses basic plural translation function with context", () => {
    let state = { index: 0, stack: [], lineNumber: 0 };
    const text = '__np("a", "%d cat", "%d cats", 1)b';
    const actual = [];

    while ((state = readCharacter(text, state)) !== null) {
      actual.push(state);
    }

    expect(actual).toEqual([
      {
        index: 33,
        stack: [],
        lineNumber: 0,
        localizationCall: {
          key: "%d cat",
          context: "a",
          fn: '__np("a", "%d cat", "%d cats", 1)',
          plural: true,
          particular: true,
        },
      },
      {
        index: 34,
        stack: [],
        localizationCall: null,
        lineNumber: 0,
      },
    ]);
  });

  describe("polymer-style template strings", () => {
    it("parses basic translation function in [[]] interpolation string", () => {
      let state = { index: 0, stack: [], lineNumber: 0 };
      const text = '`[[__("a")]]`';
      const actual = [];

      while ((state = readCharacter(text, state)) !== null) {
        actual.push(state);
      }

      expect(actual).toEqual([
        {
          index: 1,
          stack: ["`"],
          localizationCall: null,
          lineNumber: 0,
        },
        {
          index: 3,
          stack: ["[[", "`"],
          localizationCall: null,
          lineNumber: 0,
        },
        {
          index: 10,
          stack: ["[[", "`"],
          lineNumber: 0,
          localizationCall: {
            key: "a",
            fn: '__("a")',
            particular: false,
            plural: false,
          },
        },
        {
          index: 12,
          stack: ["`"],
          localizationCall: null,
          lineNumber: 0,
        },
        {
          index: 13,
          stack: [],
          localizationCall: null,
          lineNumber: 0,
        },
      ]);
    });

    it("skips [ interpolation when not part of a string", () => {
      let state = { index: 0, stack: [], lineNumber: 0 };
      const text = "a[[b";
      const actual = [];

      while ((state = readCharacter(text, state)) !== null) {
        actual.push(state);
      }

      expect(actual).toEqual([
        {
          index: 1,
          stack: [],
          localizationCall: null,
          lineNumber: 0,
        },
        {
          index: 2,
          stack: [],
          localizationCall: null,
          lineNumber: 0,
        },
        {
          index: 3,
          stack: [],
          localizationCall: null,
          lineNumber: 0,
        },
        {
          index: 4,
          stack: [],
          localizationCall: null,
          lineNumber: 0,
        },
      ]);
    });

    it("skips ]] interpolation when not started", () => {
      let state = { index: 0, stack: [], lineNumber: 0 };
      const text = "a]]b";
      const actual = [];

      while ((state = readCharacter(text, state)) !== null) {
        actual.push(state);
      }

      expect(actual).toEqual([
        {
          index: 1,
          stack: [],
          localizationCall: null,
          lineNumber: 0,
        },
        {
          index: 2,
          stack: [],
          localizationCall: null,
          lineNumber: 0,
        },
        {
          index: 3,
          stack: [],
          localizationCall: null,
          lineNumber: 0,
        },
        {
          index: 4,
          stack: [],
          localizationCall: null,
          lineNumber: 0,
        },
      ]);
    });
  });

  describe("Angular style template strings", () => {
    it("parses basic translation function in {{}} interpolation string", () => {
      let state = { index: 0, stack: [], lineNumber: 0 };
      const text = '`{{__("a")}}`';
      const actual = [];

      while ((state = readCharacter(text, state)) !== null) {
        actual.push(state);
      }

      expect(actual).toEqual([
        {
          index: 1,
          stack: ["`"],
          localizationCall: null,
          lineNumber: 0,
        },
        {
          index: 3,
          stack: ["{{", "`"],
          localizationCall: null,
          lineNumber: 0,
        },
        {
          index: 10,
          stack: ["{{", "`"],
          lineNumber: 0,
          localizationCall: {
            key: "a",
            fn: '__("a")',
            particular: false,
            plural: false,
          },
        },
        {
          index: 12,
          stack: ["`"],
          localizationCall: null,
          lineNumber: 0,
        },
        {
          index: 13,
          stack: [],
          localizationCall: null,
          lineNumber: 0,
        },
      ]);
    });

    it("skips {{ interpolation when not part of a string", () => {
      let state = { index: 0, stack: [], lineNumber: 0 };
      const text = "a{{b";
      const actual = [];

      while ((state = readCharacter(text, state)) !== null) {
        actual.push(state);
      }

      expect(actual).toEqual([
        {
          index: 1,
          stack: [],
          localizationCall: null,
          lineNumber: 0,
        },
        {
          index: 2,
          stack: [],
          localizationCall: null,
          lineNumber: 0,
        },
        {
          index: 3,
          stack: [],
          localizationCall: null,
          lineNumber: 0,
        },
        {
          index: 4,
          stack: [],
          localizationCall: null,
          lineNumber: 0,
        },
      ]);
    });

    it("skips {{ interpolation when not on stack", () => {
      let state = { index: 0, stack: [], lineNumber: 0 };
      const text = "a}}b";
      const actual = [];

      while ((state = readCharacter(text, state)) !== null) {
        actual.push(state);
      }

      expect(actual).toEqual([
        {
          index: 1,
          stack: [],
          localizationCall: null,
          lineNumber: 0,
        },
        {
          index: 2,
          stack: [],
          localizationCall: null,
          lineNumber: 0,
        },
        {
          index: 3,
          stack: [],
          localizationCall: null,
          lineNumber: 0,
        },
        {
          index: 4,
          stack: [],
          localizationCall: null,
          lineNumber: 0,
        },
      ]);
    });
  });

  describe("Javscript style template strings", () => {
    it("parses basic translation function in `${}` interpolation string", () => {
      let state = { index: 0, stack: [], lineNumber: 0 };
      const text = '`${__("a")}`';
      const actual = [];

      while ((state = readCharacter(text, state)) !== null) {
        actual.push(state);
      }

      expect(actual).toEqual([
        {
          index: 1,
          stack: ["`"],
          localizationCall: null,
          lineNumber: 0,
        },
        {
          index: 3,
          stack: ["${", "`"],
          localizationCall: null,
          lineNumber: 0,
        },
        {
          index: 10,
          stack: ["${", "`"],
          lineNumber: 0,
          localizationCall: {
            key: "a",
            fn: '__("a")',
            particular: false,
            plural: false,
          },
        },
        {
          index: 11,
          stack: ["`"],
          localizationCall: null,
          lineNumber: 0,
        },
        {
          index: 12,
          stack: [],
          localizationCall: null,
          lineNumber: 0,
        },
      ]);
    });

    it("skips $ interpolation when not part of a string", () => {
      let state = { index: 0, stack: [], lineNumber: 0 };
      const text = "a${b";
      const actual = [];

      while ((state = readCharacter(text, state)) !== null) {
        actual.push(state);
      }

      expect(actual).toEqual([
        {
          index: 1,
          stack: [],
          localizationCall: null,
          lineNumber: 0,
        },
        {
          index: 2,
          stack: [],
          localizationCall: null,
          lineNumber: 0,
        },
        {
          index: 3,
          stack: [],
          localizationCall: null,
          lineNumber: 0,
        },
        {
          index: 4,
          stack: [],
          localizationCall: null,
          lineNumber: 0,
        },
      ]);
    });
  });

  describe("EJS style template strings", () => {
    it("parses basic translation function in <% %> interpolation string", () => {
      let state = { index: 0, stack: [], lineNumber: 0 };
      const text = '`<%:__("a")%>`';
      const actual = [];

      while ((state = readCharacter(text, state)) !== null) {
        actual.push(state);
      }

      expect(actual).toEqual([
        {
          index: 1,
          stack: ["`"],
          localizationCall: null,
          lineNumber: 0,
        },
        {
          index: 3,
          stack: ["<%", "`"],
          localizationCall: null,
          lineNumber: 0,
        },
        {
          index: 4,
          stack: ["<%", "`"],
          localizationCall: null,
          lineNumber: 0,
        },
        {
          index: 11,
          stack: ["<%", "`"],
          lineNumber: 0,
          localizationCall: {
            key: "a",
            fn: '__("a")',
            plural: false,
            particular: false,
          },
        },
        {
          index: 13,
          stack: ["`"],
          localizationCall: null,
          lineNumber: 0,
        },
        {
          index: 14,
          stack: [],
          localizationCall: null,
          lineNumber: 0,
        },
      ]);
    });

    it("skips < interpolation when no %", () => {
      let state = { index: 0, stack: [], lineNumber: 0 };
      const text = "a<b";
      const actual = [];

      while ((state = readCharacter(text, state)) !== null) {
        actual.push(state);
      }

      expect(actual).toEqual([
        {
          index: 1,
          stack: [],
          localizationCall: null,
          lineNumber: 0,
        },
        {
          index: 2,
          stack: [],
          localizationCall: null,
          lineNumber: 0,
        },
        {
          index: 3,
          stack: [],
          localizationCall: null,
          lineNumber: 0,
        },
      ]);
    });

    it("skips > interpolation when no %", () => {
      let state = { index: 0, stack: [], lineNumber: 0 };
      const text = "a%>b";
      const actual = [];

      while ((state = readCharacter(text, state)) !== null) {
        actual.push(state);
      }

      expect(actual).toEqual([
        {
          index: 1,
          stack: [],
          localizationCall: null,
          lineNumber: 0,
        },
        {
          index: 2,
          stack: [],
          localizationCall: null,
          lineNumber: 0,
        },
        {
          index: 3,
          stack: [],
          localizationCall: null,
          lineNumber: 0,
        },
        {
          index: 4,
          stack: [],
          localizationCall: null,
          lineNumber: 0,
        },
      ]);
    });
  });

  it("parses template translation function", () => {
    let state = { index: 0, stack: [], lineNumber: 0 };
    const text = "__`a`b";
    const actual = [];

    while ((state = readCharacter(text, state)) !== null) {
      actual.push(state);
    }

    expect(actual).toEqual([
      {
        index: 5,
        stack: [],
        lineNumber: 0,
        localizationCall: {
          key: "a",
          fn: "__`a`",
          particular: false,
          plural: false,
        },
      },
      {
        index: 6,
        stack: [],
        localizationCall: null,
        lineNumber: 0,
      },
    ]);
  });

  it("throws an exception when there is no closing quote", () => {
    let state = { index: 0, stack: [], lineNumber: 0 };
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
        stack: ['"'],
        localizationCall: null,
        lineNumber: 0,
      },
    ]);
  });

  it("throws an exception when parenthesis is not closed", () => {
    let state = { index: 0, stack: [], lineNumber: 0 };
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
        stack: ["("],
        localizationCall: null,
        lineNumber: 0,
      },
    ]);
  });

  it("throws an exception when a close parenthesis is used when there is no open", () => {
    let state = { index: 0, stack: [], lineNumber: 0 };
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
    let state = { index: 0, stack: [], lineNumber: 0 };
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
    let state = { index: 0, stack: [], lineNumber: 0 };
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
    let state = { index: 0, stack: [], lineNumber: 0 };
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
    let state = { index: 0, stack: [], lineNumber: 0 };
    const text = "a*b";
    const actual = [];

    while ((state = readCharacter(text, state)) !== null) {
      actual.push(state);
    }

    expect(actual).toEqual([
      {
        index: 1,
        stack: [],
        localizationCall: null,
        lineNumber: 0,
      },
      {
        index: 2,
        stack: [],
        localizationCall: null,
        lineNumber: 0,
      },
      {
        index: 3,
        stack: [],
        localizationCall: null,
        lineNumber: 0,
      },
    ]);
  });

  it("iterates / as a normal character", () => {
    let state = { index: 0, stack: [], lineNumber: 0 };
    const text = "a/b";
    const actual = [];

    while ((state = readCharacter(text, state)) !== null) {
      actual.push(state);
    }

    expect(actual).toEqual([
      {
        index: 1,
        stack: [],
        localizationCall: null,
        lineNumber: 0,
      },
      {
        index: 2,
        stack: [],
        localizationCall: null,
        lineNumber: 0,
      },
      {
        index: 3,
        stack: [],
        localizationCall: null,
        lineNumber: 0,
      },
    ]);
  });

  it("iterates _ as a normal character", () => {
    let state = { index: 0, stack: [], lineNumber: 0 };
    const text = "a_b";
    const actual = [];

    while ((state = readCharacter(text, state)) !== null) {
      actual.push(state);
    }

    expect(actual).toEqual([
      {
        index: 1,
        stack: [],
        localizationCall: null,
        lineNumber: 0,
      },
      {
        index: 2,
        stack: [],
        localizationCall: null,
        lineNumber: 0,
      },
      {
        index: 3,
        stack: [],
        localizationCall: null,
        lineNumber: 0,
      },
    ]);
  });

  it("escapes _", () => {
    let state = { index: 0, stack: [], lineNumber: 0 };
    const text = "a//_";
    const actual = [];

    while ((state = readCharacter(text, state)) !== null) {
      actual.push(state);
    }

    expect(actual).toEqual([
      {
        index: 1,
        stack: [],
        localizationCall: null,
        lineNumber: 0,
      },
      {
        index: 3,
        stack: ["//"],
        localizationCall: null,
        lineNumber: 0,
      },
      {
        index: 4,
        stack: ["//"],
        localizationCall: null,
        lineNumber: 0,
      },
    ]);
  });
});
