import TargetDirectory from './TargetDirectory';
import fs from 'fs-extra';

jest.mock('fs-extra');

describe('TargetDirectory', () => {
  afterEach(() => {
    fs.mockReset();
  });

  describe('buildFilename', () => {
    it('creates filename', () => {
      const directory = new TargetDirectory('/test/path');
      const filename = directory.buildFilename('locale');

      expect(filename).toEqual('/test/path/locale.json');
    });

    it('resolves the path', () => {
      const directory = new TargetDirectory('/test/path');
      const filename = directory.buildFilename('../locale');

      expect(filename).toEqual('/test/locale.json');
    });
  });

  describe('writeIndex', () => {
    it('writes index', () => {
      const directory = new TargetDirectory('/test/path');

      directory.writeIndex({'en': [{
        key: 'test key',
        value: 'test value',
      }]});

      expect(fs.readFileSync('/test/path/index.json')).toEqual(`{
    "en": {
        "test key": "test value"
    }
}`);
    });

    it('uses cache in second index write', () => {
      const directory = new TargetDirectory('/test/path');

      directory.writeIndex({'en': [{
        key: 'test key',
        value: 'test value',
      }]});

      directory.writeIndex({'en': [{
        key: 'test key',
        value: 'test value',
      }]});

      expect(fs.actions).toEqual([{
        "action": "write",
        "data": `{
    "en": {
        "test key": "test value"
    }
}`,
        "filename": "/test/path/index.json",
      }]);
    });
  });

  describe('writeLocalization', () => {
    it('writes localization', () => {
      const directory = new TargetDirectory('/test/path');

      directory.writeLocalization('en', [{
        key: 'test key',
        value: 'test value',
      }]);

      expect(fs.readFileSync('/test/path/en.json')).toEqual(`{
    "test key": "test value"
}`);
    });

    it('uses cache in second localization write', () => {
      const directory = new TargetDirectory('/test/path');

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
        "data": `{
    "test key": "test value"
}`,
        "filename": "/test/path/en.json",
      }]);
    });

    it('writes localization with context', () => {
      const directory = new TargetDirectory('/test/path');

      directory.writeLocalization('en', [{
        key: 'test key',
        context: 'test context',
        value: 'test value',
      }]);

      expect(fs.readFileSync('/test/path/en.json')).toEqual(`{
    "test key": {
        "test context": "test value"
    }
}`);
    });

    it('writes localization with explit default context', () => {
      const directory = new TargetDirectory('/test/path');

      directory.writeLocalization('en', [{
        key: 'test key',
        context: 'default',
        value: 'test value',
      }]);

      expect(fs.readFileSync('/test/path/en.json')).toEqual(`{
    "test key": "test value"
}`);
    });

    it('writes localization with explit default context and other context', () => {
      const directory = new TargetDirectory('/test/path');

      directory.writeLocalization('en', [{
        key: 'test key',
        context: 'default',
        value: 'test value',
      }, {
        key: 'test key',
        context: 'test context',
        value: 'test other value',
      }]);

      expect(fs.readFileSync('/test/path/en.json')).toEqual(`{
    "test key": {
        "default": "test value",
        "test context": "test other value"
    }
}`);
    });

    it('writes plural localization', () => {
      const directory = new TargetDirectory('/test/path');

      directory.writeLocalization('en', [{
        key: 'test key',
        value: {
          '0': 'test value 0',
          '1': 'test value 1',
        }
      }]);

      expect(fs.readFileSync('/test/path/en.json')).toEqual(`{
    "test key": {
        "0": "test value 0",
        "1": "test value 1"
    }
}`);
    });
  });
  describe('ensureDirectory', () => {
    it('creates the directory if it doesn\'t exist', () => {
      const directory = new TargetDirectory('/test/path');

      directory.ensureDirectory();

      expect(fs.actions).toEqual([{
        'action': 'write',
        'filename': '/test/path',
      }]);
    });
  });
});
