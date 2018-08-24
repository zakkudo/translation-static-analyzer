const glob = jest.genMockFromModule('glob');

const files = [
    'src/pages/Search/index.js',
    'src/pages/About/index.js',
    'src/index.js',
    'src/test.js'
];

glob.sync.mockImplementation((pattern) => {
    if (pattern === 'test no files') {
        return [];
    } else if (pattern == 'test removed file') {
        return files.slice(1);
    } else if (pattern === 'test added file') {
        return files.concat(['src/pages/Added/index.js']);
    } else if (pattern === 'test files') {
        return files;
    } else if (pattern === 'test removed directory target') {
        return [
            'src/pages',
            'src/application',
            'src/pages/About',
        ];
    } else if (pattern === 'test added directory target') {
        return [
            'src/pages',
            'src/application',
            'src/pages/About',
            'src/pages/Added',
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
