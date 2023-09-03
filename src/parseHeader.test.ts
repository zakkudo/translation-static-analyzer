import parseHeader from './parseHeader';
import InvalidTemplateHeaderError from './errors/InvalidTemplateHeaderError';

describe('parseHeader', () => {
  it('parses simple plural forms', () => {
    const header = 'Plural-Forms: nplurals=2; plural=n != 1;\n';

    expect(parseHeader(header)).toEqual(new Map([[
      "Plural-Forms", {
        "nplurals": 2,
        "plural": "n != 1",
      },
    ]]));
  });

  it('parses complex plural forms', () => {
    const header = 'Plural-Forms: nplurals=3; plural=(n==1 ? 0 : n%10>=2 && n%10<=4 && (n%100<10 || n%100>=20) ? 1 : 2);';

    expect(parseHeader(header)).toEqual(new Map([[
      "Plural-Forms", {
        "nplurals": 3,
        "plural": "(n==1 ? 0 : n%10>=2 && n%10<=4 && (n%100<10 || n%100>=20) ? 1 : 2)",
      }
    ]]));
  });

  it('uses the fallback simple plural form when missing', () => {
    const header = 'Plural-Forms: ';

    expect(parseHeader(header)).toEqual(new Map([[
      "Plural-Forms", {
        "nplurals": 2,
        "plural": "n != 1",
      }
    ]]));
  });

  it('uses the fallback simple plural form when missing', () => {
    const header = 'Plural-Forms: ';

    expect(parseHeader(header)).toEqual(new Map([[
      "Plural-Forms", {
        "nplurals": 2,
        "plural": "n != 1",
      }
    ]]));
  });

  it('throws an exception when key is missing value', () => {
    const header = 'Plural-Forms: nplurals=; plural=n != 1;\n';

    expect(() => parseHeader(header)).toThrow(new InvalidTemplateHeaderError(
      header,
      `Plural-Forms expected a value for key "nplurals", actual: %s`,
      header
    ));
  });

  it('throws an exception when value is missing key', () => {
    const header = 'Plural-Forms: =2; plural=n != 1;\n';

    expect(() => parseHeader(header)).toThrow(new InvalidTemplateHeaderError(
      header,
      'Plural-Forms has a blank key, actual: %s',
      header,
    ));
  });

  it('parses a full header', () => {
    const header = `Project-Id-Version: test product id
Report-Msgid-Bugs-To: test webpage url
POT-Creation-Date: test creation date
PO-Revision-Date: test revision date
Last-Translator: test last translator
Language-Team: test language team
MIME-Version: test mime version
Content-Type: test content type
Content-Transfer-Encoding: test content transfer encoding
Plural-Forms: nplurals=2; plural=n != 1;
`
    expect(parseHeader(header)).toEqual(new Map(Object.entries({
      "Project-Id-Version": "test product id",
      "Report-Msgid-Bugs-To": "test webpage url",
      "POT-Creation-Date": "test creation date",
      "PO-Revision-Date": "test revision date",
      "Last-Translator": "test last translator",
      "Language-Team": "test language team",
      "MIME-Version": "test mime version",
      "Content-Type": "test content type",
      "Content-Transfer-Encoding": "test content transfer encoding",
      "Plural-Forms": {
        "nplurals": 2,
        "plural": "n != 1"
      }
    })));
  });
});
