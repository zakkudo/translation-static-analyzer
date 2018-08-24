const glob = jest.genMockFromModule('glob');

glob.sync.mockImplementation((pattern) => {
    if (pattern === 'test files') {
        return [
            'src/pages/Search/index.js',
            'src/pages/About/index.js',
            'src/index.js'
        ];
    } else if (pattern === 'test directory targets') {
        return [
            'src/pages/Search',
            'src/pages/About',
            'src/pages/index.js'
        ];
    }

    return [];
});

module.exports = glob;
