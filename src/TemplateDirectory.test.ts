import TemplateDirectory from './TemplateDirectory';
import UnsupportedFormatError from './errors/UnsupportedFormatError';
import FormatParsingError from './errors/FormatParsingError';
import fs from 'fs-extra';

jest.mock('fs-extra');

describe('TemplateDirectory', () => {
  afterEach(() => {
    fs.mockReset();
  });

  describe('buildFilename', () => {
    it('creates filename when has both locale and format', () => {
      const directory = new TemplateDirectory('/test/path');
      const filename = directory.buildFilename('locale', 'format');

      expect(filename).toEqual('/test/path/locale.format');
    });

    it('creates filename without extension when only has locale', () => {
      const directory = new TemplateDirectory('/test/path');
      const filename = directory.buildFilename('locale');

      expect(filename).toEqual('/test/path/locale');
    });

    it('resolves the path', () => {
      const directory = new TemplateDirectory('/test/path');
      const filename = directory.buildFilename('../locale');

      expect(filename).toEqual('/test/locale');
    });
  });

  describe('writeLocalization', () => {
    it('throws an UnsupportedFormat error when the format doesn\'t exist', () => {
      const directory = new TemplateDirectory('/test/path');

      expect(() => {
        directory.writeLocalization('en', '', 'invalid');
      }).toThrow(new UnsupportedFormatError('invalid'))
    });

    it('writes the default localization type', () => {
      const directory = new TemplateDirectory('/test/path');

      directory.writeLocalization('en', [{
        key: 'test key',
        value: 'test value',
      }]);

      expect(fs.readFileSync('/test/path/en.po')).toEqual(`msgid "test key"
msgstr "test value"
`);
    });

    it('writing the localization twice uses the cache', () => {
      const directory = new TemplateDirectory('/test/path');

      directory.writeLocalization('en', [{
        key: 'test key',
        value: 'test value',
      }]);

      directory.writeLocalization('en', [{
        key: 'test key',
        value: 'test value',
      }]);

      expect(fs.actions).toEqual([{
        "action": "write",
        "data": `msgid "test key"
msgstr "test value"
`,
        "filename": "/test/path/en.po",
      }]);
    });

    it('writes po localization type', () => {
      const directory = new TemplateDirectory('/test/path');

      directory.writeLocalization('en', [{
        key: 'test key',
        value: 'test value',
      }], 'po');

      expect(fs.readFileSync('/test/path/en.po')).toEqual(`msgid "test key"
msgstr "test value"
`);
    });

    it('writes json localization type', () => {
      const directory = new TemplateDirectory('/test/path');

      directory.writeLocalization('en', [{
        key: 'test key',
        value: 'test value',
      }], 'json');

      expect(fs.readFileSync('/test/path/en.json')).toEqual(`[
    {
        "key": "test key",
        "value": "test value"
    }
]`);
    });

    it('writes json5 localization type', () => {
      const directory = new TemplateDirectory('/test/path');

      directory.writeLocalization('en', [{
        key: 'test key',
        value: 'test value',
      }], 'json5');

      expect(fs.readFileSync('/test/path/en.json5')).toEqual(`{
    "test key": {
        "default": "test value"
    }
}`);
    });
  });

  describe('readLocalization', () => {
    it('throws an UnsupportedFormat error when the format doesn\'t exist', () => {
      const directory = new TemplateDirectory('/test/path');

      expect(() => {
        directory.readLocalization('en', 'invalid');
      }).toThrow(new UnsupportedFormatError('invalid'))
    });

    it('throws a FormatParsingError error when parsing fails', () => {
      const directory = new TemplateDirectory('/test/path');

      fs.writeFileSync('/test/path/en.json', 'invalid');

      expect(() => {
        directory.readLocalization('en', 'json');
      }).toThrow(new FormatParsingError('json', 'Unexpected token i in JSON at position 0'))
    });

    it('throws read error when not for when not existing', () => {
      const directory = new TemplateDirectory('/test/path');

      fs.readFileSync.mockImplementation(() => {
        throw new Error('unknown error');
      });

      expect(() => {
        directory.readLocalization('en', 'json');
      }).toThrow(new Error('unknown error'))
    });

    it('reads the default localization type', () => {
      fs.writeFileSync('/test/path/en.po',
`msgid "test key"
msgstr "test value"
`
);
      fs.actions.length = 0;
      const directory = new TemplateDirectory('/test/path');
      const localization = directory.readLocalization('en');

      expect(localization).toEqual([{
        key: 'test key',
        value: 'test value'
      }]);
    });

    it('reads po localization type', () => {
      fs.writeFileSync('/test/path/en.po',
`msgid "test key"
msgstr "test value"
`
);
      fs.actions.length = 0;
      const directory = new TemplateDirectory('/test/path');
      const localization = directory.readLocalization('en', 'po');

      expect(localization).toEqual([{
        key: 'test key',
        value: 'test value'
      }]);
    });

    it('reads json localization type', () => {
      fs.writeFileSync('/test/path/en.json',
`[{
"key": "test key",
"value": "test value"
}]`
);
      fs.actions.length = 0;
      const directory = new TemplateDirectory('/test/path');
      const localization = directory.readLocalization('en', 'json');

      expect(localization).toEqual([{
        key: 'test key',
        value: 'test value'
      }]);
    });

    it('reads json5 localization type', () => {
      fs.writeFileSync('/test/path/en.json5',
`{"test key": {"default": "test value"}}`
);
      fs.actions.length = 0;
      const directory = new TemplateDirectory('/test/path');
      const localization = directory.readLocalization('en', 'json5');

      expect(localization).toEqual([{
        context: 'default',
        key: 'test key',
        value: 'test value'
      }]);
    });
  });

  describe('ensureDirectory', () => {
    it('creates the directory if it doesn\'t exist', () => {
      const directory = new TemplateDirectory('/test/path');

      directory.ensureDirectory();

      expect(fs.actions).toEqual([{
        'action': 'write',
        'filename': '/test/path',
      }]);
    });
  });

  describe('normalizeTo', () => {
    it('works', () => {
      const directory = new TemplateDirectory('/test/path');
    });
  });
});
