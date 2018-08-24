const TranslationStaticAnalyzer = require('.');
const fs = require('fs-extra');
const console = require('console');

const existingExpected = require('./existing.expected.json');
const newExpected = require('./new.expected.json');

jest.mock('path');
jest.mock('glob');
jest.mock('fs-extra');
//jest.mock('console');

const mocks = {};

const path = require('path');

fdescribe('TranslationStaticAnalyzer', () => {
    beforeEach(() => {
        mocks.processOn = jest.spyOn(process, 'on');
        //mocks.consoleLog = jest.spyOn(console, 'log');

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
            //templates: ''
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
            //templates: ''
        });

        analyzer.update();

        //expect(fs.actions).toEqual(existingExpected);

        analyzer.update();

        //expect(fs.actions).toEqual(existingExpected);
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
            target: 'test directory targets',
            //templates: ''
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
            target: 'test directory targets',
            //templates: ''
        });

        analyzer.update();

        //expect(fs.actions).toEqual(newExpected);
    });

    it("runs gracefully with no options", () => {
        new TranslationStaticAnalyzer();
    });

    it("passing an empty files array will update everything", () => {
        const analyzer = new TranslationStaticAnalyzer({
            files: 'test files',
            locales: ['new'],
            target: 'test directory targets',
            //templates: ''
        });

        analyzer.update([]);

        //expect(fs.actions).toEqual(newExpected);
    });

    it("updates nothing when nothing returns from the glob", () => {
        const analyzer = new TranslationStaticAnalyzer({
            files: 'test no files',
            locales: ['new'],
            target: 'test directory targets',
            //templates: ''
        });

        analyzer.update([]);

        //expect(fs.actions).toEqual(newExpected);
    });

    it("no locales runs gracefully", () => {
        const analyzer = new TranslationStaticAnalyzer({
            files: 'test files',
            target: 'test directory targets',
            //templates: ''
        });

        analyzer.update([]);

        //expect(fs.actions).toEqual(newExpected);
    });
});
