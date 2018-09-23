/*eslint max-len: ["error", {"ignoreStrings": true}]*/

const TranslationStaticAnalyzer = require('.');
const fs = require('fs-extra');
const console = require('console');

jest.mock('path');
jest.mock('glob');
jest.mock('fs-extra');
jest.mock('console');

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
    });

    it('handles empty key gracefully', () => {
        const analyzer = new TranslationStaticAnalyzer({
            files: 'test empty keys',
            locales: ['existing'],
            target: 'test directory targets',
        });

        fs.actions.length = 0;

        analyzer.read();

        expect(fs.actions).toEqual([
            {
                "action": "read",
                "filename": "src/pages/EmptyKeys/index.js",
                "data": "export default class Application extends Component {\n     static get title() {\n         return __('') + __n('') + __np('') + __p('');\n     }\n};"
            }
        ]);
    });

    it('does nothing when write is called and there is no template', () => {
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

    it('filters out traslation strings accidentally placed where contexts should exist', () => {
        const analyzer = new TranslationStaticAnalyzer({
            files: 'test files',
            locales: ['existing'],
            target: 'test directory targets',
        });

        analyzer.read();

        fs.writeFileSync('./locales/existing.json', JSON.stringify({
            'test key': 'test invalid localization'
        }));

        fs.actions.length = 0;

        analyzer.write();

        expect(fs.actions).toEqual([
            {
                "action": "read",
                "filename": "./locales/existing.json",
                "data": "{\"test key\":\"test invalid localization\"}"
            },
            {
                "action": "write",
                "filename": "./locales/existing.json",
                "data": "{\n    \"%d result\": {\n        // NEW\n        // src/pages/Search/index.js:6\n        \"default\": {\"one\":\"\",\"other\":\"\"}\n    },\n    \"%d view\": {\n        // NEW\n        // src/pages/Search/index.js:6\n        \"footer\": {\"one\":\"\",\"other\":\"\"}\n    },\n    \"About\": {\n        // NEW\n        // src/pages/About/index.js:2\n        \"default\": \"\"\n    },\n    \"Application\": {\n        // NEW\n        // src/index.js:2\n        \"default\": \"\"\n    },\n    \"Search\": {\n        // NEW\n        // src/pages/About/index.js:6\n        // src/pages/Search/index.js:2\n        \"default\": \"\",\n        // NEW\n        // src/pages/Search/index.js:6\n        \"menuitem\": \"\"\n    }\n}"
            },
            {
                "action": "read",
                "filename": "src/pages/.locales/existing.json",
                "data": null
            },
            {
                "action": "read",
                "filename": "src/pages/Search/.locales/existing.json",
                "data": "{\"Search\":\"\"}"
            },
            {
                "action": "write",
                "filename": "src/pages/Search/.locales/existing.json",
                "data": "{}"
            },
            {
                "action": "write",
                "filename": "src/pages/Search/.locales/index.json",
                "data": "{\n    \"existing\": {}\n}"
            },
            {
                "action": "read",
                "filename": "src/pages/About/.locales/existing.json",
                "data": "{}"
            },
            {
                "action": "write",
                "filename": "src/pages/About/.locales/index.json",
                "data": "{\n    \"existing\": {}\n}"
            },
            {
                "action": "read",
                "filename": "src/application/.locales/existing.json",
                "data": null
            },
            {
                "action": "write",
                "filename": "src/application/.locales/index.json",
                "data": "{\n    \"existing\": {}\n}"
            }
        ]);
    });

    it("doesn't collapse the localization when there is a default and non-default context", () => {
        const analyzer = new TranslationStaticAnalyzer({
            files: 'test files',
            locales: ['existing'],
            target: 'test directory targets',
        });


        fs.writeFileSync('src/pages/Search/index.js', `export default __('test key') + __p('menuitem', 'test key');`);

        analyzer.read();

        fs.writeFileSync('./locales/existing.json', JSON.stringify({
            'test key': {
                'default': 'test default translation context',
                'menuitem': 'test menuitem translation context',
            }
        }));

        fs.actions.length = 0;

        analyzer.write();

        expect(fs.actions).toEqual([
            {
                "action": "read",
                "filename": "./locales/existing.json",
                "data": "{\"test key\":{\"default\":\"test default translation context\",\"menuitem\":\"test menuitem translation context\"}}"
            },
            {
                "action": "write",
                "filename": "./locales/existing.json",
                "data": "{\n    \"About\": {\n        // NEW\n        // src/pages/About/index.js:2\n        \"default\": \"\"\n    },\n    \"Application\": {\n        // NEW\n        // src/index.js:2\n        \"default\": \"\"\n    },\n    \"Search\": {\n        // NEW\n        // src/pages/About/index.js:6\n        \"default\": \"\"\n    },\n    \"test key\": {\n        // src/pages/Search/index.js:0\n        \"default\": \"test default translation context\",\n        // src/pages/Search/index.js:0\n        \"menuitem\": \"test menuitem translation context\"\n    }\n}"
            },
            {
                "action": "read",
                "filename": "src/pages/.locales/existing.json",
                "data": null
            },
            {
                "action": "write",
                "filename": "src/pages/.locales/existing.json",
                "data": "{\n    \"test key\": {\n        \"default\": \"test default translation context\",\n        \"menuitem\": \"test menuitem translation context\"\n    }\n}"
            },
            {
                "action": "write",
                "filename": "src/pages/.locales/index.json",
                "data": "{\n    \"existing\": {\n        \"test key\": {\n            \"default\": \"test default translation context\",\n            \"menuitem\": \"test menuitem translation context\"\n        }\n    }\n}"
            },
            {
                "action": "read",
                "filename": "src/pages/Search/.locales/existing.json",
                "data": "{\"Search\":\"\"}"
            },
            {
                "action": "write",
                "filename": "src/pages/Search/.locales/existing.json",
                "data": "{\n    \"test key\": {\n        \"default\": \"test default translation context\",\n        \"menuitem\": \"test menuitem translation context\"\n    }\n}"
            },
            {
                "action": "write",
                "filename": "src/pages/Search/.locales/index.json",
                "data": "{\n    \"existing\": {\n        \"test key\": {\n            \"default\": \"test default translation context\",\n            \"menuitem\": \"test menuitem translation context\"\n        }\n    }\n}"
            },
            {
                "action": "read",
                "filename": "src/pages/About/.locales/existing.json",
                "data": "{}"
            },
            {
                "action": "write",
                "filename": "src/pages/About/.locales/index.json",
                "data": "{\n    \"existing\": {}\n}"
            },
            {
                "action": "read",
                "filename": "src/application/.locales/existing.json",
                "data": null
            },
            {
                "action": "write",
                "filename": "src/application/.locales/index.json",
                "data": "{\n    \"existing\": {}\n}"
            }
        ]);
    });

    it('works with defaults for language with some prefilled data', () => {
        const analyzer = new TranslationStaticAnalyzer({
            files: 'test files',
            locales: ['existing'],
            target: 'test directory targets',
        });

        analyzer.update();

        expect(fs.actions).toEqual([
            {
                "action": "read",
                "filename": "src/pages/Search/index.js",
                "data": "export default class SearchPage extends Component {\n     static get title() {\n         return __('Search');\n     }\n\n    static get template() {\n         return '{{__('invalid''string')}} {{__p('menuitem', 'Search')}} <div>{{__n('%d result', '%d results', 2)}}</div> {{__np('footer', '%d view', '%d views', 23)}}';\n    }\n};"
            },
            {
                "action": "read",
                "filename": "src/pages/About/index.js",
                "data": "export default class AboutPage extends Component {\n     static get title() {\n         return __('About');\n     }\n\n    static get template() {\n         return <div>{{__('Search')}} Welcome to the about page!</div>';\n\n    }\n};"
            },
            {
                "action": "read",
                "filename": "src/index.js",
                "data": "export default class Application extends Component {\n     static get title() {\n         return __('Application');\n     }\n};"
            },
            {
                "action": "read",
                "filename": "src/test.js",
                "data": null
            },
            {
                "action": "read",
                "filename": "./locales/existing.json",
                "data": "{\"Search\":{\"default\":\"検索\"},\"test unused key\":{\"default\":\"test value\"},\"Application\":{\"default\":\"アプリケーション\"}}"
            },
            {
                "action": "write",
                "filename": "./locales/existing.json",
                "data": "{\n    \"%d result\": {\n        // NEW\n        // src/pages/Search/index.js:6\n        \"default\": {\"one\":\"\",\"other\":\"\"}\n    },\n    \"%d view\": {\n        // NEW\n        // src/pages/Search/index.js:6\n        \"footer\": {\"one\":\"\",\"other\":\"\"}\n    },\n    \"About\": {\n        // NEW\n        // src/pages/About/index.js:2\n        \"default\": \"\"\n    },\n    \"Application\": {\n        // src/index.js:2\n        \"default\": \"アプリケーション\"\n    },\n    \"Search\": {\n        // src/pages/About/index.js:6\n        // src/pages/Search/index.js:2\n        \"default\": \"検索\",\n        // NEW\n        // src/pages/Search/index.js:6\n        \"menuitem\": \"\"\n    },\n    \"test unused key\": {\n        // UNUSED\n        \"default\": \"test value\"\n    }\n}"
            },
            {
                "action": "read",
                "filename": "src/pages/.locales/existing.json",
                "data": null
            },
            {
                "action": "write",
                "filename": "src/pages/.locales/existing.json",
                "data": "{\n    \"Application\": \"アプリケーション\",\n    \"Search\": \"検索\"\n}"
            },
            {
                "action": "write",
                "filename": "src/pages/.locales/index.json",
                "data": "{\n    \"existing\": {\n        \"Application\": \"アプリケーション\",\n        \"Search\": \"検索\"\n    }\n}"
            },
            {
                "action": "read",
                "filename": "src/pages/Search/.locales/existing.json",
                "data": "{\"Search\":\"\"}"
            },
            {
                "action": "write",
                "filename": "src/pages/Search/.locales/existing.json",
                "data": "{\n    \"Application\": \"アプリケーション\",\n    \"Search\": \"検索\"\n}"
            },
            {
                "action": "write",
                "filename": "src/pages/Search/.locales/index.json",
                "data": "{\n    \"existing\": {\n        \"Application\": \"アプリケーション\",\n        \"Search\": \"検索\"\n    }\n}"
            },
            {
                "action": "read",
                "filename": "src/pages/About/.locales/existing.json",
                "data": "{}"
            },
            {
                "action": "write",
                "filename": "src/pages/About/.locales/existing.json",
                "data": "{\n    \"Application\": \"アプリケーション\",\n    \"Search\": \"検索\"\n}"
            },
            {
                "action": "write",
                "filename": "src/pages/About/.locales/index.json",
                "data": "{\n    \"existing\": {\n        \"Application\": \"アプリケーション\",\n        \"Search\": \"検索\"\n    }\n}"
            },
            {
                "action": "read",
                "filename": "src/application/.locales/existing.json",
                "data": null
            },
            {
                "action": "write",
                "filename": "src/application/.locales/existing.json",
                "data": "{\n    \"Application\": \"アプリケーション\"\n}"
            },
            {
                "action": "write",
                "filename": "src/application/.locales/index.json",
                "data": "{\n    \"existing\": {\n        \"Application\": \"アプリケーション\"\n    }\n}"
            }
		]);

        fs.actions.length = 0;
        analyzer.update();

        expect(fs.actions).toEqual([
            {
                "action": "read",
                "filename": "src/pages/Search/index.js",
                "data": "export default class SearchPage extends Component {\n     static get title() {\n         return __('Search');\n     }\n\n    static get template() {\n         return '{{__('invalid''string')}} {{__p('menuitem', 'Search')}} <div>{{__n('%d result', '%d results', 2)}}</div> {{__np('footer', '%d view', '%d views', 23)}}';\n    }\n};"
            },
            {
                "action": "read",
                "filename": "src/pages/About/index.js",
                "data": "export default class AboutPage extends Component {\n     static get title() {\n         return __('About');\n     }\n\n    static get template() {\n         return <div>{{__('Search')}} Welcome to the about page!</div>';\n\n    }\n};"
            },
            {
                "action": "read",
                "filename": "src/index.js",
                "data": "export default class Application extends Component {\n     static get title() {\n         return __('Application');\n     }\n};"
            },
            {
                "action": "read",
                "filename": "src/test.js",
                "data": null
            },
            {
                "action": "read",
                "filename": "./locales/existing.json",
                "data": "{\n    \"%d result\": {\n        // NEW\n        // src/pages/Search/index.js:6\n        \"default\": {\"one\":\"\",\"other\":\"\"}\n    },\n    \"%d view\": {\n        // NEW\n        // src/pages/Search/index.js:6\n        \"footer\": {\"one\":\"\",\"other\":\"\"}\n    },\n    \"About\": {\n        // NEW\n        // src/pages/About/index.js:2\n        \"default\": \"\"\n    },\n    \"Application\": {\n        // src/index.js:2\n        \"default\": \"アプリケーション\"\n    },\n    \"Search\": {\n        // src/pages/About/index.js:6\n        // src/pages/Search/index.js:2\n        \"default\": \"検索\",\n        // NEW\n        // src/pages/Search/index.js:6\n        \"menuitem\": \"\"\n    },\n    \"test unused key\": {\n        // UNUSED\n        \"default\": \"test value\"\n    }\n}"
            }
        ]);
    });

    describe('read', () => {
        it('reads all files', () => {
            const analyzer = new TranslationStaticAnalyzer({
                files: 'test files',
                locales: ['existing'],
                target: 'test directory targets',
            });

            expect(analyzer.read()).toBe(true);
            expect(fs.actions).toEqual(
                [
                    {
                        "action": "read",
                        "filename": "src/pages/Search/index.js",
                        "data": "export default class SearchPage extends Component {\n     static get title() {\n         return __('Search');\n     }\n\n    static get template() {\n         return '{{__('invalid''string')}} {{__p('menuitem', 'Search')}} <div>{{__n('%d result', '%d results', 2)}}</div> {{__np('footer', '%d view', '%d views', 23)}}';\n    }\n};"
                    },
                    {
                        "action": "read",
                        "filename": "src/pages/About/index.js",
                        "data": "export default class AboutPage extends Component {\n     static get title() {\n         return __('About');\n     }\n\n    static get template() {\n         return <div>{{__('Search')}} Welcome to the about page!</div>';\n\n    }\n};"
                    },
                    {
                        "action": "read",
                        "filename": "src/index.js",
                        "data": "export default class Application extends Component {\n     static get title() {\n         return __('Application');\n     }\n};"
                    },
                    {
                        "action": "read",
                        "filename": "src/test.js",
                        "data": null
                    }
                ]
            );
        });

        it('reads one file', () => {
            const analyzer = new TranslationStaticAnalyzer({
                files: 'test files',
                locales: ['existing'],
                target: 'test directory targets',
            });

            fs.actions.length = 0;

            expect(analyzer.read(['src/pages/Search/index.js'])).toBe(true);

            expect(fs.actions).toEqual(
                [
                    {
                        "action": "read",
                        "filename": "src/pages/Search/index.js",
                        "data": "export default class SearchPage extends Component {\n     static get title() {\n         return __('Search');\n     }\n\n    static get template() {\n         return '{{__('invalid''string')}} {{__p('menuitem', 'Search')}} <div>{{__n('%d result', '%d results', 2)}}</div> {{__np('footer', '%d view', '%d views', 23)}}';\n    }\n};"
                    }
                ]
            );
        });
    });

    describe('write', () => {
        it('writes when existing files and no changes', () => {
            const analyzer = new TranslationStaticAnalyzer({
                files: 'test files',
                locales: ['existing'],
                target: 'test directory targets',
            });

            fs.actions.length = 0;
            analyzer.write();

            expect(fs.actions).toEqual(
                [
                ]
            );
        });
    });

    describe('update', () => {
        it('updates, removing file', () => {
            const analyzer = new TranslationStaticAnalyzer({
                files: 'test files',
                locales: ['existing'],
                target: 'test directory targets',
            });

            analyzer.update();

            fs.actions.length = 0;
            fs.unlinkSync('src/pages/Search/index.js');
            analyzer.options.files = 'test removed file';
            analyzer.options.target = 'test removed directory target';

            analyzer.update(['src/pages/Search/index.js']);

            expect(fs.actions).toEqual([
                {
                    "action": "read",
                    "filename": "./locales/existing.json",
                    "data": "{\n    \"%d result\": {\n        // NEW\n        // src/pages/Search/index.js:6\n        \"default\": {\"one\":\"\",\"other\":\"\"}\n    },\n    \"%d view\": {\n        // NEW\n        // src/pages/Search/index.js:6\n        \"footer\": {\"one\":\"\",\"other\":\"\"}\n    },\n    \"About\": {\n        // NEW\n        // src/pages/About/index.js:2\n        \"default\": \"\"\n    },\n    \"Application\": {\n        // src/index.js:2\n        \"default\": \"アプリケーション\"\n    },\n    \"Search\": {\n        // src/pages/About/index.js:6\n        // src/pages/Search/index.js:2\n        \"default\": \"検索\",\n        // NEW\n        // src/pages/Search/index.js:6\n        \"menuitem\": \"\"\n    },\n    \"test unused key\": {\n        // UNUSED\n        \"default\": \"test value\"\n    }\n}"
                },
                {
                    "action": "write",
                    "filename": "./locales/existing.json",
                    "data": "{\n    \"About\": {\n        // NEW\n        // src/pages/About/index.js:2\n        \"default\": \"\"\n    },\n    \"Application\": {\n        // src/index.js:2\n        \"default\": \"アプリケーション\"\n    },\n    \"Search\": {\n        // src/pages/About/index.js:6\n        \"default\": \"検索\"\n    },\n    \"test unused key\": {\n        // UNUSED\n        \"default\": \"test value\"\n    }\n}"
                },
                {
                    "action": "read",
                    "filename": "src/pages/.locales/existing.json",
                    "data": "{\n    \"Application\": \"アプリケーション\",\n    \"Search\": \"検索\"\n}"
                },
                {
                    "action": "read",
                    "filename": "src/pages/About/.locales/existing.json",
                    "data": "{\n    \"Application\": \"アプリケーション\",\n    \"Search\": \"検索\"\n}"
                },
                {
                    "action": "read",
                    "filename": "src/application/.locales/existing.json",
                    "data": "{\n    \"Application\": \"アプリケーション\"\n}"
                }
			]);
        });

        it('updates metadata while two files reference same localization and one is removed', () => {
            const analyzer = new TranslationStaticAnalyzer({
                files: 'test files',
                locales: ['existing'],
                target: 'test directory targets',
            });

            analyzer.update();

            expect(fs.readFileSync('./locales/existing.json')).toEqual(
`{
    "%d result": {
        // NEW
        // src/pages/Search/index.js:6
        "default": {"one":"","other":""}
    },
    "%d view": {
        // NEW
        // src/pages/Search/index.js:6
        "footer": {"one":"","other":""}
    },
    "About": {
        // NEW
        // src/pages/About/index.js:2
        "default": ""
    },
    "Application": {
        // src/index.js:2
        "default": "アプリケーション"
    },
    "Search": {
        // src/pages/About/index.js:6
        // src/pages/Search/index.js:2
        "default": "検索",
        // NEW
        // src/pages/Search/index.js:6
        "menuitem": ""
    },
    "test unused key": {
        // UNUSED
        "default": "test value"
    }
}`
            );

            fs.actions.length = 0;
            fs.unlinkSync('src/pages/Search/index.js');
            analyzer.options.files = 'test removed file';
            analyzer.options.target = 'test removed directory target';

            analyzer.update(['src/pages/Search/index.js']);

            expect(fs.readFileSync('./locales/existing.json')).toEqual(
`{
    "About": {
        // NEW
        // src/pages/About/index.js:2
        "default": ""
    },
    "Application": {
        // src/index.js:2
        "default": "アプリケーション"
    },
    "Search": {
        // src/pages/About/index.js:6
        "default": "検索"
    },
    "test unused key": {
        // UNUSED
        "default": "test value"
    }
}`
            );

            expect(fs.actions).toEqual([
                {
                    "action": "read",
                    "filename": "./locales/existing.json",
                    "data": "{\n    \"%d result\": {\n        // NEW\n        // src/pages/Search/index.js:6\n        \"default\": {\"one\":\"\",\"other\":\"\"}\n    },\n    \"%d view\": {\n        // NEW\n        // src/pages/Search/index.js:6\n        \"footer\": {\"one\":\"\",\"other\":\"\"}\n    },\n    \"About\": {\n        // NEW\n        // src/pages/About/index.js:2\n        \"default\": \"\"\n    },\n    \"Application\": {\n        // src/index.js:2\n        \"default\": \"アプリケーション\"\n    },\n    \"Search\": {\n        // src/pages/About/index.js:6\n        // src/pages/Search/index.js:2\n        \"default\": \"検索\",\n        // NEW\n        // src/pages/Search/index.js:6\n        \"menuitem\": \"\"\n    },\n    \"test unused key\": {\n        // UNUSED\n        \"default\": \"test value\"\n    }\n}"
                },
                {
                    "action": "write",
                    "filename": "./locales/existing.json",
                    "data": "{\n    \"About\": {\n        // NEW\n        // src/pages/About/index.js:2\n        \"default\": \"\"\n    },\n    \"Application\": {\n        // src/index.js:2\n        \"default\": \"アプリケーション\"\n    },\n    \"Search\": {\n        // src/pages/About/index.js:6\n        \"default\": \"検索\"\n    },\n    \"test unused key\": {\n        // UNUSED\n        \"default\": \"test value\"\n    }\n}"
                },
                {
                    "action": "read",
                    "filename": "src/pages/.locales/existing.json",
                    "data": "{\n    \"Application\": \"アプリケーション\",\n    \"Search\": \"検索\"\n}"
                },
                {
                    "action": "read",
                    "filename": "src/pages/About/.locales/existing.json",
                    "data": "{\n    \"Application\": \"アプリケーション\",\n    \"Search\": \"検索\"\n}"
                },
                {
                    "action": "read",
                    "filename": "src/application/.locales/existing.json",
                    "data": "{\n    \"Application\": \"アプリケーション\"\n}"
                },
                {
                    "action": "read",
                    "filename": "./locales/existing.json",
                    "data": "{\n    \"About\": {\n        // NEW\n        // src/pages/About/index.js:2\n        \"default\": \"\"\n    },\n    \"Application\": {\n        // src/index.js:2\n        \"default\": \"アプリケーション\"\n    },\n    \"Search\": {\n        // src/pages/About/index.js:6\n        \"default\": \"検索\"\n    },\n    \"test unused key\": {\n        // UNUSED\n        \"default\": \"test value\"\n    }\n}"
                }
            ]);
        });

        it('removes unreadable source file', () => {
            const analyzer = new TranslationStaticAnalyzer({
                files: 'test files',
                locales: ['existing'],
                target: 'test directory targets',
            });

            analyzer.update();

            fs.actions.length = 0;
            const originalReadFileSync = fs.readFileSync;

            fs.readFileSync = (filename) => {
                if (filename === 'src/pages/Search/index.js') {
                    const e = new Error("MockError: readFileSync issue");

                    e.code = 'EEXIST';

                    throw e;
                }

                return originalReadFileSync(filename);
            };

            analyzer.update(['src/pages/Search/index.js']);

            fs.readFileSync = originalReadFileSync;

            expect(fs.actions).toEqual([
                {
                    "action": "read",
                    "filename": "./locales/existing.json",
                    "data": "{\n    \"%d result\": {\n        // NEW\n        // src/pages/Search/index.js:6\n        \"default\": {\"one\":\"\",\"other\":\"\"}\n    },\n    \"%d view\": {\n        // NEW\n        // src/pages/Search/index.js:6\n        \"footer\": {\"one\":\"\",\"other\":\"\"}\n    },\n    \"About\": {\n        // NEW\n        // src/pages/About/index.js:2\n        \"default\": \"\"\n    },\n    \"Application\": {\n        // src/index.js:2\n        \"default\": \"アプリケーション\"\n    },\n    \"Search\": {\n        // src/pages/About/index.js:6\n        // src/pages/Search/index.js:2\n        \"default\": \"検索\",\n        // NEW\n        // src/pages/Search/index.js:6\n        \"menuitem\": \"\"\n    },\n    \"test unused key\": {\n        // UNUSED\n        \"default\": \"test value\"\n    }\n}"
                },
                {
                    "action": "write",
                    "filename": "./locales/existing.json",
                    "data": "{\n    \"About\": {\n        // NEW\n        // src/pages/About/index.js:2\n        \"default\": \"\"\n    },\n    \"Application\": {\n        // src/index.js:2\n        \"default\": \"アプリケーション\"\n    },\n    \"Search\": {\n        // src/pages/About/index.js:6\n        \"default\": \"検索\"\n    },\n    \"test unused key\": {\n        // UNUSED\n        \"default\": \"test value\"\n    }\n}"
                },
                {
                    "action": "read",
                    "filename": "src/pages/.locales/existing.json",
                    "data": "{\n    \"Application\": \"アプリケーション\",\n    \"Search\": \"検索\"\n}"
                },
                {
                    "action": "read",
                    "filename": "src/pages/Search/.locales/existing.json",
                    "data": "{\n    \"Application\": \"アプリケーション\",\n    \"Search\": \"検索\"\n}"
                },
                {
                    "action": "write",
                    "filename": "src/pages/Search/.locales/existing.json",
                    "data": "{\n    \"Application\": \"アプリケーション\"\n}"
                },
                {
                    "action": "write",
                    "filename": "src/pages/Search/.locales/index.json",
                    "data": "{\n    \"existing\": {\n        \"Application\": \"アプリケーション\"\n    }\n}"
                },
                {
                    "action": "read",
                    "filename": "src/pages/About/.locales/existing.json",
                    "data": "{\n    \"Application\": \"アプリケーション\",\n    \"Search\": \"検索\"\n}"
                },
                {
                    "action": "write",
                    "filename": "src/pages/About/.locales/index.json",
                    "data": "{\n    \"existing\": {\n        \"Application\": \"アプリケーション\",\n        \"Search\": \"検索\"\n    }\n}"
                },
                {
                    "action": "read",
                    "filename": "src/application/.locales/existing.json",
                    "data": "{\n    \"Application\": \"アプリケーション\"\n}"
                },
                {
                    "action": "write",
                    "filename": "src/application/.locales/index.json",
                    "data": "{\n    \"existing\": {\n        \"Application\": \"アプリケーション\"\n    }\n}"
                }
            ]);
        });

        it('updates, adding file', () => {
            const analyzer = new TranslationStaticAnalyzer({
                files: 'test files',
                locales: ['existing'],
                target: 'test directory targets',
            });

            analyzer.update();

            fs.writeFileSync('src/pages/Added/index.js', "__('Added')");
            fs.actions.length = 0;
            analyzer.options.files = 'test added file';
            analyzer.options.target = 'test added directory target';

            analyzer.update(['src/pages/Added/index.js']);

            expect(fs.actions).toEqual([
                {
                    "action": "read",
                    "filename": "src/pages/Added/index.js",
                    "data": "__('Added')"
                },
                {
                    "action": "read",
                    "filename": "./locales/existing.json",
                    "data": "{\n    \"%d result\": {\n        // NEW\n        // src/pages/Search/index.js:6\n        \"default\": {\"one\":\"\",\"other\":\"\"}\n    },\n    \"%d view\": {\n        // NEW\n        // src/pages/Search/index.js:6\n        \"footer\": {\"one\":\"\",\"other\":\"\"}\n    },\n    \"About\": {\n        // NEW\n        // src/pages/About/index.js:2\n        \"default\": \"\"\n    },\n    \"Application\": {\n        // src/index.js:2\n        \"default\": \"アプリケーション\"\n    },\n    \"Search\": {\n        // src/pages/About/index.js:6\n        // src/pages/Search/index.js:2\n        \"default\": \"検索\",\n        // NEW\n        // src/pages/Search/index.js:6\n        \"menuitem\": \"\"\n    },\n    \"test unused key\": {\n        // UNUSED\n        \"default\": \"test value\"\n    }\n}"
                },
                {
                    "action": "write",
                    "filename": "./locales/existing.json",
                    "data": "{\n    \"%d result\": {\n        // NEW\n        // src/pages/Search/index.js:6\n        \"default\": {\"one\":\"\",\"other\":\"\"}\n    },\n    \"%d view\": {\n        // NEW\n        // src/pages/Search/index.js:6\n        \"footer\": {\"one\":\"\",\"other\":\"\"}\n    },\n    \"About\": {\n        // NEW\n        // src/pages/About/index.js:2\n        \"default\": \"\"\n    },\n    \"Added\": {\n        // NEW\n        // src/pages/Added/index.js:0\n        \"default\": \"\"\n    },\n    \"Application\": {\n        // src/index.js:2\n        \"default\": \"アプリケーション\"\n    },\n    \"Search\": {\n        // src/pages/About/index.js:6\n        // src/pages/Search/index.js:2\n        \"default\": \"検索\",\n        // NEW\n        // src/pages/Search/index.js:6\n        \"menuitem\": \"\"\n    },\n    \"test unused key\": {\n        // UNUSED\n        \"default\": \"test value\"\n    }\n}"
                },
                {
                    "action": "read",
                    "filename": "src/pages/.locales/existing.json",
                    "data": "{\n    \"Application\": \"アプリケーション\",\n    \"Search\": \"検索\"\n}"
                },
                {
                    "action": "read",
                    "filename": "src/pages/About/.locales/existing.json",
                    "data": "{\n    \"Application\": \"アプリケーション\",\n    \"Search\": \"検索\"\n}"
                },
                {
                    "action": "read",
                    "filename": "src/application/.locales/existing.json",
                    "data": "{\n    \"Application\": \"アプリケーション\"\n}"
                },
                {
                    "action": "read",
                    "filename": "src/pages/Added/.locales/existing.json",
                    "data": null
                },
                {
                    "action": "write",
                    "filename": "src/pages/Added/.locales/existing.json",
                    "data": "{\n    \"Application\": \"アプリケーション\"\n}"
                },
                {
                    "action": "write",
                    "filename": "src/pages/Added/.locales/index.json",
                    "data": "{\n    \"existing\": {\n        \"Application\": \"アプリケーション\"\n    }\n}"
                }
			]);
        });

        it('updates, updating file', () => {
            const analyzer = new TranslationStaticAnalyzer({
                files: 'test files',
                locales: ['existing'],
                target: 'test directory targets',
            });

            analyzer.update();

            fs.writeFileSync('src/pages/Search/index.js', "__('Changed')");
            fs.actions.length = 0;

            analyzer.update(['src/pages/Search/index.js']);
        });
    });

    it('records debugging information', () => {
        const analyzer = new TranslationStaticAnalyzer({
            files: 'test files',
            locales: ['existing'],
            target: 'test directory targets',
            debug: true,
        });

        analyzer.update();

        /*
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
        */
    });

    it("rethrows unknown exception reading file", () => {
        const analyzer = new TranslationStaticAnalyzer({
            files: 'test files',
            locales: ['existing'],
            target: 'test directory targets'
        });

        fs.readFileSync = jest.fn().mockImplementation((filename) => {
            if (filename.endsWith('.json')) {
                const e = new Error("MockError: readFileSync issue");
                e.code = 'TEST ERROR';
                throw e;
            }

            return '';
        });

        expect(() => analyzer.update()).toThrow(new Error("MockError: readFileSync issue"));
    });

    it('works with defaults for language with no prefilled data', () => {
        const analyzer = new TranslationStaticAnalyzer({
            files: 'test files',
            locales: ['new'],
            target: 'test directory targets'
        });

        analyzer.update();

        expect(fs.actions).toEqual([
            {
                "action": "read",
                "filename": "src/pages/Search/index.js",
                "data": "export default class SearchPage extends Component {\n     static get title() {\n         return __('Search');\n     }\n\n    static get template() {\n         return '{{__('invalid''string')}} {{__p('menuitem', 'Search')}} <div>{{__n('%d result', '%d results', 2)}}</div> {{__np('footer', '%d view', '%d views', 23)}}';\n    }\n};"
            },
            {
                "action": "read",
                "filename": "src/pages/About/index.js",
                "data": "export default class AboutPage extends Component {\n     static get title() {\n         return __('About');\n     }\n\n    static get template() {\n         return <div>{{__('Search')}} Welcome to the about page!</div>';\n\n    }\n};"
            },
            {
                "action": "read",
                "filename": "src/index.js",
                "data": "export default class Application extends Component {\n     static get title() {\n         return __('Application');\n     }\n};"
            },
            {
                "action": "read",
                "filename": "src/test.js",
                "data": null
            },
            {
                "action": "read",
                "filename": "./locales/new.json",
                "data": null
            },
            {
                "action": "write",
                "filename": "./locales/new.json",
                "data": "{\n    \"%d result\": {\n        // NEW\n        // src/pages/Search/index.js:6\n        \"default\": {\"one\":\"\",\"other\":\"\"}\n    },\n    \"%d view\": {\n        // NEW\n        // src/pages/Search/index.js:6\n        \"footer\": {\"one\":\"\",\"other\":\"\"}\n    },\n    \"About\": {\n        // NEW\n        // src/pages/About/index.js:2\n        \"default\": \"\"\n    },\n    \"Application\": {\n        // NEW\n        // src/index.js:2\n        \"default\": \"\"\n    },\n    \"Search\": {\n        // NEW\n        // src/pages/About/index.js:6\n        // src/pages/Search/index.js:2\n        \"default\": \"\",\n        // NEW\n        // src/pages/Search/index.js:6\n        \"menuitem\": \"\"\n    }\n}"
            },
            {
                "action": "read",
                "filename": "src/pages/.locales/new.json",
                "data": null
            },
            {
                "action": "read",
                "filename": "src/pages/Search/.locales/new.json",
                "data": null
            },
            {
                "action": "read",
                "filename": "src/pages/About/.locales/new.json",
                "data": null
            },
            {
                "action": "read",
                "filename": "src/application/.locales/new.json",
                "data": null
            }
        ]);
    });

    it("runs gracefully with no options", () => {
        new TranslationStaticAnalyzer();
    });

    it("passing an empty files array will update everything", () => {
        const analyzer = new TranslationStaticAnalyzer({
            files: 'test files',
            locales: ['new'],
            target: 'test directory targets',
        });

        analyzer.update([]);

        expect(fs.actions).toEqual([
            {
                "action": "read",
                "filename": "src/pages/Search/index.js",
                "data": "export default class SearchPage extends Component {\n     static get title() {\n         return __('Search');\n     }\n\n    static get template() {\n         return '{{__('invalid''string')}} {{__p('menuitem', 'Search')}} <div>{{__n('%d result', '%d results', 2)}}</div> {{__np('footer', '%d view', '%d views', 23)}}';\n    }\n};"
            },
            {
                "action": "read",
                "filename": "src/pages/About/index.js",
                "data": "export default class AboutPage extends Component {\n     static get title() {\n         return __('About');\n     }\n\n    static get template() {\n         return <div>{{__('Search')}} Welcome to the about page!</div>';\n\n    }\n};"
            },
            {
                "action": "read",
                "filename": "src/index.js",
                "data": "export default class Application extends Component {\n     static get title() {\n         return __('Application');\n     }\n};"
            },
            {
                "action": "read",
                "filename": "src/test.js",
                "data": null
            },
            {
                "action": "read",
                "filename": "./locales/new.json",
                "data": null
            },
            {
                "action": "write",
                "filename": "./locales/new.json",
                "data": "{\n    \"%d result\": {\n        // NEW\n        // src/pages/Search/index.js:6\n        \"default\": {\"one\":\"\",\"other\":\"\"}\n    },\n    \"%d view\": {\n        // NEW\n        // src/pages/Search/index.js:6\n        \"footer\": {\"one\":\"\",\"other\":\"\"}\n    },\n    \"About\": {\n        // NEW\n        // src/pages/About/index.js:2\n        \"default\": \"\"\n    },\n    \"Application\": {\n        // NEW\n        // src/index.js:2\n        \"default\": \"\"\n    },\n    \"Search\": {\n        // NEW\n        // src/pages/About/index.js:6\n        // src/pages/Search/index.js:2\n        \"default\": \"\",\n        // NEW\n        // src/pages/Search/index.js:6\n        \"menuitem\": \"\"\n    }\n}"
            },
            {
                "action": "read",
                "filename": "src/pages/.locales/new.json",
                "data": null
            },
            {
                "action": "read",
                "filename": "src/pages/Search/.locales/new.json",
                "data": null
            },
            {
                "action": "read",
                "filename": "src/pages/About/.locales/new.json",
                "data": null
            },
            {
                "action": "read",
                "filename": "src/application/.locales/new.json",
                "data": null
            }
        ]);
    });

    it("updates nothing when nothing returns from the glob", () => {
        const analyzer = new TranslationStaticAnalyzer({
            files: 'test no files',
            locales: ['new'],
            target: 'test directory targets'
        });

        analyzer.update();

        expect(fs.actions).toEqual([]);
    });

    it("no locales runs gracefully", () => {
        const analyzer = new TranslationStaticAnalyzer({
            files: 'test files',
            target: 'test directory targets',
        });

        analyzer.update([]);

        expect(fs.actions).toEqual([]);
    });

    it("allows overriding the templates directory", () => {
        const analyzer = new TranslationStaticAnalyzer({
            files: 'test files',
            locales: ['existing'],
            target: 'test directory targets',
            templates: 'testtemplatespath'
        });

        analyzer.update();

        expect(fs.actions).toEqual([
            {
                "action": "read",
                "filename": "src/pages/Search/index.js",
                "data": "export default class SearchPage extends Component {\n     static get title() {\n         return __('Search');\n     }\n\n    static get template() {\n         return '{{__('invalid''string')}} {{__p('menuitem', 'Search')}} <div>{{__n('%d result', '%d results', 2)}}</div> {{__np('footer', '%d view', '%d views', 23)}}';\n    }\n};"
            },
            {
                "action": "read",
                "filename": "src/pages/About/index.js",
                "data": "export default class AboutPage extends Component {\n     static get title() {\n         return __('About');\n     }\n\n    static get template() {\n         return <div>{{__('Search')}} Welcome to the about page!</div>';\n\n    }\n};"
            },
            {
                "action": "read",
                "filename": "src/index.js",
                "data": "export default class Application extends Component {\n     static get title() {\n         return __('Application');\n     }\n};"
            },
            {
                "action": "read",
                "filename": "src/test.js",
                "data": null
            },
            {
                "action": "read",
                "filename": "testtemplatespath/locales/existing.json",
                "data": null
            },
            {
                "action": "write",
                "filename": "testtemplatespath/locales/existing.json",
                "data": "{\n    \"%d result\": {\n        // NEW\n        // src/pages/Search/index.js:6\n        \"default\": {\"one\":\"\",\"other\":\"\"}\n    },\n    \"%d view\": {\n        // NEW\n        // src/pages/Search/index.js:6\n        \"footer\": {\"one\":\"\",\"other\":\"\"}\n    },\n    \"About\": {\n        // NEW\n        // src/pages/About/index.js:2\n        \"default\": \"\"\n    },\n    \"Application\": {\n        // NEW\n        // src/index.js:2\n        \"default\": \"\"\n    },\n    \"Search\": {\n        // NEW\n        // src/pages/About/index.js:6\n        // src/pages/Search/index.js:2\n        \"default\": \"\",\n        // NEW\n        // src/pages/Search/index.js:6\n        \"menuitem\": \"\"\n    }\n}"
            },
            {
                "action": "read",
                "filename": "src/pages/.locales/existing.json",
                "data": null
            },
            {
                "action": "read",
                "filename": "src/pages/Search/.locales/existing.json",
                "data": "{\"Search\":\"\"}"
            },
            {
                "action": "write",
                "filename": "src/pages/Search/.locales/existing.json",
                "data": "{}"
            },
            {
                "action": "write",
                "filename": "src/pages/Search/.locales/index.json",
                "data": "{\n    \"existing\": {}\n}"
            },
            {
                "action": "read",
                "filename": "src/pages/About/.locales/existing.json",
                "data": "{}"
            },
            {
                "action": "write",
                "filename": "src/pages/About/.locales/index.json",
                "data": "{\n    \"existing\": {}\n}"
            },
            {
                "action": "read",
                "filename": "src/application/.locales/existing.json",
                "data": null
            },
            {
                "action": "write",
                "filename": "src/application/.locales/index.json",
                "data": "{\n    \"existing\": {}\n}"
            }

		]);
	});
});

