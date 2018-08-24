const glob = jest.genMockFromModule('glob');

glob.sync.mockImplementation((pattern) => {
    if (pattern === 'test no files') {
        return [];
    }
    else if (pattern === 'test files') {
        return [
            'src/pages/Search/index.js',
            'src/pages/About/index.js',
            'src/index.js',
            'src/test.js'
        ];
    } else if (pattern === 'test directory targets') {
        return [
            'src/pages',
            'src/application',
            'src/pages/Search',
            'src/pages/About',
        ];
    }

    return [];
});

module.exports = glob;
