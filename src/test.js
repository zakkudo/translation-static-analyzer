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

    it('calls cleanup on exit', () => {
        const analyzer = new TranslationStaticAnalyzer({
            files: 'test files',
            locales: ['existing'],
            target: 'test directory targets',
        });

        const exitCallback = mocks.processOn.mock.calls[0];
        const sigIntCallback = mocks.processOn.mock.calls[1];

        expect(exitCallback[0]).toEqual('exit');
        expect(sigIntCallback[0]).toEqual('SIGINT');

        exitCallback[1]();
        sigIntCallback[1]();

        expect(fs.removeSync.mock.calls).toEqual([["/test/tmp/0"], ["/test/tmp/0"]]);
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
				"data": "export default class SearchPage extends Component {\n     static get title() {\n         return __('Search');\n     }\n\n    static get template() {\n         return '{{__('invalid''string')}} <div>{{__n('%d result', '%d results', 2)}}</div>';\n\n    }\n};"
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
				"data": "{\"Search\":\"検索\",\"test unused key\":\"test value\",\"Application\":\"アプリケーション\"}"
			},
			{
				"action": "write",
				"filename": "./locales/existing.json",
				"data": "{\n    // NEW\n    // \n    \"%d result\": {\"one\":\"\",\"other\":\"\"},\n    // NEW\n    // \n    \"About\": \"\",\n    // \n    \"Application\": \"アプリケーション\",\n    // \n    // \n    \"Search\": \"検索\",\n    // UNUSED\n    \"test unused key\": \"test value\"\n}"
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
				"action": "read",
				"filename": "src/application/.locales/existing.json",
				"data": null
			},
			{
				"action": "write",
				"filename": "src/application/.locales/existing.json",
				"data": "{\n    \"Application\": \"アプリケーション\"\n}"
			}
		]);

        fs.actions.length = 0;
        analyzer.update();

		expect(fs.actions).toEqual([
			{
				"action": "read",
				"filename": "src/pages/Search/index.js",
				"data": "export default class SearchPage extends Component {\n     static get title() {\n         return __('Search');\n     }\n\n    static get template() {\n         return '{{__('invalid''string')}} <div>{{__n('%d result', '%d results', 2)}}</div>';\n\n    }\n};"
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
				"data": "{\n    // NEW\n    // \n    \"%d result\": {\"one\":\"\",\"other\":\"\"},\n    // NEW\n    // \n    \"About\": \"\",\n    // \n    \"Application\": \"アプリケーション\",\n    // \n    // \n    \"Search\": \"検索\",\n    // UNUSED\n    \"test unused key\": \"test value\"\n}"
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
                        "data": "export default class SearchPage extends Component {\n     static get title() {\n         return __('Search');\n     }\n\n    static get template() {\n         return '{{__('invalid''string')}} <div>{{__n('%d result', '%d results', 2)}}</div>';\n\n    }\n};"
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
                        "data": "export default class SearchPage extends Component {\n     static get title() {\n         return __('Search');\n     }\n\n    static get template() {\n         return '{{__('invalid''string')}} <div>{{__n('%d result', '%d results', 2)}}</div>';\n\n    }\n};"
                    },
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
                    {
                        "action": "read",
                        "filename": "./locales/existing.json",
                        "data": "{\"Search\":\"検索\",\"test unused key\":\"test value\",\"Application\":\"アプリケーション\"}"
                    },
                    {
                        "action": "write",
                        "filename": "./locales/existing.json",
                        "data": "{\n    // NEW\n    \"%s result\": {\"one\":\"\",\"other\":\"\"},\n    // NEW\n    \"About\": \"\",\n    \"Application\": \"アプリケーション\",\n    \"Search\": \"検索\",\n    // UNUSED\n    \"test unused key\": \"test value\"\n}"
                    },
                    {
                        "action": "read",
                        "filename": "src/pages/.locales/existing.json",
                        "data": null
                    },
                    {
                        "action": "write",
                        "filename": "src/pages/.locales/existing.json",
                        "data": "{}"
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
                        "action": "read",
                        "filename": "src/pages/About/.locales/existing.json",
                        "data": "{}"
                    },
                    {
                        "action": "read",
                        "filename": "src/application/.locales/existing.json",
                        "data": null
                    },
                    {
                        "action": "write",
                        "filename": "src/application/.locales/existing.json",
                        "data": "{}"
                    }
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
                    "data": "{\n    // NEW\n    // \n    \"%d result\": {\"one\":\"\",\"other\":\"\"},\n    // NEW\n    // \n    \"About\": \"\",\n    // \n    \"Application\": \"アプリケーション\",\n    // \n    // \n    \"Search\": \"検索\",\n    // UNUSED\n    \"test unused key\": \"test value\"\n}"
                },
                {
                    "action": "write",
                    "filename": "./locales/existing.json",
                    "data": "{\n    // NEW\n    // \n    \"About\": \"\",\n    // \n    \"Application\": \"アプリケーション\",\n    // \n    \"Search\": \"検索\",\n    // UNUSED\n    \"test unused key\": \"test value\"\n}"
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
                    "data": "{\n    // NEW\n    // \n    \"%d result\": {\"one\":\"\",\"other\":\"\"},\n    // NEW\n    // \n    \"About\": \"\",\n    // \n    \"Application\": \"アプリケーション\",\n    // \n    // \n    \"Search\": \"検索\",\n    // UNUSED\n    \"test unused key\": \"test value\"\n}"
                },
                {
                    "action": "write",
                    "filename": "./locales/existing.json",
                    "data": "{\n    // NEW\n    // \n    \"About\": \"\",\n    // \n    \"Application\": \"アプリケーション\",\n    // \n    \"Search\": \"検索\",\n    // UNUSED\n    \"test unused key\": \"test value\"\n}"
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
					"data": "{\n    // NEW\n    // \n    \"%d result\": {\"one\":\"\",\"other\":\"\"},\n    // NEW\n    // \n    \"About\": \"\",\n    // \n    \"Application\": \"アプリケーション\",\n    // \n    // \n    \"Search\": \"検索\",\n    // UNUSED\n    \"test unused key\": \"test value\"\n}"
				},
				{
					"action": "write",
					"filename": "./locales/existing.json",
					"data": "{\n    // NEW\n    // \n    \"%d result\": {\"one\":\"\",\"other\":\"\"},\n    // NEW\n    // \n    \"About\": \"\",\n    // NEW\n    // \n    \"Added\": \"\",\n    // \n    \"Application\": \"アプリケーション\",\n    // \n    // \n    \"Search\": \"検索\",\n    // UNUSED\n    \"test unused key\": \"test value\"\n}"
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

        fs.readFileSync.mockImplementation((filename) => {
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
				"data": "export default class SearchPage extends Component {\n     static get title() {\n         return __('Search');\n     }\n\n    static get template() {\n         return '{{__('invalid''string')}} <div>{{__n('%d result', '%d results', 2)}}</div>';\n\n    }\n};"
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
				"data": "{\n    // NEW\n    // \n    \"%d result\": {\"one\":\"\",\"other\":\"\"},\n    // NEW\n    // \n    \"About\": \"\",\n    // NEW\n    // \n    \"Application\": \"\",\n    // NEW\n    // \n    // \n    \"Search\": \"\"\n}"
			},
			{
				"action": "read",
				"filename": "src/pages/.locales/new.json",
				"data": null
			},
			{
				"action": "write",
				"filename": "src/pages/.locales/new.json",
				"data": "{}"
			},
			{
				"action": "read",
				"filename": "src/pages/Search/.locales/new.json",
				"data": null
			},
			{
				"action": "write",
				"filename": "src/pages/Search/.locales/new.json",
				"data": "{}"
			},
			{
				"action": "read",
				"filename": "src/pages/About/.locales/new.json",
				"data": null
			},
			{
				"action": "write",
				"filename": "src/pages/About/.locales/new.json",
				"data": "{}"
			},
			{
				"action": "read",
				"filename": "src/application/.locales/new.json",
				"data": null
			},
			{
				"action": "write",
				"filename": "src/application/.locales/new.json",
				"data": "{}"
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
				"data": "export default class SearchPage extends Component {\n     static get title() {\n         return __('Search');\n     }\n\n    static get template() {\n         return '{{__('invalid''string')}} <div>{{__n('%d result', '%d results', 2)}}</div>';\n\n    }\n};"
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
				"data": "{\n    // NEW\n    // \n    \"%d result\": {\"one\":\"\",\"other\":\"\"},\n    // NEW\n    // \n    \"About\": \"\",\n    // NEW\n    // \n    \"Application\": \"\",\n    // NEW\n    // \n    // \n    \"Search\": \"\"\n}"
			},
			{
				"action": "read",
				"filename": "src/pages/.locales/new.json",
				"data": null
			},
			{
				"action": "write",
				"filename": "src/pages/.locales/new.json",
				"data": "{}"
			},
			{
				"action": "read",
				"filename": "src/pages/Search/.locales/new.json",
				"data": null
			},
			{
				"action": "write",
				"filename": "src/pages/Search/.locales/new.json",
				"data": "{}"
			},
			{
				"action": "read",
				"filename": "src/pages/About/.locales/new.json",
				"data": null
			},
			{
				"action": "write",
				"filename": "src/pages/About/.locales/new.json",
				"data": "{}"
			},
			{
				"action": "read",
				"filename": "src/application/.locales/new.json",
				"data": null
			},
			{
				"action": "write",
				"filename": "src/application/.locales/new.json",
				"data": "{}"
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
				"data": "export default class SearchPage extends Component {\n     static get title() {\n         return __('Search');\n     }\n\n    static get template() {\n         return '{{__('invalid''string')}} <div>{{__n('%d result', '%d results', 2)}}</div>';\n\n    }\n};"
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
				"data": "{\n    // NEW\n    // \n    \"%d result\": {\"one\":\"\",\"other\":\"\"},\n    // NEW\n    // \n    \"About\": \"\",\n    // NEW\n    // \n    \"Application\": \"\",\n    // NEW\n    // \n    // \n    \"Search\": \"\"\n}"
			},
			{
				"action": "read",
				"filename": "src/pages/.locales/existing.json",
				"data": null
			},
			{
				"action": "write",
				"filename": "src/pages/.locales/existing.json",
				"data": "{}"
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
				"action": "read",
				"filename": "src/pages/About/.locales/existing.json",
				"data": "{}"
			},
			{
				"action": "read",
				"filename": "src/application/.locales/existing.json",
				"data": null
			},
			{
				"action": "write",
				"filename": "src/application/.locales/existing.json",
				"data": "{}"
			}
		]);
	});
});

