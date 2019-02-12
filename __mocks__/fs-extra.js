jest.mock('os');

const fs = jest.genMockFromModule('fs-extra');
let increment = 0;

fs.actions = [];

let filesystem = {};

fs.mockReset = () => {
    filesystem = fs.filesystem = {};
    increment = 0;

    fs.mkdtempSync.mockImplementation(() => {
        const filename ='/test/tmp/' + increment;

        increment += 1;

        return filename;
    });

    fs.removeSync.mockImplementation(() => 0);

    fs.statSync.mockImplementation((filename) => {
        return {
            isDirectory() {
                return !filename.endsWith('.js');
            }
        };
    });

    fs.unlinkSync.mockImplementation((filename) => {
        delete filesystem[filename];
    });

    fs.writeFileSync.mockImplementation((filename, data) => {
        fs.actions.push({action: 'write', filename, data});
        filesystem[filename] = data;
    });

    fs.ensureDirSync.mockImplementation((filename) => {
      if (!filesystem[filename]) {
        fs.actions.push({action: 'write', filename});
        filesystem[filename] = true;
      }
    });

    fs.readFileSync.mockImplementation((filename) => {
        fs.actions.push({action: 'read', filename, data: filesystem[filename] || null});

        if (filesystem.hasOwnProperty(filename)) {
            return filesystem[filename];
        }

        const e = new Error("MockError: Filename '" + filename + "' doesn't exist", filename);
        e.code = 'ENOENT';

        throw e;
    });

    fs.actions.length = 0;
};

fs.mockReset();

module.exports = fs;
