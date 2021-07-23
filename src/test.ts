/*eslint max-len: ["error", {"ignoreStrings": true}]*/

const TranslationStaticAnalyzer = require('.');
const fs = require('fs-extra');
const console = require('console');
const glob = require('glob');

jest.mock('path');
jest.mock('glob');
jest.mock('fs-extra');
//jest.mock('console');

const mocks = {};
const path = require('path');

describe('TranslationStaticAnalyzer', () => {
  beforeEach(() => {
    mocks.processOn = jest.spyOn(process, 'on');
    mocks.consoleLog = jest.spyOn(console, 'log');
    path.relative.mockImplementation((from, to) => {
      return to;
    });

    path.resolve.mockImplementation((...parts) => {
      return `${parts.join('/')}`;
    });
  });

  afterEach(() => {
    Object.keys(mocks).forEach((k) => {
      mocks[k].mockRestore();
      delete mocks[k];
    });

    fs.mockReset();
    glob.sync.mockReset();
  });

  it('uses correct template for plurals', () => {
    glob.sync.mockImplementation(() => ['src/pages/Search/index.js']);

    const analyzer = new TranslationStaticAnalyzer({
      files: 'test files',
      locales: ['existing'],
      target: 'test targets',
    });

    fs.writeFileSync('src/pages/Search/index.js', `__n('%d dog crosses the street', '%d dogs cross the street');`);
    fs.actions.length = 0;

    analyzer.read();

    expect(fs.actions).toEqual([
      {
        "action": "read",
        "filename": "src/pages/Search/index.js",
        "data": `__n('%d dog crosses the street', '%d dogs cross the street');`
      }
    ]);

    fs.actions.length = 0;
    analyzer.write();

    expect(fs.actions).toEqual([{
      "action": "write",
      "filename": "./locales"
    }, {
      "action": "read",
      "filename": "./locales/existing.po",
      "data": null
    }, {
      "action": "write",
      "filename": "./locales/existing.po",
      "data": `#. NEW
#: src/pages/Search/index.js:0
msgid "%d dog crosses the street"
msgid_plural "%d dogs cross the street"
msgstr[0] ""
msgstr[1] ""
`
    }]);
  });

  it('still creates directory target even if it has no javacript files', () => {
    glob.sync.mockImplementation((pattern) => {
      if (pattern === 'test files') {
        return ['src/Application/index.js'];
      } else if (pattern === 'test targets') {
        return ['src/pages/Search'];
      }
    });

    fs.statSync.mockImplementation((path) => ({isDirectory() {
      if (path === 'src/pages/Search') return true;
    }}));

    const analyzer = new TranslationStaticAnalyzer({
      files: 'test files',
      locales: ['existing'],
      target: 'test targets',
    });

    fs.writeFileSync('src/Application/index.js', `__('test key')`);
    fs.actions.length = 0;

    analyzer.read();

    expect(fs.actions).toEqual([
      {
        "action": "read",
        "filename": "src/Application/index.js",
        "data": "__('test key')",
      }
    ]);

    fs.actions.length = 0;
    analyzer.write();

    expect(fs.actions).toEqual([{
      "action": "write",
      "filename": "./locales"
    }, {
      "action": "read",
      "filename": "./locales/existing.po",
      "data": null
    }, {
      "action": "write",
      "filename": "./locales/existing.po",
      "data": `#. NEW
#: src/Application/index.js:0
msgid "test key"
msgstr ""
`
    }, {
      "action": "write",
      "filename": "src/pages/Search/.locales"
    }, {
      "action": "write",
      "filename": "src/pages/Search/.locales/existing.json",
      "data": `{}`
    }, {
      "action": "write",
      "filename": "src/pages/Search/.locales/index.json",
      "data": `{
    "existing": {}
}`
    }]);
  });

  it('handles empty key gracefully', () => {
    glob.sync.mockImplementation(() => ['src/pages/EmptyKeys/index.js']);

    const analyzer = new TranslationStaticAnalyzer({
      files: 'test empty keys',
      locales: ['existing'],
      target: 'test directory targets',
    });

    fs.writeFileSync('src/pages/EmptyKeys/index.js', `__('') + __n('') + __np('') + __p('');`);
    fs.actions.length = 0;

    analyzer.read();

    expect(fs.actions).toEqual([
      {
        "action": "read",
        "filename": "src/pages/EmptyKeys/index.js",
        "data": `__('') + __n('') + __np('') + __p('');`
      }
    ]);
  });

  it('handles an empty localization in the template correctly', () => {
    glob.sync.mockImplementation((pattern) => {
      if (pattern === 'test files') {
        return ['src/pages/Search/index.js']
      } else if (pattern === 'test targets') {
        return ['src'];
      }
    });

    const analyzer = new TranslationStaticAnalyzer({
      files: 'test files',
      locales: ['existing'],
      target: 'test targets',
    });

    fs.writeFileSync('src/pages/Search/index.js', `__('test key');`);
    fs.writeFileSync('./locales/existing.po', `msgid "test key"
msgstr ""
`);

    fs.actions.length = 0;

    analyzer.read();

    expect(fs.actions).toEqual([
      {
        "action": "read",
        "filename": "src/pages/Search/index.js",
        "data": `__('test key');`
      }
    ]);

    fs.actions.length = 0;

    analyzer.write();

    expect(fs.actions).toEqual([{
        "action": "write",
        "filename": "./locales"
    }, {
        "action": "read",
        "filename": "./locales/existing.po",
        "data": `msgid "test key"
msgstr ""
`
    }, {
        "action": "write",
        "filename": "./locales/existing.po",
      "data": `#. NEW
#: src/pages/Search/index.js:0
msgid "test key"
msgstr ""
`
    }, {
        "action": "write",
        "filename": "src/.locales"
    }, {
        "action": "write",
        "filename": "src/.locales/existing.json",
        "data": "{}"
    }, {
        "action": "write",
        "filename": "src/.locales/index.json",
        "data": `{
    "existing": {}
}`
    }]);
  });

  it('does nothing when write is called and there is no template', () => {
    glob.sync.mockImplementation(() => ['src/pages/Search/index.js']);

    const analyzer = new TranslationStaticAnalyzer({
      files: 'test files',
      locales: ['existing'],
      target: 'test directory targets',
    });

    delete analyzer.referenceTemplate;
    fs.actions.length = 0;

    analyzer.write();

    expect(fs.actions).toEqual([]);
  });

  it("new translations and no existing po", () => {
    glob.sync.mockImplementation(() => ['src/pages/Search/index.js']);

    const analyzer = new TranslationStaticAnalyzer({
      files: 'test files',
      locales: ['existing'],
      target: 'test directory targets',
    });

    fs.writeFileSync('src/pages/Search/index.js', `export default __('test key');`);

    analyzer.read();

    fs.actions.length = 0;

    analyzer.write();

    expect(fs.actions).toEqual([{
      "action": "write",
      "filename": "./locales",
    },
      {
        "action": "read",
        "data": null,
        "filename": "./locales/existing.po",
      },
      {
        "action": "write",
        "data": `#. NEW
#: src/pages/Search/index.js:0
msgid "test key"
msgstr ""
`,
        "filename": "./locales/existing.po",
      }]);
  });

  it("updates comments when existing po", () => {
    glob.sync.mockImplementation(() => ['src/pages/Search/index.js']);

    const analyzer = new TranslationStaticAnalyzer({
      files: 'test files',
      locales: ['existing'],
      target: 'test directory targets',
    });

    fs.writeFileSync('src/pages/Search/index.js', `export default __(/*new test comments*/'test key');`);

    fs.writeFileSync('./locales/existing.po', `#. test comments
msgid "test key"
msgstr "test value"
`);

    analyzer.read();

    fs.actions.length = 0;

    analyzer.write();

    expect(fs.actions).toEqual([{
      "action": "write",
      "filename": "./locales",
    }, {
      "action": "read",
      "data": `#. test comments
msgid "test key"
msgstr "test value"
`,
      "filename": "./locales/existing.po",
    }, {
      "action": "write",
      "data": `#. new test comments
#: src/pages/Search/index.js:0
msgid "test key"
msgstr "test value"
`,
      "filename": "./locales/existing.po",
    }]);
  });

  it("new translations and existing invalid po", () => {
    glob.sync.mockImplementation(() => ['src/pages/Search/index.js']);

    const analyzer = new TranslationStaticAnalyzer({
      files: 'test files',
      locales: ['existing'],
      target: 'test directory targets',
    });

    fs.writeFileSync('src/pages/Search/index.js', `export default __('test key');`);
    fs.writeFileSync('./locales/existing.po', `invalid`);

    analyzer.read();

    fs.actions.length = 0;

    analyzer.write();

    expect(fs.actions).toEqual([{
      "action": "write",
      "filename": "./locales",
    }, {
      "action": "read",
      "data": "invalid",
      "filename": "./locales/existing.po",
    }, {
      "action": "write",
      "data": `#. NEW
#: src/pages/Search/index.js:0
msgid "test key"
msgstr ""
`,
      "filename": "./locales/existing.po",
    }]);
  });

  it('updates notes on update', () => {
    glob.sync.mockImplementation(() => ['src/pages/Search/index.js']);

    const analyzer = new TranslationStaticAnalyzer({
      files: 'test files',
      locales: ['existing'],
      target: 'test directory targets',
    });

    fs.writeFileSync('src/pages/Search/index.js', `export default __('test key');`);

    fs.writeFileSync('./locales/existing.po', `# test notes
msgid "test key"
msgstr "test value"
`);

    analyzer.read();

    fs.actions.length = 0;

    analyzer.write();

    expect(fs.actions).toEqual([{
      "action": "write",
      "filename": "./locales",
    }, {
      "action": "read",
      "data": `# test notes
msgid "test key"
msgstr "test value"
`,
      "filename": "./locales/existing.po",
    }, {
      "action": "write",
      "data": `# test notes
#: src/pages/Search/index.js:0
msgid "test key"
msgstr "test value"
`,
      "filename": "./locales/existing.po",
    }]);
  });

  it('sorts to be new, existing, unused', () =>  {
    glob.sync.mockImplementation(() => ['src/pages/Search/index.js']);

    const analyzer = new TranslationStaticAnalyzer({
      files: 'test files',
      locales: ['existing'],
      target: 'test directory targets',
    });

    fs.writeFileSync('src/pages/Search/index.js', `export default __('test existing key'); + __('test new key');`);
    fs.writeFileSync('./locales/existing.po', `msgid "test non-existing key"
msgstr "test non-existing translation"

msgid "test non-existing empty key that should be removed"
msgstr ""

msgid "test existing key"
msgstr "test existing translation"
`);

    analyzer.read();

    fs.actions.length = 0;

    analyzer.write();

    expect(fs.actions).toEqual([{
      "action": "write",
      "filename": "./locales",
    }, {
      "action": "read",
      "data": `msgid "test non-existing key"
msgstr "test non-existing translation"

msgid "test non-existing empty key that should be removed"
msgstr ""

msgid "test existing key"
msgstr "test existing translation"
`,
      "filename": "./locales/existing.po",
    }, {
      "action": "write",
      "data": `#. NEW
#: src/pages/Search/index.js:0
msgid "test new key"
msgstr ""

#: src/pages/Search/index.js:0
msgid "test existing key"
msgstr "test existing translation"

#~ msgid "test non-existing key"
#~ msgstr "test non-existing translation"
`,
      "filename": "./locales/existing.po",
    }]);
  });

  it('sorts by key when has the same status', () =>  {
    glob.sync.mockImplementation(() => []);

    const analyzer = new TranslationStaticAnalyzer({
      files: 'test files',
      locales: ['existing'],
      target: 'test directory targets',
    });

    fs.writeFileSync('./locales/existing.po', `msgid "b"
msgstr "test another translation"

msgid "a"
msgstr "test translation"
`);

    analyzer.read();

    fs.actions.length = 0;

    analyzer.write();

    expect(fs.actions).toEqual([{
      "action": "write",
      "filename": "./locales",
    }, {
      "action": "read",
      "data": `msgid "b"
msgstr "test another translation"

msgid "a"
msgstr "test translation"
`,
      "filename": "./locales/existing.po",
    }, {
      "action": "write",
      "data": `#~ msgid "a"
#~ msgstr "test translation"

#~ msgid "b"
#~ msgstr "test another translation"
`,
      "filename": "./locales/existing.po",
    }]);
  });

  it('sorts by context when has the same status and key', () =>  {
    glob.sync.mockImplementation(() => []);

    const analyzer = new TranslationStaticAnalyzer({
      files: 'test files',
      locales: ['existing'],
      target: 'test directory targets',
    });

    fs.writeFileSync('./locales/existing.po', `msgctxt "b"
msgid "test key"
msgstr "test another translation"

msgctxt "a"
msgid "test key"
msgstr "test translation"
`);

    analyzer.read();

    fs.actions.length = 0;

    analyzer.write();

    expect(fs.actions).toEqual([{
      "action": "write",
      "filename": "./locales",
    }, {
      "action": "read",
      "data": `msgctxt "b"
msgid "test key"
msgstr "test another translation"

msgctxt "a"
msgid "test key"
msgstr "test translation"
`,
      "filename": "./locales/existing.po",
    }, {
      "action": "write",
      "data": `#~ msgctxt "a"
#~ msgid "test key"
#~ msgstr "test translation"

#~ msgctxt "b"
#~ msgid "test key"
#~ msgstr "test another translation"
`,
      "filename": "./locales/existing.po",
    }]);
  });

  it('records debugging information', () => {
    glob.sync.mockImplementation(() => []);

    const analyzer = new TranslationStaticAnalyzer({
      files: 'test files',
      locales: ['existing'],
      target: 'test directory targets',
      debug: true,
    });

    analyzer.update();

    expect(mocks.consoleLog.mock.calls).toEqual([
      [
        "translate-static-analyzer: Creating locale gen directory",
        "/test/tmp/0",
      ],
      [
        "translate-static-analyzer: Updating localization keys for",
        `[
      "src/pages/Search/index.js",
      "src/pages/About/index.js",
      "src/index.js"
  ]`,
      ],
      [
        "translate-static-analyzer: Parsed keys",
        `[
      "Search",
      "About",
      "Application"
  ]`,
      ],
      [
        "translate-static-analyzer: Writing localization for",
        "./locales/existing.json",
        {
          "About": {
            "data": "",
            "files": [
              "src/pages/About/index.js:2",
            ],
            "note": "new",
          },
          "Application": {
            "data": "",
            "files": [
              "src/index.js:2",
            ],
            "note": "new",
          },
          "Search": {
            "data": "検索",
            "files": [
              "src/pages/Search/index.js:2",
            ],
          },
          "test unused key": {
            "data": "test value",
            "files": [],
            "note": "unused",
          },
        },
      ],
      [
        "translate-static-analyzer: Writing final target to ",
        "src/pages/Search/.locales/existing.json",
      ],
      [
        "translate-static-analyzer: Writing final target to ",
        "src/pages/About/.locales/existing.json",
      ],
      [
        "translate-static-analyzer: DONE",
      ],
    ]);
  });

  describe('templateDirectory', () => {
    it('uses the default when none is supplied ot the options', () => {
      glob.sync.mockImplementation(() => []);

      const analyzer = new TranslationStaticAnalyzer({
        files: 'test files',
        locales: ['existing'],
        target: 'test directory targets',
      });

      expect(analyzer.templateDirectory).toEqual('./locales');
    });

    it('uses the override when one is supplied ot the options', () => {
      glob.sync.mockImplementation(() => []);

      const analyzer = new TranslationStaticAnalyzer({
        files: 'test files',
        locales: ['existing'],
        target: 'test directory targets',
        templates: 'test/template/directory'
      });

      expect(analyzer.templateDirectory).toEqual('test/template/directory/locales');
    });

    it('uses fallbacks when no options are supplied', () => {
      glob.sync.mockImplementation(() => []);

      const analyzer = new TranslationStaticAnalyzer();

      analyzer.read();
      analyzer.write();

      expect(glob.sync.mock.calls).toEqual([]);
      expect(fs.actions).toEqual([]);
    });

    it('removes source code when file is deleted, and specific file read', () => {
      glob.sync.mockImplementation(() => ['src/pages/Search/index.js']);

      const analyzer = new TranslationStaticAnalyzer({
        files: 'test files',
        locales: ['existing'],
        target: 'test directory targets',
      });

      fs.writeFileSync('src/pages/Search/index.js', `__(/*comment*/'test')`);

      analyzer.update();

      expect(fs.readFileSync('./locales/existing.po')).toEqual(`#. NEW
#. comment
#: src/pages/Search/index.js:0
msgid "test"
msgstr ""
`);

      glob.sync.mockImplementation(() => []);

      analyzer.read(['src/pages/Search/index.js']);
      analyzer.write();

      expect(fs.readFileSync('./locales/existing.po')).toEqual(``);
    });

    it('generates multiple targets', () => {
      fs.statSync.mockImplementation(() => ({isDirectory() { return true; }}));
      glob.sync.mockImplementation((pattern) => {
        if (pattern === 'test directory targets') {
          return [
            'src/pages/Search',
            'src/pages/About',
          ];
        } else if (pattern === 'test files') {
          return [
            'src/pages/Search/index.js',
            'src/pages/About/index.js',
            'src/Application.js',
          ];
        }
      });

      const analyzer = new TranslationStaticAnalyzer({
        files: 'test files',
        locales: ['existing'],
        target: 'test directory targets',
      });

      fs.writeFileSync('src/pages/Search/index.js', `__('search')`);
      fs.writeFileSync('src/pages/About/index.js', `__('about')`);
      fs.writeFileSync('src/Application.js', `__('application')`);
      fs.writeFileSync('./locales/existing.po', `#: src/pages/About/index.js:0
msgid "about"
msgstr "localized about"

#: src/Application.js:0
msgid "application"
msgstr "localized application"

#: src/pages/Search/index.js:0
msgid "search"
msgstr "localized search"
`
      );

      fs.actions.length = 0;

      analyzer.read();

      expect(fs.actions).toEqual([{
        "action": "read",
        "filename": "src/pages/Search/index.js",
        "data": "__('search')"
      }, {
        "action": "read",
        "filename": "src/pages/About/index.js",
        "data": "__('about')"
      }, {
        "action": "read",
        "filename": "src/Application.js",
        "data": "__('application')"
      }]);

      fs.actions.length = 0;
      analyzer.write();

      expect(fs.actions).toEqual([{
        "action": "write",
        "filename": "./locales"
      }, {
        "action": "read",
        "filename": "./locales/existing.po",
        "data": `#: src/pages/About/index.js:0
msgid "about"
msgstr "localized about"

#: src/Application.js:0
msgid "application"
msgstr "localized application"

#: src/pages/Search/index.js:0
msgid "search"
msgstr "localized search"
`
      }, {
        "action": "write",
        "filename": "./locales/existing.po",
        "data": `#: src/pages/About/index.js:0
msgid "about"
msgstr "localized about"

#: src/Application.js:0
msgid "application"
msgstr "localized application"

#: src/pages/Search/index.js:0
msgid "search"
msgstr "localized search"
`
      }, {
        "action": "write",
        "filename": "src/pages/Search/.locales"
      }, {
        "action": "write",
        "filename": "src/pages/Search/.locales/existing.json",
"data": `{
    "application": "localized application",
    "search": "localized search"
}`
      }, {
        "action": "write",
        "filename": "src/pages/Search/.locales/index.json",
        "data": `{
    "existing": {
        "application": "localized application",
        "search": "localized search"
    }
}`
      }, {
        "action": "write",
        "filename": "src/pages/About/.locales"
      }, {
        "action": "write",
        "filename": "src/pages/About/.locales/existing.json",
        "data": `{
    "about": "localized about",
    "application": "localized application"
}`
      }, {
        "action": "write",
        "filename": "src/pages/About/.locales/index.json",
        "data": `{
    "existing": {
        "about": "localized about",
        "application": "localized application"
    }
}`
      }]);
    });

    it('removes file when file read gives unknown error', () => {
      fs.statSync.mockImplementation(() => ({isDirectory() { return true; }}));
      glob.sync.mockImplementation((pattern) => {
        if (pattern === 'test targets') {
          return ['src'];
        } else if (pattern === 'test files') {
          return [
            'src/pages/Search/index.js',
            'src/pages/About/index.js',
            'src/Application.js',
          ];
        }
      });

      const analyzer = new TranslationStaticAnalyzer({
        files: 'test files',
        locales: ['existing'],
        target: 'test targets',
      });

      fs.writeFileSync('src/pages/Search/index.js', `__('search')`);
      fs.writeFileSync('src/pages/About/index.js', `__('about')`);
      fs.writeFileSync('src/Application.js', `__('application')`);
      fs.writeFileSync('./locales/existing.po', `#: src/pages/About/index.js:0
msgid "about"
msgstr "localized about"

#: src/Application.js:0
msgid "application"
msgstr "localized application"

#: src/pages/Search/index.js:0
msgid "search"
msgstr "localized search"
`
      );

      fs.actions.length = 0;
      analyzer.read();

      fs.readFileSync.mockImplementation((filename) => {
        if (filename === 'src/pages/Search/index.js') {
          throw new Error('UnknownError: This error should remove the content from the analyzer');
        }

        return fs.filesystem[filename];
      });

      analyzer.read();
      fs.actions.length = 0;

      analyzer.write();

      expect(fs.actions).toEqual([{
        "action": "write",
        "filename": "./locales"
      }, {
        "action": "write",
        "filename": "./locales/existing.po",
        "data": `#: src/pages/About/index.js:0
msgid "about"
msgstr "localized about"

#: src/Application.js:0
msgid "application"
msgstr "localized application"

#~ msgid "search"
#~ msgstr "localized search"
`
      }, {
        "action": "write",
        "filename": "src/.locales"
      }, {
        "action": "write",
        "filename": "src/.locales/existing.json",
        "data": `{
    "about": "localized about",
    "application": "localized application"
}`
      }, {
        "action": "write",
        "filename": "src/.locales/index.json",
        "data": `{
    "existing": {
        "about": "localized about",
        "application": "localized application"
    }
}`
      }]);
    });
  });

  it('updates single file', () => {
    fs.statSync.mockImplementation(() => ({isDirectory() { return true; }}));
    glob.sync.mockImplementation((pattern) => {
      if (pattern === 'test targets') {
        return ['src'];
      } else if (pattern === 'test files') {
        return [
          'src/pages/Search/index.js',
          'src/pages/About/index.js',
          'src/Application.js',
        ];
      }
    });

    const analyzer = new TranslationStaticAnalyzer({
      files: 'test files',
      locales: ['existing'],
      target: 'test targets',
    });

    fs.writeFileSync('src/pages/Search/index.js', `__('search')`);
    fs.writeFileSync('src/pages/About/index.js', `__('about')`);
    fs.writeFileSync('src/Application.js', `__('application')`);
    fs.writeFileSync('./locales/existing.po', `#: src/pages/About/index.js:0
msgid "about"
msgstr "localized about"

#: src/Application.js:0
msgid "application"
msgstr ""

#: src/pages/Search/index.js:0
msgid "search"
msgstr "localized search"
`
    );

    fs.actions.length = 0;
    analyzer.update(['src/pages/Search/index.js']);

    expect(fs.actions).toEqual([{
      "action": "read",
      "filename": "src/pages/Search/index.js",
      "data": "__('search')"
    }, {
      "action": "write",
      "filename": "./locales"
    }, {
      "action": "read",
      "filename": "./locales/existing.po",
      "data": `#: src/pages/About/index.js:0
msgid "about"
msgstr "localized about"

#: src/Application.js:0
msgid "application"
msgstr ""

#: src/pages/Search/index.js:0
msgid "search"
msgstr "localized search"
`
    }, {
      "action": "write",
      "filename": "./locales/existing.po",
      "data": `#: src/pages/Search/index.js:0
msgid "search"
msgstr "localized search"

#~ msgid "about"
#~ msgstr "localized about"
`
    }, {
      "action": "write",
      "filename": "src/.locales"
    }, {
      "action": "write",
      "filename": "src/.locales/existing.json",
      "data": `{
    "search": "localized search"
}`
    }, {
      "action": "write",
      "filename": "src/.locales/index.json",
      "data": `{
    "existing": {
        "search": "localized search"
    }
}`
    }]);
  });

  it('reads header metadata', () => {
    fs.statSync.mockImplementation(() => ({isDirectory() { return true; }}));
    glob.sync.mockImplementation((pattern) => {
      if (pattern === 'test targets') {
        return ['src'];
      } else if (pattern === 'test files') {
        return [
          'src/pages/Search/index.js',
        ];
      }
    });

    const analyzer = new TranslationStaticAnalyzer({
      files: 'test files',
      locales: ['existing'],
      target: 'test targets',
    });

    fs.writeFileSync('src/pages/Search/index.js', `__('search')`);
    fs.writeFileSync('./locales/existing.po', `# test header notes
msgid ""
msgstr ""
"Project-Id-Version: test product id\\n"
"Report-Msgid-Bugs-To: test webpage url\\n"
"POT-Creation-Date: test creation date\\n"
"PO-Revision-Date: test revision date\\n"
"Last-Translator: test last translator\\n"
"Language-Team: test language team\\n"
"MIME-Version: test mime version\\n"
"Content-Type: test content type\\n"
"Content-Transfer-Encoding: test content transfer encoding\\n"
"Plural-Forms: nplurals=2; plural=n != 1;\\n"
""

#: src/pages/About/index.js:0
msgid "about"
msgstr "localized about"
`
    );

    fs.actions.length = 0;

    analyzer.read();

    fs.actions.length = 0;

    analyzer.write();

    expect(fs.actions).toEqual([{
      "action": "write",
      "filename": "./locales"
    }, {
      "action": "read",
      "filename": "./locales/existing.po",
      "data": `# test header notes
msgid ""
msgstr ""
"Project-Id-Version: test product id\\n"
"Report-Msgid-Bugs-To: test webpage url\\n"
"POT-Creation-Date: test creation date\\n"
"PO-Revision-Date: test revision date\\n"
"Last-Translator: test last translator\\n"
"Language-Team: test language team\\n"
"MIME-Version: test mime version\\n"
"Content-Type: test content type\\n"
"Content-Transfer-Encoding: test content transfer encoding\\n"
"Plural-Forms: nplurals=2; plural=n != 1;\\n"
""

#: src/pages/About/index.js:0
msgid "about"
msgstr "localized about"
`
    }, {
      "action": "write",
      "filename": "./locales/existing.po",
      "data": `# test header notes
msgid ""
msgstr "Project-Id-Version: test product id\\n"
"Report-Msgid-Bugs-To: test webpage url\\n"
"POT-Creation-Date: test creation date\\n"
"PO-Revision-Date: test revision date\\n"
"Last-Translator: test last translator\\n"
"Language-Team: test language team\\n"
"MIME-Version: test mime version\\n"
"Content-Type: test content type\\n"
"Content-Transfer-Encoding: test content transfer encoding\\n"
"Plural-Forms: nplurals=2; plural=n != 1;\\n"
""

#. NEW
#: src/pages/Search/index.js:0
msgid "search"
msgstr ""

#~ msgid "about"
#~ msgstr "localized about"
`
    }, {
      "action": "write",
      "filename": "src/.locales"
    }, {
      "action": "write",
      "filename": "src/.locales/existing.json",
      "data": `{
    "": {
        "Plural-Forms": {
            "nplurals": 2,
            "plural": "n != 1"
        }
    }
}`
    }, {
      "action": "write",
      "filename": "src/.locales/index.json",
      "data": `{
    "existing": {
        "": {
            "Plural-Forms": {
                "nplurals": 2,
                "plural": "n != 1"
            }
        }
    }
}`
    }]);
  });

  it('header metadata to geneate NEW simple template', () => {
    fs.statSync.mockImplementation(() => ({isDirectory() { return true; }}));
    glob.sync.mockImplementation((pattern) => {
      if (pattern === 'test targets') {
        return ['src'];
      } else if (pattern === 'test files') {
        return [
          'src/pages/Search/index.js',
        ];
      }
    });

    const analyzer = new TranslationStaticAnalyzer({
      files: 'test files',
      locales: ['existing'],
      target: 'test targets',
    });

    fs.writeFileSync('src/pages/Search/index.js', `__n('%d result', '%d results')`);
    fs.writeFileSync('./locales/existing.po', `# test header notes
msgid ""
msgstr ""
"Plural-Forms: nplurals=2; plural=n != 1;\\n"
""
`
    );

    analyzer.read();

    fs.actions.length = 0;

    analyzer.write();

    expect(fs.actions).toEqual([{
      "action": "write",
      "filename": "./locales"
    }, {
      "action": "read",
      "filename": "./locales/existing.po",
      "data": `# test header notes
msgid ""
msgstr ""
"Plural-Forms: nplurals=2; plural=n != 1;\\n"
""
`
    }, {
      "action": "write",
      "filename": "./locales/existing.po",
      "data": `# test header notes
msgid ""
msgstr "Plural-Forms: nplurals=2; plural=n != 1;\\n"
""

#. NEW
#: src/pages/Search/index.js:0
msgid "%d result"
msgid_plural "%d results"
msgstr[0] ""
msgstr[1] ""
`
    }, {
      "action": "write",
      "filename": "src/.locales"
    }, {
      "action": "write",
      "filename": "src/.locales/existing.json",
      "data": `{
    "": {
        "Plural-Forms": {
            "nplurals": 2,
            "plural": "n != 1"
        }
    }
}`
    }, {
      "action": "write",
      "filename": "src/.locales/index.json",
      "data": `{
    "existing": {
        "": {
            "Plural-Forms": {
                "nplurals": 2,
                "plural": "n != 1"
            }
        }
    }
}`
    }]);
  });

  it('header metadata to geneate NEW complex template', () => {
    fs.statSync.mockImplementation(() => ({isDirectory() { return true; }}));
    glob.sync.mockImplementation((pattern) => {
      if (pattern === 'test targets') {
        return ['src'];
      } else if (pattern === 'test files') {
        return [
          'src/pages/Search/index.js',
        ];
      }
    });

    const analyzer = new TranslationStaticAnalyzer({
      files: 'test files',
      locales: ['existing'],
      target: 'test targets',
    });

    fs.writeFileSync('src/pages/Search/index.js', `__n('%d result', '%d results')`);
    fs.writeFileSync('./locales/existing.po', `# test header notes
msgid ""
msgstr ""
"Plural-Forms: nplurals=3; plural=(n==1 ? 0 : n%10>=2 && n%10<=4 && (n%100<10 || n%100>=20) ? 1 : 2);\\n"
""
`
    );

    analyzer.read();

    fs.actions.length = 0;

    analyzer.write();

    expect(fs.actions).toEqual([{
      "action": "write",
      "filename": "./locales"
    }, {
      "action": "read",
      "filename": "./locales/existing.po",
      "data": `# test header notes
msgid ""
msgstr ""
"Plural-Forms: nplurals=3; plural=(n==1 ? 0 : n%10>=2 && n%10<=4 && (n%100<10 || n%100>=20) ? 1 : 2);\\n"
""
`
    }, {
      "action": "write",
      "filename": "./locales/existing.po",
      "data": `# test header notes
msgid ""
msgstr "Plural-Forms: nplurals=3; plural=(n==1 ? 0 : n%10>=2 && n%10<=4 && (n%100<10 || n%100>=20) ? 1 : 2);\\n"
""

#. NEW
#: src/pages/Search/index.js:0
msgid "%d result"
msgid_plural "%d results"
msgstr[0] ""
msgstr[1] ""
msgstr[2] ""
`
    }, {
      "action": "write",
      "filename": "src/.locales"
    }, {
      "action": "write",
      "filename": "src/.locales/existing.json",
      "data": `{
    "": {
        "Plural-Forms": {
            "nplurals": 3,
            "plural": "(n==1 ? 0 : n%10>=2 && n%10<=4 && (n%100<10 || n%100>=20) ? 1 : 2)"
        }
    }
}`
    }, {
      "action": "write",
      "filename": "src/.locales/index.json",
      "data": `{
    "existing": {
        "": {
            "Plural-Forms": {
                "nplurals": 3,
                "plural": "(n==1 ? 0 : n%10>=2 && n%10<=4 && (n%100<10 || n%100>=20) ? 1 : 2)"
            }
        }
    }
}`
    }]);
  });

  it('header metadata to geneate NEW template where no plural exist', () => {
    fs.statSync.mockImplementation(() => ({isDirectory() { return true; }}));
    glob.sync.mockImplementation((pattern) => {
      if (pattern === 'test targets') {
        return ['src'];
      } else if (pattern === 'test files') {
        return [
          'src/pages/Search/index.js',
        ];
      }
    });

    const analyzer = new TranslationStaticAnalyzer({
      files: 'test files',
      locales: ['existing'],
      target: 'test targets',
    });

    fs.writeFileSync('src/pages/Search/index.js', `__n('%d result', '%d results')`);
    fs.writeFileSync('./locales/existing.po', `# test header notes
msgid ""
msgstr ""
"Plural-Forms: nplurals=1; plural=0;\\n"
""
`
    );

    analyzer.read();

    fs.actions.length = 0;

    analyzer.write();

    expect(fs.actions).toEqual([{
      "action": "write",
      "filename": "./locales"
    }, {
      "action": "read",
      "filename": "./locales/existing.po",
      "data": `# test header notes
msgid ""
msgstr ""
"Plural-Forms: nplurals=1; plural=0;\\n"
""
`
    }, {
      "action": "write",
      "filename": "./locales/existing.po",
      "data": `# test header notes
msgid ""
msgstr "Plural-Forms: nplurals=1; plural=0;\\n"
""

#. NEW
#: src/pages/Search/index.js:0
msgid "%d result"
msgid_plural "%d results"
msgstr[0] ""
`
    }, {
      "action": "write",
      "filename": "src/.locales"
    }, {
      "action": "write",
      "filename": "src/.locales/existing.json",
      "data": `{
    "": {
        "Plural-Forms": {
            "nplurals": 1,
            "plural": "0"
        }
    }
}`
    }, {
      "action": "write",
      "filename": "src/.locales/index.json",
      "data": `{
    "existing": {
        "": {
            "Plural-Forms": {
                "nplurals": 1,
                "plural": "0"
            }
        }
    }
}`
    }]);
  });
});

