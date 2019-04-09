const readCharacter = require('./readCharacter');

describe('readCharacter', () => {
  it('reads letters with no special meaning', () => {
    let state = {index: 0, stack: [], lineNumber: 0}
    const text = 'abc';
    const actual = [];

    while ((state = readCharacter(text, state)) !== null) {
      actual.push(state);
    }

    expect(actual).toEqual([{
      character: 'a',
      index: 1,
      stack: [],
      lineNumber: 0
    }, {
      character: 'b',
      index: 2,
      stack: [],
      lineNumber: 0
    }, {
      character: 'c',
      index: 3,
      stack: [],
      lineNumber: 0
    }]);
  });

  it('read from beginning when no initial state', () => {
    let state = undefined
    const text = 'a"b"c';
    const actual = [];

    while ((state = readCharacter(text, state)) !== null) {
      actual.push(state);
    }

    expect(actual).toEqual([{
      character: 'a',
      index: 1,
      stack: [],
      lineNumber: 0
    }, {
      character: '"',
      index: 2,
      stack: ['"'],
      lineNumber: 0
    }, {
      character: 'b',
      index: 3,
      stack: ['"'],
      lineNumber: 0
    }, {
      character: '"',
      index: 4,
      stack: [],
      lineNumber: 0
    }, {
      character: 'c',
      index: 5,
      stack: [],
      lineNumber: 0
    }]);
  });

  it('reads a string surrounded in parenthesis', () => {
    let state = {index: 0, stack: [], lineNumber: 0}
    const text = 'a("b")c';
    const actual = [];

    while ((state = readCharacter(text, state)) !== null) {
      actual.push(state);
    }

    expect(actual).toEqual([{
      character: 'a',
      index: 1,
      stack: [],
      lineNumber: 0
    }, {
      character: '(',
      index: 2,
      stack: ['('],
      lineNumber: 0
    }, {
      character: '"',
      index: 3,
      stack: ['"', '('],
      lineNumber: 0
    }, {
      character: 'b',
      index: 4,
      stack: ['"', '('],
      lineNumber: 0
    }, {
      character: '"',
      index: 5,
      stack: ['('],
      lineNumber: 0
    }, {
      character: ')',
      index: 6,
      stack: [],
      lineNumber: 0
    }, {
      character: 'c',
      index: 7,
      stack: [],
      lineNumber: 0
    }]);
  });

  it('doesn\'t add quoted parenthesis to the stack', () => {
    let state = {index: 0, stack: [], lineNumber: 0}
    const text = 'a"(b)"c';
    const actual = [];

    while ((state = readCharacter(text, state)) !== null) {
      actual.push(state);
    }

    expect(actual).toEqual([{
      character: 'a',
      index: 1,
      stack: [],
      lineNumber: 0
    }, {
      character: '"',
      index: 2,
      stack: ['"'],
      lineNumber: 0
    }, {
      character: '(',
      index: 3,
      stack: ['"'],
      lineNumber: 0
    }, {
      character: 'b',
      index: 4,
      stack: ['"'],
      lineNumber: 0
    }, {
      character: ')',
      index: 5,
      stack: ['"'],
      lineNumber: 0
    }, {
      character: '"',
      index: 6,
      stack: [],
      lineNumber: 0
    }, {
      character: 'c',
      index: 7,
      stack: [],
      lineNumber: 0
    }]);
  });

  it('doesn\'t add commented quotes', () => {
    let state = {index: 0, stack: [], lineNumber: 0}
    const text = '//"\n""';
    const actual = [];

    while ((state = readCharacter(text, state)) !== null) {
      actual.push(state);
    }

    expect(actual).toEqual([{
      character: '//',
      comments: '',
      index: 2,
      stack: ['//'],
      lineNumber: 0
    }, {
      character: '"',
      comments: '"',
      index: 3,
      stack: ['//'],
      lineNumber: 0
    }, {
      character: '\n',
      index: 4,
      stack: [],
      lineNumber: 1
    }, {
      character: '"',
      index: 5,
      stack: ['"'],
      lineNumber: 1
    }, {
      character: '"',
      index: 6,
      stack: [],
      lineNumber: 1
    }]);
  });

  it('multiline comments comments quotes', () => {
    let state = {index: 0, stack: [], lineNumber: 0}
    const text = '/*"\n*/""';
    const actual = [];

    while ((state = readCharacter(text, state)) !== null) {
      actual.push(state);
    }

    expect(actual).toEqual([{
      character: '/*',
      comments: '',
      index: 2,
      stack: ['/*'],
      lineNumber: 0
    }, {
      character: '"',
      comments: '"',
      index: 3,
      stack: ['/*'],
      lineNumber: 0
    }, {
      character: '\n',
      comments: '"\n',
      index: 4,
      stack: ['/*'],
      lineNumber: 1
    }, {
      character: "*/",
      comments: '"\n',
      index: 6,
      stack: [],
      lineNumber: 1
    }, {
      character: '"',
      index: 7,
      stack: ['"'],
      lineNumber: 1
    }, {
      character: '"',
      index: 8,
      stack: [],
      lineNumber: 1
    }]);
  });

  it('parses basic translation function', () => {
    let state = {index: 0, stack: [], lineNumber: 0}
    const text = '__("a")b';
    const actual = [];

    while ((state = readCharacter(text, state)) !== null) {
      actual.push(state);
    }

    expect(actual).toEqual([{
      character: '__("a")',
      index: 7,
      stack: [],
      lineNumber: 0,
      localization: {
        key: 'a',
        fn: '__("a")',
        number: false,
        particular: false,
      }
    }, {
      character: 'b',
      index: 8,
      stack: [],
      lineNumber: 0,
    }]);
  });

  describe('comments', () => {
    describe('block comments', () => {
      it('doesn\'t trim whitespace on block comments', () => {
        let state = {index: 0, stack: [], lineNumber: 0}
        const text = '/* t */__("a")b';
        const actual = [];

        while ((state = readCharacter(text, state)) !== null) {
          actual.push(state);
        }

        expect(actual).toEqual([{
          "character": "/*",
          "comments": "",
          "index": 2,
          "lineNumber": 0,
          "stack": [
            "/*",
          ],
        }, {
          "character": " ",
          "comments": " ",
          "index": 3,
          "lineNumber": 0,
          "stack": [
            "/*",
          ],
        }, {
          "character": "t",
          "comments": " t",
          "index": 4,
          "lineNumber": 0,
          "stack": [
            "/*",
          ],
        }, {
          "character": " ",
          "comments": " t ",
          "index": 5,
          "lineNumber": 0,
          "stack": [
            "/*",
          ],
        }, {
          "character": "*/",
          "comments": " t ",
          "index": 7,
          "lineNumber": 0,
          "stack": [],
        }, {
          "character": "__(\"a\")",
          "index": 14,
          "lineNumber": 0,
          "localization": {
            "fn": "__(\"a\")",
            "key": "a",
            "particular": false,
            "number": false,
          },
          "stack": [],
        }, {
          "character": "b",
          "index": 15,
          "lineNumber": 0,
          "stack": [],
        }]);
      });
    });
  });

  describe('with inner comments', () => {
    describe('block comments', () => {
      it('doesn\'t trim whitespace on block comments', () => {
        let state = {index: 0, stack: [], lineNumber: 0}
        const text = '__(/* test */"a")b';
        const actual = [];

        while ((state = readCharacter(text, state)) !== null) {
          actual.push(state);
        }

        expect(actual).toEqual([{
          character: '__(/* test */"a")',
          index: 17,
          stack: [],
          lineNumber: 0,
          localization: {
            key: 'a',
            comments: ' test ',
            fn: '__("a")',
            number: false,
            particular: false,
          }
        }, {
          character: 'b',
          index: 18,
          stack: [],
          lineNumber: 0,
        }]);
      });

      it('merges adjacent block comments', () => {
        let state = {index: 0, stack: [], lineNumber: 0}
        const text = '__(/*one*/ /*two*/"a")b';
        const actual = [];

        while ((state = readCharacter(text, state)) !== null) {
          actual.push(state);
        }

        expect(actual).toEqual([{
          character: '__(/*one*/ /*two*/"a")',
          index: 22,
          stack: [],
          lineNumber: 0,
          localization: {
            key: 'a',
            comments: 'one\ntwo',
            fn: '__("a")',
            number: false,
            particular: false,
          }
        }, {
          character: 'b',
          index: 23,
          stack: [],
          lineNumber: 0,
        }]);
      });

      it('merges block comments when both before and after key', () => {
        let state = {index: 0, stack: [], lineNumber: 0}
        const text = '__(/*test 1*/"a"/*test 2*/)b';
        const actual = [];

        while ((state = readCharacter(text, state)) !== null) {
          actual.push(state);
        }

        expect(actual).toEqual([{
          character: '__(/*test 1*/"a"/*test 2*/)',
          index: 27,
          stack: [],
          lineNumber: 0,
          localization: {
            key: 'a',
            comments: 'test 1\ntest 2',
            fn: '__("a")',
            number: false,
            particular: false,
          }
        }, {
          character: 'b',
          index: 28,
          stack: [],
          lineNumber: 0,
        }]);
      });

      it('parses block comments when before key', () => {
        let state = {index: 0, stack: [], lineNumber: 0}
        const text = '__(/*test*/"a")b';
        const actual = [];

        while ((state = readCharacter(text, state)) !== null) {
          actual.push(state);
        }

        expect(actual).toEqual([{
          character: '__(/*test*/"a")',
          index: 15,
          stack: [],
          lineNumber: 0,
          localization: {
            key: 'a',
            comments: 'test',
            fn: '__("a")',
            number: false,
            particular: false,
          }
        }, {
          character: 'b',
          index: 16,
          stack: [],
          lineNumber: 0,
        }]);
      });

      it('parses block comments when after key', () => {
        let state = {index: 0, stack: [], lineNumber: 0}
        const text = '__("a"/*test*/)b';
        const actual = [];

        while ((state = readCharacter(text, state)) !== null) {
          actual.push(state);
        }

        expect(actual).toEqual([{
          character: '__("a"/*test*/)',
          index: 15,
          stack: [],
          lineNumber: 0,
          localization: {
            key: 'a',
            comments: 'test',
            fn: '__("a")',
            number: false,
            particular: false,
          }
        }, {
          character: 'b',
          index: 16,
          stack: [],
          lineNumber: 0,
        }]);
      });
    });

    it('parses block comments when after key and number', () => {
      let state = {index: 0, stack: [], lineNumber: 0}
      const text = '__n("a", "b", 3/*test*/)b';
      const actual = [];

      while ((state = readCharacter(text, state)) !== null) {
        actual.push(state);
      }

      expect(actual).toEqual([{
        character: '__n("a", "b", 3/*test*/)',
        index: 24,
        stack: [],
        lineNumber: 0,
        localization: {
          key: 'a',
          comments: 'test',
          fn: '__n("a","b")',
          number: true,
          particular: false,
          plural: "b",
        }
      }, {
        character: 'b',
        index: 25,
        stack: [],
        lineNumber: 0,
      }]);
    });

    describe('line comments', () => {
      it('parses line comments when before key', () => {
        let state = {index: 0, stack: [], lineNumber: 0}
        const text = '__(//test\n"a")b';
        const actual = [];

        while ((state = readCharacter(text, state)) !== null) {
          actual.push(state);
        }

        expect(actual).toEqual([{
          character: '__(//test\n"a")',
          index: 14,
          stack: [],
          lineNumber: 1,
          localization: {
            key: 'a',
            comments: 'test',
            fn: '__("a")',
            number: false,
            particular: false,
          }
        }, {
          character: 'b',
          index: 15,
          stack: [],
          lineNumber: 1,
        }]);
      });

      it('parses line comments when after key', () => {
        let state = {index: 0, stack: [], lineNumber: 0}
        const text = '__("a"//test\n)b';
        const actual = [];

        while ((state = readCharacter(text, state)) !== null) {
          actual.push(state);
        }

        expect(actual).toEqual([{
          character: '__("a"//test\n)',
          index: 14,
          stack: [],
          lineNumber: 1,
          localization: {
            key: 'a',
            comments: 'test',
            fn: '__("a")',
            number: false,
            particular: false,
          }
        }, {
          character: 'b',
          index: 15,
          stack: [],
          lineNumber: 1,
        }]);
      });
    });
  });

  it('parses basic translation function with context', () => {
    let state = {index: 0, stack: [], lineNumber: 0}
    const text = '__p("a", "b")c';
    const actual = [];

    while ((state = readCharacter(text, state)) !== null) {
      actual.push(state);
    }

    expect(actual).toEqual([{
      character: '__p("a", "b")',
      index: 13,
      stack: [],
      lineNumber: 0,
      localization: {
        context: 'a',
        key: 'b',
        fn: '__p("a","b")',
        number: false,
        particular: true,
      }
    }, {
      character: 'c',
      index: 14,
      stack: [],
      lineNumber: 0,
    }]);
  });

  it('parses basic number translation function', () => {
    let state = {index: 0, stack: [], lineNumber: 0}
    const text = '__n("%d cat", "%d cats", 1)b';
    const actual = [];

    while ((state = readCharacter(text, state)) !== null) {
      actual.push(state);
    }

    expect(actual).toEqual([{
      character: '__n("%d cat", "%d cats", 1)',
      index: 27,
      stack: [],
      lineNumber: 0,
      localization: {
        key: '%d cat',
        fn: '__n("%d cat","%d cats")',
        number: true,
        particular: false,
        plural: "%d cats",
      }
    }, {
      character: 'b',
      index: 28,
      stack: [],
      lineNumber: 0,
    }]);
  });

  it('parses basic number translation function with context', () => {
    let state = {index: 0, stack: [], lineNumber: 0}
    const text = '__np("a", "%d cat", "%d cats", 1)b';
    const actual = [];

    while ((state = readCharacter(text, state)) !== null) {
      actual.push(state);
    }

    expect(actual).toEqual([{
      character: '__np("a", "%d cat", "%d cats", 1)',
      index: 33,
      stack: [],
      lineNumber: 0,
      localization: {
        key: '%d cat',
        context: 'a',
        fn: '__np("a","%d cat","%d cats")',
        number: true,
        particular: true,
        plural: "%d cats",
      }
    }, {
      character: 'b',
      index: 34,
      stack: [],
      lineNumber: 0,
    }]);
  });

  describe('polymer-style template strings', () => {
    it('parses basic translation function in [[]] interpolation string', () => {
      let state = {index: 0, stack: [], lineNumber: 0}
      const text = '`[[__("a")]]`';
      const actual = [];

      while ((state = readCharacter(text, state)) !== null) {
        actual.push(state);
      }

      expect(actual).toEqual([{
        character: '`',
        index: 1,
        stack: [
          "`"
        ],
        lineNumber: 0
      }, {
        character: '[[',
        index: 3,
        stack: [
          "[[",
          "`"
        ],
        lineNumber: 0
      }, {
        character: '__("a")',
        index: 10,
        stack: [
          "[[",
          "`"
        ],
        lineNumber: 0,
        localization: {
          "key": "a",
          "fn": "__(\"a\")",
          particular: false,
          number: false,
        }
      }, {
        character: ']]',
        index: 12,
        stack: [
          "`"
        ],
        lineNumber: 0
      }, {
        character: '`',
        index: 13,
        stack: [
        ],
        lineNumber: 0
      }]);
    });

    it('skips [ interpolation when not part of a string', () => {
      let state = {index: 0, stack: [], lineNumber: 0}
      const text = 'a[[b';
      const actual = [];

      while ((state = readCharacter(text, state)) !== null) {
        actual.push(state);
      }

      expect(actual).toEqual([{
        character: 'a',
        index: 1,
        stack: [],
        lineNumber: 0
      }, {
        character: '[',
        index: 2,
        stack: [],
        "lineNumber": 0
      }, {
        character: '[',
        index: 3,
        stack: [],
        "lineNumber": 0
      }, {
        character: 'b',
        index: 4,
        stack: [],
        lineNumber: 0
      }]);
    });

    it('skips ]] interpolation when not started', () => {
      let state = {index: 0, stack: [], lineNumber: 0}
      const text = 'a]]b';
      const actual = [];

      while ((state = readCharacter(text, state)) !== null) {
        actual.push(state);
      }

      expect(actual).toEqual([{
        character: 'a',
        index: 1,
        stack: [],
        lineNumber: 0
      }, {
        character: ']',
        index: 2,
        stack: [],
        "lineNumber": 0
      }, {
        character: ']',
        index: 3,
        stack: [],
        "lineNumber": 0
      }, {
        character: 'b',
        index: 4,
        stack: [],
        lineNumber: 0
      }]);
    });
  });

  describe('Angular style template strings', () => {
    it('parses basic translation function in {{}} interpolation string', () => {
      let state = {index: 0, stack: [], lineNumber: 0}
      const text = '`{{__("a")}}`';
      const actual = [];

      while ((state = readCharacter(text, state)) !== null) {
        actual.push(state);
      }

      expect(actual).toEqual([{
        character: '`',
        index: 1,
        stack: [
          "`"
        ],
        lineNumber: 0
      }, {
        character: '{{',
        index: 3,
        stack: [
          "{{",
          "`"
        ],
        lineNumber: 0
      }, {
        character: '__("a")',
        index: 10,
        stack: [
          "{{",
          "`"
        ],
        lineNumber: 0,
        localization: {
          "key": "a",
          "fn": "__(\"a\")",
          particular: false,
          number: false,
        }
      }, {
        character: '}}',
        index: 12,
        stack: [
          "`"
        ],
        lineNumber: 0
      }, {
        character: '`',
        index: 13,
        stack: [
        ],
        lineNumber: 0
      }]);
    });

    it('skips {{ interpolation when not part of a string', () => {
      let state = {index: 0, stack: [], lineNumber: 0}
      const text = 'a{{b';
      const actual = [];

      while ((state = readCharacter(text, state)) !== null) {
        actual.push(state);
      }

      expect(actual).toEqual([{
        character: 'a',
        index: 1,
        stack: [],
        lineNumber: 0
      }, {
        character: '{',
        index: 2,
        stack: [],
        "lineNumber": 0
      }, {
        character: '{',
        index: 3,
        stack: [],
        "lineNumber": 0
      }, {
        character: 'b',
        index: 4,
        stack: [],
        lineNumber: 0
      }]);
    });

    it('skips {{ interpolation when not on stack', () => {
      let state = {index: 0, stack: [], lineNumber: 0}
      const text = 'a}}b';
      const actual = [];

      while ((state = readCharacter(text, state)) !== null) {
        actual.push(state);
      }

      expect(actual).toEqual([{
        character: 'a',
        index: 1,
        stack: [],
        lineNumber: 0
      }, {
        character: '}',
        index: 2,
        stack: [],
        "lineNumber": 0
      }, {
        character: '}',
        index: 3,
        stack: [],
        "lineNumber": 0
      }, {
        character: 'b',
        index: 4,
        stack: [],
        lineNumber: 0
      }]);
    });
  });

  describe('Javscript style template strings', () => {
    it('parses basic translation function in `${}` interpolation string', () => {
      let state = {index: 0, stack: [], lineNumber: 0}
      const text = '`${__("a")}`';
      const actual = [];

      while ((state = readCharacter(text, state)) !== null) {
        actual.push(state);
      }

      expect(actual).toEqual([{
        character: '`',
        index: 1,
        stack: [
          "`"
        ],
        lineNumber: 0
      }, {
        character: '${',
        index: 3,
        stack: [
          "${",
          "`"
        ],
        lineNumber: 0
      }, {
        character: '__("a")',
        index: 10,
        stack: [
          "${",
          "`"
        ],
        lineNumber: 0,
        localization: {
          "key": "a",
          "fn": "__(\"a\")",
          particular: false,
          number: false
        }
      }, {
        character: "}",
        index: 11,
        stack: [
          "`"
        ],
        lineNumber: 0
      }, {
        character: '`',
        index: 12,
        stack: [
        ],
        lineNumber: 0
      }]);
    });

    it('skips $ interpolation when not part of a string', () => {
      let state = {index: 0, stack: [], lineNumber: 0}
      const text = 'a${b';
      const actual = [];

      while ((state = readCharacter(text, state)) !== null) {
        actual.push(state);
      }

      expect(actual).toEqual([{
        character: 'a',
        index: 1,
        stack: [],
        lineNumber: 0
      }, {
        character: '$',
        index: 2,
        stack: [],
        "lineNumber": 0
      }, {
        character: '{',
        index: 3,
        stack: [],
        "lineNumber": 0
      }, {
        character: 'b',
        index: 4,
        stack: [],
        lineNumber: 0
      }]);
    });
  });

  describe('EJS style template strings', () => {
    it('parses basic translation function in <% %> interpolation string', () => {
      let state = {index: 0, stack: [], lineNumber: 0}
      const text = '`<%:__("a")%>`';
      const actual = [];

      while ((state = readCharacter(text, state)) !== null) {
        actual.push(state);
      }

      expect(actual).toEqual([{
        character: '`',
        index: 1,
        stack: [
          "`"
        ],
        lineNumber: 0
      }, {
        character: '<%',
        index: 3,
        stack: [
          "<%",
          "`"
        ],
        lineNumber: 0
      }, {
        character: ':',
        index: 4,
        stack: [
          "<%",
          "`"
        ],
        lineNumber: 0
      }, {
        index: 11,
        stack: [
          "<%",
          "`"
        ],
        character: '__("a")',
        lineNumber: 0,
        localization: {
          "key": "a",
          "fn": "__(\"a\")",
          number: false,
          particular: false,
        }
      }, {
        character: '%>',
        index: 13,
        stack: [
          "`"
        ],
        lineNumber: 0
      }, {
        character: '`',
        index: 14,
        stack: [
        ],
        lineNumber: 0
      }]);
    });

    it('skips < interpolation when no %', () => {
      let state = {index: 0, stack: [], lineNumber: 0}
      const text = 'a<b';
      const actual = [];

      while ((state = readCharacter(text, state)) !== null) {
        actual.push(state);
      }

      expect(actual).toEqual([{
        character: 'a',
        index: 1,
        stack: [],
        lineNumber: 0
      }, {
        character: '<',
        index: 2,
        stack: [],
        "lineNumber": 0
      }, {
        character: 'b',
        index: 3,
        stack: [],
        lineNumber: 0
      }]);
    });

    it('skips > interpolation when no %', () => {
      let state = {index: 0, stack: [], lineNumber: 0}
      const text = 'a%>b';
      const actual = [];

      while ((state = readCharacter(text, state)) !== null) {
        actual.push(state);
      }

      expect(actual).toEqual([{
        character: 'a',
        index: 1,
        stack: [],
        lineNumber: 0
      }, {
        character: '%',
        index: 2,
        stack: [],
        "lineNumber": 0
      }, {
        character: '>',
        index: 3,
        stack: [],
        "lineNumber": 0
      }, {
        character: 'b',
        index: 4,
        stack: [],
        lineNumber: 0
      }]);
    });
  });

  it('parses template translation function', () => {
    let state = {index: 0, stack: [], lineNumber: 0}
    const text = '__`a`b';
    const actual = [];

    while ((state = readCharacter(text, state)) !== null) {
      actual.push(state);
    }

    expect(actual).toEqual([{
      character: '__`a`',
      index: 5,
      stack: [],
      lineNumber: 0,
      localization: {
        key: 'a',
        fn: '__("a")',
        particular: false,
        number: false,
      }
    }, {
      character: 'b',
      index: 6,
      stack: [],
      lineNumber: 0,
    }]);
  });

  it('throws an exception when there is no closing quote', () => {
    let state = {index: 0, stack: [], lineNumber: 0}
    const text = '"';
    const actual = [];

    expect(() => {
      while ((state = readCharacter(text, state)) !== null) {
        actual.push(state);
      }
    }).toThrow(new SyntaxError('text ended with unclosed stack items'));

    expect(actual).toEqual([{
      character: '"',
      index: 1,
      stack: ['"'],
      lineNumber: 0,
    }]);

  });

  it('throws an exception when parenthesis is not closed', () => {
    let state = {index: 0, stack: [], lineNumber: 0}
    const text = '(';
    const actual = [];

    expect(() => {
      while ((state = readCharacter(text, state)) !== null) {
        actual.push(state);
      }
    }).toThrow(new SyntaxError('text ended with unclosed stack items'));

    expect(actual).toEqual([{
      character: '(',
      index: 1,
      stack: ['('],
      lineNumber: 0,
    }]);

  });

  it('throws an exception when a close parenthesis is used when there is no open', () => {
    let state = {index: 0, stack: [], lineNumber: 0}
    const text = ')';
    const actual = [];

    expect(() => {
      while ((state = readCharacter(text, state)) !== null) {
        actual.push(state);
      }
    }).toThrow(new SyntaxError('missing matching opening brace'));

    expect(actual).toEqual([]);

  });

  it('throws an error when there is no string literal for the translation', () => {
    let state = {index: 0, stack: [], lineNumber: 0}
    const text = '__(fish)';
    const actual = [];

    expect(() => {
      while ((state = readCharacter(text, state)) !== null) {
        actual.push(state);
      }
    }).toThrow(new SyntaxError('localization key must be a literal'));

    expect(actual).toEqual([]);

  });

  it('throws an error if quote is not the first character', () => {
    let state = {index: 0, stack: [], lineNumber: 0}
    const text = '__(,"fish")';
    const actual = [];

    expect(() => {
      while ((state = readCharacter(text, state)) !== null) {
        actual.push(state);
      }
    }).toThrow(new SyntaxError('localization key must be a literal'));

    expect(actual).toEqual([]);

  });

  it('throws an error if string is empty', () => {
    let state = {index: 0, stack: [], lineNumber: 0}
    const text = '__("")';
    const actual = [];

    expect(() => {
      while ((state = readCharacter(text, state)) !== null) {
        actual.push(state);
      }
    }).toThrow(new SyntaxError('key string argument is empty'));

    expect(actual).toEqual([]);

  });

  it('iterates * as a normal character', () => {
    let state = {index: 0, stack: [], lineNumber: 0}
    const text = 'a*b';
    const actual = [];

    while ((state = readCharacter(text, state)) !== null) {
      actual.push(state);
    }

    expect(actual).toEqual([{
      character: 'a',
      index: 1,
      stack: [],
      lineNumber: 0,
    }, {
      character: '*',
      index: 2,
      stack: [],
      lineNumber: 0,
    }, {
      character: 'b',
      index: 3,
      stack: [],
      lineNumber: 0,
    }]);

  });

  it('iterates / as a normal character', () => {
    let state = {index: 0, stack: [], lineNumber: 0}
    const text = 'a/b';
    const actual = [];

    while ((state = readCharacter(text, state)) !== null) {
      actual.push(state);
    }

    expect(actual).toEqual([{
      character: 'a',
      index: 1,
      stack: [],
      lineNumber: 0,
    }, {
      character: '/',
      index: 2,
      stack: [],
      lineNumber: 0,
    }, {
      character: 'b',
      index: 3,
      stack: [],
      lineNumber: 0,
    }]);

  });

  it('iterates _ as a normal character', () => {
    let state = {index: 0, stack: [], lineNumber: 0}
    const text = 'a_b';
    const actual = [];

    while ((state = readCharacter(text, state)) !== null) {
      actual.push(state);
    }

    expect(actual).toEqual([{
      character: 'a',
      index: 1,
      stack: [],
      lineNumber: 0,
    }, {
      character: '_',
      index: 2,
      stack: [],
      lineNumber: 0,
    }, {
      character: 'b',
      index: 3,
      stack: [],
      lineNumber: 0,
    }]);

  });

  it('escapes _', () => {
    let state = {index: 0, stack: [], lineNumber: 0}
    const text = 'a//_';
    const actual = [];

    while ((state = readCharacter(text, state)) !== null) {
      actual.push(state);
    }

    expect(actual).toEqual([{
      character: 'a',
      index: 1,
      stack: [],
      lineNumber: 0
    }, {
      character: '//',
      comments: '',
      index: 3,
      stack: [
        "//"
      ],
      "lineNumber": 0
    }, {
      character: '_',
      comments: '_',
      index: 4,
      stack: [
        "//"
      ],
      lineNumber: 0
    }]);
  });
});
